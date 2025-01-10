from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import asyncio
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
        if len(game_manager.games) >= MAX_GAMES:
            await websocket.close(code=1008, reason="Maximum number of concurrent games reached")
            return

        await connection_manager.connect(game_id, websocket)

        if game_id not in game_manager.games:
            game_manager.create_game(game_id)

        game = game_manager.get_game(game_id)
        if not game:
            await websocket.close(code=1011, reason="Failed to initialize game")
            return

        while True:
            try:
                data = await websocket.receive_json()
                connection_manager.last_activity[game_id] = datetime.now()
                
                if data["type"] == "test-message":
                    await websocket.send_json({
                        "status": "success",
                        "type": "test-message",
                        "message": "Test message received successfully.",
                    })
                elif data["type"] == "move":
                    # Now receiving health and darkling_count from frontend
                    health = data.get("health", 100)
                    darkling_count = data.get("darkling_count", 0)
                    
                    # Update darkness system with current state
                    game.darkness_system.update_state(health, darkling_count)
                    
                    # Make move based on current state
                    result = game.make_move()
                    
                    await websocket.send_json({
                        "status": "success",
                        "engine_move": result,
                        "darkling_wave": game.get_darkling_wave().dict()
                    })
                else:
                    await websocket.send_json({
                        "status": "error",
                        "message": "Invalid message type"
                    })

            except WebSocketDisconnect:
                break
            except ValidationError:
                await websocket.send_json({
                    "status": "error",
                    "message": "Invalid request format"
                })
            except GameError as e:
                await websocket.send_json({
                    "status": "error",
                    "message": str(e)
                })
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send_json({
                    "status": "error",
                    "message": "Internal server error"
                })

    except WebSocketDisconnect:
        print(f"Client disconnected: {game_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Clean up resources in any case
        connection_manager.disconnect(game_id)
        game_manager.remove_game(game_id)


@app.on_event("shutdown")
async def shutdown_event():
    for game_id in list(game_manager.games.keys()):
        game_manager.remove_game(game_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5328)
