from pydantic import BaseModel
from typing import List, Optional

class DarklingWave(BaseModel):
    count: int
    health: int
    speed: int
    damage: int

class GameState(BaseModel):
    valid_moves: List[str]
    engine_move: Optional[str]
