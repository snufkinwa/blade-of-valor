from random import random, choice
import chess.engine
from api.models.enums import DarknessState, GamePhase
from api.models.entities import DarklingWave, GameState
from api.core.darkness import DarknessSystem

class DarkChessEngine:
    def __init__(self):
        self.board = chess.Board()
        self.engine = chess.engine.SimpleEngine.popen_uci("stockfish")
        self.darkness_system = DarknessSystem()
        self.base_darkling_count = 3
        self.game_phase = GamePhase.AWAKENING
        self._configure_engine()

    def _configure_engine(self):
        state = self.darkness_system.get_state()
        skill_levels = {
            DarknessState.LIGHT: 20,    
            DarknessState.TWILIGHT: 15, 
            DarknessState.SHADOW: 10,   
            DarknessState.VOID: 5      
        }
        self.engine.configure({
            "Skill Level": skill_levels[state],
            "Threads": 2,
            "Hash": 512
        })

    def calculate_move_quality(self, darkness_state: DarknessState) -> float:
        state_weights = {
            DarknessState.LIGHT: 1.0,     
            DarknessState.TWILIGHT: 0.7, 
            DarknessState.SHADOW: 0.4,   
            DarknessState.VOID: 0.1      
        }
        return state_weights[darkness_state]

    def get_moves(self, darkness_state: DarknessState) -> list[chess.Move]:
        try:
            move_quality = self.calculate_move_quality(darkness_state)
            legal_moves = list(self.board.legal_moves)
            
            if not legal_moves:
                return []

            if random() > move_quality:
                return [choice(legal_moves)]

            self._configure_engine()
            analysis = self.engine.analyse(
                self.board,
                chess.engine.Limit(depth=max(1, int(20 * move_quality))),
                multipv=3
            )
            
            analyzed_moves = []
            for pv in analysis:
                move = pv["pv"][0] if pv.get("pv") else None
                if move and move in legal_moves:
                    analyzed_moves.append(move)
            
            return analyzed_moves if analyzed_moves else [choice(legal_moves)]
            
        except Exception as e:
            print(f"Engine analysis failed: {e}")
            return [choice(list(self.board.legal_moves))]

    def evaluate_position(self) -> float:
        try:
            result = self.engine.analyse(self.board, chess.engine.Limit(time=0.1))
            return result["score"].relative.score(mate_score=10000)
        except Exception as e:
            print(f"Position evaluation failed: {e}")
            return 0

    def get_darkling_wave(self) -> DarklingWave:
        try:
            evaluation = self.evaluate_position()
            stats = self.darkness_system.get_stats()
            phase_multipliers = {
                GamePhase.AWAKENING: 1.0,
                GamePhase.CORRUPTION: 1.5,
                GamePhase.FINAL_BATTLE: 2.0,
                GamePhase.ENDGAME: 2.5
            }
            evaluation = max(-500, min(500, evaluation))
            chess_factor = max(1, abs(min(0, evaluation)) / 100)
            darkness_factor = 1 + (stats.corruption / 100)
            total_factor = chess_factor * darkness_factor * phase_multipliers.get(self.game_phase, 1.0)

            return DarklingWave(
                count=int(self.base_darkling_count * total_factor),
                health=100 + int(20 * total_factor),
                speed=100 + int(10 * total_factor),
                damage=10 + int(5 * total_factor),
                corruption_level=int(stats.corruption)
            )
        except Exception as e:
            print(f"Failed to generate darkling wave: {e}")
            return DarklingWave(
                count=self.base_darkling_count,
                health=100,
                speed=100,
                damage=10,
                corruption_level=0
            )

    def make_move(self, use_dark_power: bool) -> GameState:
        if use_dark_power:
            self.darkness_system.increase_corruption()
        darkness_state = self.darkness_system.get_state()
        moves = self.get_moves(darkness_state)
        chosen_move = choice(moves)
        self.board.push(chosen_move)
        
        stats = self.darkness_system.get_stats()
        return GameState(
            move=chosen_move.uci(),
            darkling_wave=self.get_darkling_wave(),
            darkness_stats=stats
        )

    def __del__(self):
        try:
            self.engine.quit()
        except:
            pass