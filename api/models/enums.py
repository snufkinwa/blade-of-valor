from enum import Enum

class GamePhase(Enum):
    AWAKENING = 1
    CORRUPTION = 2
    FINAL_BATTLE = 3

class DarknessState(Enum):
    Light = "light"
    Twilight = "twilight"
    Shadow = "shadow"
    Void = "void"