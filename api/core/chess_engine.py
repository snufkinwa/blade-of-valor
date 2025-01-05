import chess
import chess.engine
from random import choice
from models.enums import DarknessState, GamePhase
from models.entities import DarklingWave, GameState
from core.darkness import DarknessSystem


class DarkChessEngine:
    def __init__(self, stockfish_path: str = "/usr/local/bin/stockfish"):
        self.board = chess.Board()
        self.darkness_system = DarknessSystem()
        self.base_darkling_count = 3
        self.game_phase = GamePhase.AWAKENING
        self.engine_path = stockfish_path
        self.engine = chess.engine.SimpleEngine.popen_uci(self.engine_path)

    def get_engine_move(self) -> str:
        """Get the best move from the engine."""
        try:
            result = self.engine.play(self.board, chess.engine.Limit(time=1.0))
            return result.move.uci()
        except Exception as e:
            print(f"Error getting engine move: {e}")
            return ""

    def make_move(self, move_uci: str, use_dark_power: bool = False) -> GameState:
        """Process a player move and get the engine's response."""
        try:
            move = chess.Move.from_uci(move_uci)
            if move not in self.board.legal_moves:
                raise ValueError("Illegal move")

            self.board.push(move)

            if use_dark_power:
                self.darkness_system.increase_corruption()

            engine_move = self.get_engine_move()
            if engine_move:
                self.board.push(chess.Move.from_uci(engine_move))

            stats = self.darkness_system.get_stats()
            wave = self.get_darkling_wave()

            return GameState(
                valid_moves=[m.uci() for m in self.board.legal_moves],
                engine_move=engine_move,
                darkling_wave=wave,
                darkness_stats=stats
            )

        except ValueError as e:
            print(f"Invalid move: {e}")
            raise
        except Exception as e:
            print(f"Error in make_move: {e}")
            raise

    def evaluate_position(self) -> float:
        """Evaluate the current board position."""
        try:
            analysis = self.engine.analyse(self.board, chess.engine.Limit(time=0.1))
            return analysis["score"].relative.score(mate_score=10000)
        except Exception as e:
            print(f"Error evaluating position: {e}")
            return 0

    def get_darkling_wave(self) -> DarklingWave:
        """Generate the current darkling wave based on board state."""
        stats = self.darkness_system.get_stats()
        corruption_factor = 1 + (stats.corruption / 100)
        total_darklings = int(self.base_darkling_count * corruption_factor)

        return DarklingWave(
            count=total_darklings,
            health=100 + total_darklings * 10,
            speed=100 + total_darklings * 5,
            damage=10 + total_darklings * 2,
            corruption_level=int(stats.corruption)
        )

    def __del__(self):
        """Ensure the engine is properly closed."""
        self.engine.quit()
