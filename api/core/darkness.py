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
        darkness = ((100 - self.health) + (self.darkling_count * 10))/2
        
        if darkness < 25: return DarknessState.LIGHT
        elif darkness < 50: return DarknessState.TWILIGHT  
        elif darkness < 75: return DarknessState.SHADOW
        return DarknessState.VOID

   