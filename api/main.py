import boto3
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import asyncio
import uuid
from datetime import datetime
from pydantic import ValidationError

from core.game_state import GameStateManager
from exceptions.errors import GameError, GameLimitExceeded

GAME_TIMEOUT = 600
MAX_GAMES = 10

app = FastAPI()
game_manager = GameStateManager() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
leaderboard_table = dynamodb.Table('Leaderboard')

# Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.last_activity: Dict[str, datetime] = {}

    async def connect(self, game_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[game_id] = websocket
        self.last_activity[game_id] = datetime.now()

    def disconnect(self, game_id: str):
        self.active_connections.pop(game_id, None)
        self.last_activity.pop(game_id, None)

connection_manager = ConnectionManager()

def generate_game_id(): 
    return f"GAME#{uuid.uuid4()}"
    
# Cleanup inactive games
async def cleanup_inactive_games():
    while True:
        try:
            now = datetime.now()
            for game_id, last_active in connection_manager.last_activity.copy().items():
                if (now - last_active).seconds > GAME_TIMEOUT:
                    game_manager.remove_game(game_id)
                    connection_manager.disconnect(game_id)
            await asyncio.sleep(60)
        except Exception as e:
            print(f"Error in cleanup task: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_inactive_games())

@app.get("/")
async def root():
    return {"message": "Welcome to the Chess Game API"}

class LeaderboardSubmission(BaseModel):
    gameId: str
    nickname: str
    score: Optional[int] = None

@app.post("/submit_score")
async def submit_score(submission: LeaderboardSubmission):
    try:
        # Use gameId and nickname as keys
        response = leaderboard_table.get_item(
            Key={"gameId": submission.gameId, "nickname": submission.nickname}
        )

        if "Item" in response:
            existing_score = response["Item"]["score"]
            if submission.score > existing_score:
                leaderboard_table.update_item(
                    Key={"gameId": submission.gameId, "nickname": submission.nickname},
                    UpdateExpression="SET score = :score",
                    ExpressionAttributeValues={":score": submission.score},
                )
                return {"message": "Score updated successfully"}
            else:
                return {"message": "Existing score is higher. No update made."}
        else:
            leaderboard_table.put_item(
                Item={
                    "gameId": submission.gameId,
                    "nickname": submission.nickname,
                    "score": submission.score,
                }
            )
            return {"message": "Score submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting score: {str(e)}")

@app.get("/leaderboard/{game_id}")
async def get_leaderboard(game_id: str, limit: int = 10):
    try:
        # Query scores for a specific gameId
        response = leaderboard_table.query(
            KeyConditionExpression="gameId = :gameId",
            ExpressionAttributeValues={":gameId": game_id},
            ScanIndexForward=False,  # Descending order by score
            Limit=limit,
        )
        return response.get("Items", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving leaderboard: {str(e)}")

@app.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    try:
        game_id = generate_game_id()
        print(f"WebSocket connection established for game_id: {game_id}")
        await connection_manager.connect(game_id, websocket)

        if game_id not in game_manager.games:
            print(f"Creating new game for game_id: {game_id}")
            game_manager.create_game(game_id)

        game = game_manager.get_game(game_id)
        if not game:
            print("Failed to initialize game")
            await websocket.close(code=1011, reason="Failed to initialize game")
            return

        game_over = False

        while not game_over:
            try:
                # Receive and validate incoming message
                data = await websocket.receive_json()
                connection_manager.last_activity[game_id] = datetime.now()
                print(f"Received data: {data}")

                if "type" not in data:
                    await websocket.send_json({"status": "error", "message": "Missing 'type' field"})
                    continue

                if data["type"] == "move":
                    # Validate required fields for 'move'
                    if "health" not in data or "darkling_count" not in data:
                        await websocket.send_json({
                            "status": "error",
                            "message": "Missing 'health' or 'darkling_count' in move request"
                        })
                        continue

                    health = data["health"]
                    darkling_count = data["darkling_count"]
                    print(f"Processing move: Health={health}, Darkling Count={darkling_count}")

                    # Update darkness system and make a move
                    game.darkness_system.update_state(health, darkling_count)
                    result = game.make_move()
                    print(f"Engine move result: {result}")

                    if result["status"] == "game_over":
                        game_over = True
                        score = game._get_position_evaluation()

                        # Submit score to leaderboard
                        nickname = data.get("nickname", f"Guest_{game_id}")
                        await submit_score(LeaderboardSubmission(nickname=nickname, score=score))

                        # Notify frontend of game over
                        await websocket.send_json({
                            "status": "game_over",
                            "reason": result["reason"],
                            "score": score
                        })
                        break

                    # Send move result to frontend
                    await websocket.send_json({
                        "status": "success",
                        "engine_move": result,
                        "darkling_wave": game.get_darkling_wave().dict()
                    })
                else:
                    await websocket.send_json({
                        "status": "error",
                        "message": f"Invalid message type: {data['type']}"
                    })

            except WebSocketDisconnect:
                print(f"Client disconnected: {game_id}")
                break
            except ValidationError as e:
                print(f"Validation error: {e}")
                await websocket.send_json({"status": "error", "message": "Invalid request format"})
            except GameError as e:
                print(f"Game error: {e}")
                await websocket.send_json({"status": "error", "message": str(e)})
            except Exception as e:
                print(f"Unexpected error: {e}")
                await websocket.send_json({"status": "error", "message": "Internal server error"})

    except WebSocketDisconnect:
        print(f"Client disconnected: {game_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connection_manager.disconnect(game_id)
        game_manager.remove_game(game_id)


@app.on_event("shutdown")
async def shutdown_event():
    for game_id in list(game_manager.games.keys()):
        game_manager.remove_game(game_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5328)
