import chess
import chess.engine
from random import random, choice
from models.enums import DarknessState
from models.entities import DarklingWave, GameState
from core.darkness import DarknessSystem


class DarkChessEngine:
    def __init__(self, stockfish_path: str = "/usr/local/bin/stockfish"):
        """Initialize the chess engine and game state."""
        self.board = chess.Board()
        self.engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
        self.darkness_system = DarknessSystem()
        self.base_darkling_count = 3

    def calculate_move_quality(self, darkness_state: DarknessState) -> float:
        """Calculate the probability of selecting high-quality moves."""
        state_weights = {
            DarknessState.LIGHT: 1.0,     # Best moves in light
            DarknessState.TWILIGHT: 0.7,  
            DarknessState.SHADOW: 0.4,    
            DarknessState.VOID: 0.1       # Mostly random moves in void
        }
        return state_weights[darkness_state]

    def get_moves(self, darkness_state: DarknessState) -> list[chess.Move]:
        """
        Get the next set of moves based on the darkness state.
        - LIGHT: Best moves from analysis.
        - TWILIGHT/SHADOW: Mix of analysis and random moves.
        - VOID: Mostly random moves.
        """
        move_quality = self.calculate_move_quality(darkness_state)
        legal_moves = list(self.board.legal_moves)

        # Random moves based on darkness
        if random() > move_quality:
            return [choice(legal_moves)]

        # Analyze position and retrieve multiple options
        try:
            analysis = self.engine.analyse(
                self.board,
                chess.engine.Limit(depth=12),
                multipv=3
            )
            moves = [
                pv["pv"][0] for pv in analysis if "pv" in pv and pv["pv"][0] in legal_moves
            ]
            return moves if moves else [choice(legal_moves)]
        except Exception as e:
            print(f"Analysis error: {e}")
            return [choice(legal_moves)]

    def make_move(self) -> str:
        """Make a move based on current darkness state"""
        darkness_state = self.darkness_system.get_state()
        moves = self.get_moves(darkness_state)
        chosen_move = choice(moves)
        
        try:
            self.board.push(chosen_move)
        except ValueError as e:
            print(f"Illegal move error: {e}")
            chosen_move = choice(list(self.board.legal_moves))
            self.board.push(chosen_move)
        
        return chosen_move.uci()

    def get_darkling_wave(self) -> DarklingWave:
        """Generate darkling wave based on evaluation and current state"""
        evaluation = self._get_position_evaluation()
        darkness_state = self.darkness_system.get_state()
        
        # Base multiplier on darkness state directly
        state_multipliers = {
            DarknessState.LIGHT: 1.0,
            DarknessState.TWILIGHT: 1.2,
            DarknessState.SHADOW: 1.4,
            DarknessState.VOID: 1.6
        }
        
        wave_modifier = max(0.5, min(1.5, abs(evaluation) / 1000))
        multiplier = state_multipliers[darkness_state]
        
        count = max(1, int(self.base_darkling_count * multiplier * wave_modifier))
        
        return DarklingWave(
            count=count,
            health=100 + count * 10,
            speed=100 + count * 5,
            damage=10 + count * 2
        )

    def _get_position_evaluation(self) -> float:
        """Evaluate the current board position."""
        try:
            result = self.engine.analyse(
                self.board,
                chess.engine.Limit(time=0.05, depth=10)
            )
            return result["score"].relative.score(mate_score=10000) or 0
        except Exception:
            return 0

    def __del__(self):
        """Ensure clean shutdown of the chess engine."""
        try:
            self.engine.quit()
        except chess.engine.EngineTerminatedError:
            pass
        except Exception as e:
            print(f"Error during engine shutdown: {e}")
