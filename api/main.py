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
MAX_GAMES = 5

app = FastAPI()
game_manager = GameStateManager() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    try:
        game_id = generate_game_id()
        print(f"WebSocket connection established for game_id: {game_id}")

        if len(game_manager.games) >= MAX_GAMES:
            print("Game limit exceeded")
            await websocket.accept()  # Accept the connection to send a message
            await websocket.send_json({"status": "error", "message": "Game limit exceeded"})
            await websocket.close(code=1013, reason="Game limit exceeded")  # Close with appropriate code
            return

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
                        game = game_manager.get_game(game_id)
                        final_score = game.get_game_score() if game else 0
                        
                        await websocket.send_json({
                            "status": "game_over",
                            "reason": result["reason"],
                            "score": final_score,
                            "gameId": game_id
                        })
                        break

                    await websocket.send_json({
                        "status": "success",
                        "engine_move": result,
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
