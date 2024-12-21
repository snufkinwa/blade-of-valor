from pydantic import BaseModel
from typing import List, Optional

class DarknessStats(BaseModel):
    corruption: float
    clarity: float
    power_bonus: float
    control: float

class DarklingWave(BaseModel):
    count: int
    health: int
    speed: int
    damage: int
    corruption_level: int

class GameState(BaseModel):
    valid_moves: List[str]
    engine_move: Optional[str]
    darkling_wave: DarklingWave
    darkness_stats: DarknessStats