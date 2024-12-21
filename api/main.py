from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import asyncio
import chess
import os
from datetime import datetime
from pydantic import ValidationError

from api.core.game_state import GameStateManager
from api.config.settings import Settings
from api.exceptions.errors import GameError, GameLimitExceeded

print("Environment Variables Passed to Settings:", os.environ)

settings = Settings()
app = FastAPI()
game_manager = GameStateManager(settings)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

async def cleanup_inactive_games():
    while True:
        now = datetime.now()
        for game_id, last_active in connection_manager.last_activity.copy().items():
            if (now - last_active).seconds > settings.GAME_TIMEOUT:
                game_manager.remove_game(game_id)
                connection_manager.disconnect(game_id)
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_inactive_games())

@app.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    try:
        if len(game_manager.games) >= settings.MAX_GAMES:
            raise GameLimitExceeded("Maximum number of concurrent games reached")
            
        await connection_manager.connect(game_id, websocket)
        
        if game_id not in game_manager.games:
            game_manager.create_game(game_id)
        
        game = game_manager.get_game(game_id)
        
        while True:
            data = await websocket.receive_json()
            connection_manager.last_activity[game_id] = datetime.now()
            
            try:
                if data["type"] == "move":             
                    result = game.make_move(data["move"], data.get("use_dark_power", False))
                    wave = game.get_darkling_wave()
                    stats = game.darkness_system.get_stats()
                    
                    await websocket.send_json({
                        "status": "success",
                        "engine_move": result,
                        "darkling_wave": wave.dict(),
                        "darkness_stats": stats.dict()
                    })
            except ValidationError as e:
                await websocket.send_json({"status": "error", "message": "Invalid request format"})
            except GameError as e:
                await websocket.send_json({"status": "error", "message": str(e)})
                
    except WebSocketDisconnect:
        connection_manager.disconnect(game_id)
        game_manager.remove_game(game_id)
    except Exception as e:
        connection_manager.disconnect(game_id)
        game_manager.remove_game(game_id)
        await websocket.close(code=1011, reason=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    for game_id in list(game_manager.games.keys()):
        game_manager.remove_game(game_id)