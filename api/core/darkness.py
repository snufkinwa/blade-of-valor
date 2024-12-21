from api.models.enums import DarknessState
from api.models.entities import DarknessStats

class DarknessSystem:
    def __init__(self):
        self.darkness_level = 0
        self.consecutive_light_moves = 0
        self.consecutive_dark_moves = 0
    
    def get_state(self) -> DarknessState:
        if self.darkness_level < 25: return DarknessState.LIGHT
        elif self.darkness_level < 50: return DarknessState.TWILIGHT
        elif self.darkness_level < 75: return DarknessState.SHADOW
        return DarknessState.VOID

    def get_stats(self) -> DarknessStats:
        state = self.get_state()
        return {
            DarknessState.LIGHT: DarknessStats(
                corruption=self.darkness_level,
                clarity=100 - self.darkness_level,
                power_bonus=0.8,
                control=1.0
            ),
            DarknessState.TWILIGHT: DarknessStats(
                corruption=self.darkness_level,
                clarity=100 - self.darkness_level,
                power_bonus=1.0,
                control=0.8
            ),
            DarknessState.SHADOW: DarknessStats(
                corruption=self.darkness_level,
                clarity=100 - self.darkness_level,
                power_bonus=1.2,
                control=0.6
            ),
            DarknessState.VOID: DarknessStats(
                corruption=self.darkness_level,
                clarity=100 - self.darkness_level,
                power_bonus=1.5,
                control=0.3
            )
        }[state]