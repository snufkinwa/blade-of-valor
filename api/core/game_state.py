from typing import Dict, Optional
from api.core.chess_engine import DarkChessEngine

class GameStateManager:
    def __init__(self, settings):
        self.settings = settings
        self.games: Dict[str, DarkChessEngine] = {}
    
    def create_game(self, game_id: str) -> None:
        self.games[game_id] = DarkChessEngine()
    
    def get_game(self, game_id: str) -> Optional[DarkChessEngine]:
        return self.games.get(game_id)
    
    def remove_game(self, game_id: str) -> None:
        if game_id in self.games:
            self.games[game_id].engine.quit()
            del self.games[game_id]