from models.enums import DarknessState
 
class DarknessSystem:
    def __init__(self):
        self.health = 100
        self.darkling_count = 0
    
    def update_state(self, health: float, darkling_count: int):
        self.health = health
        self.darkling_count = darkling_count
        
    def get_state(self) -> DarknessState:
        # Combined impact of low health and many darklings
        darkness = ((100 - self.health) + (self.darkling_count * 10)) / 2
        print(f"Health: {self.health}, Darkling Count: {self.darkling_count}, Darkness: {darkness}")

        if darkness < 25:
            print("Darkness State: LIGHT")
            return DarknessState.LIGHT
        elif darkness < 50:
            print("Darkness State: TWILIGHT")
            return DarknessState.TWILIGHT
        elif darkness < 75:
            print("Darkness State: SHADOW")
            return DarknessState.SHADOW
        print("Darkness State: VOID")
        return DarknessState.VOID


   