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

    def make_move(self, use_dark_power: bool = False) -> GameState:
        """
        Make a move for the engine based on darkness state.
        - Increase corruption if dark power is used.
        - Select move based on quality and darkness influence.
        """
        if use_dark_power:
            self.darkness_system.increase_corruption()

        darkness_state = self.darkness_system.get_state()
        moves = self.get_moves(darkness_state)
        chosen_move = choice(moves)

        try:
            self.board.push(chosen_move)
        except ValueError as e:
            print(f"Illegal move error: {e}")
            chosen_move = choice(list(self.board.legal_moves))
            self.board.push(chosen_move)

        # Generate game state response
        stats = self.darkness_system.get_stats()
        return GameState(
            move=chosen_move.uci(),
            darkling_wave=self.get_darkling_wave(),
            darkness_stats=stats
        )

    def get_darkling_wave(self) -> DarklingWave:
        """
        Generate darkling wave stats based on board state and corruption level.
        """
        stats = self.darkness_system.get_stats()
        evaluation = self._get_position_evaluation()

        # Modify wave stats based on position and darkness influence
        corruption_factor = 1 + (stats.corruption / 100)
        wave_modifier = max(0.5, min(1.5, abs(evaluation) / 1000))

        count = max(1, int(self.base_darkling_count * corruption_factor * wave_modifier))
        health = max(50, 100 + count * 10)
        speed = 100 + count * 5
        damage = 10 + count * 2

        return DarklingWave(
            count=count,
            health=health,
            speed=speed,
            damage=damage,
            corruption_level=int(stats.corruption)
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
