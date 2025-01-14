import chess
import chess.engine
from random import random, choice
from models.enums import DarknessState
from models.entities import DarklingWave, GameState
from core.darkness import DarknessSystem
import time


class DarkChessEngine:
    def __init__(self, stockfish_path: str = "/usr/local/bin/stockfish", time_limit: float = 0.50):
        """Initialize the chess engine and game state."""
        try:
            self.board = chess.Board()
            self.engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
            print(f"Stockfish initialized successfully at {stockfish_path}")
        except Exception as e:
            print(f"Failed to initialize Stockfish: {e}")
        self.darkness_system = DarknessSystem()
        self.base_darkling_count = 3
        self.time_limit = time_limit
        self.remaining_time = {"player": time_limit, "opponent": time_limit}
        self.start_time = None


    def calculate_move_quality(self, darkness_state: DarknessState) -> float:
        """Calculate the probability of selecting high-quality moves."""
        state_weights = {
            DarknessState.LIGHT: 1.0,     # Best moves in light
            DarknessState.TWILIGHT: 0.7,  
            DarknessState.SHADOW: 0.4,    
            DarknessState.VOID: 0.1       # Mostly random moves in void
        }
        return state_weights.get(darkness_state, 0.5) 
        

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
            print(f"Analyzing position with Stockfish for darkness state: {darkness_state}")
            analysis = self.engine.analyse(
                self.board,
                chess.engine.Limit(time=self.time_limit),  
                multipv=3
            )
            moves = [
                pv["pv"][0] for pv in analysis if "pv" in pv and pv["pv"][0] in legal_moves
            ]
            print(f"Stockfish analysis complete. Moves: {moves}")
            return moves if moves else [choice(legal_moves)]
        except Exception as e:
            print(f"Analysis error: {e}")
            return [choice(legal_moves)]

    def make_move(self) -> dict:
        """
        Make a move based on current darkness state and return the result.
        Includes checks for game termination states (checkmate or draw).
        """
        darkness_state = self.darkness_system.get_state()
        moves = self.get_moves(darkness_state)
        chosen_move = choice(moves)

        try:
            self.board.push(chosen_move)
        except ValueError as e:
            print(f"Illegal move error: {e}")
            chosen_move = choice(list(self.board.legal_moves))
            self.board.push(chosen_move)

        # Check for game termination conditions
        if self.board.is_checkmate():
            return {
                "status": "game_over",
                "reason": "checkmate",
                "move": chosen_move.uci()
            }
        elif self.board.is_stalemate() or self.board.is_insufficient_material() or self.board.is_seventyfive_moves():
            return {
                "status": "game_over",
                "reason": "draw",
                "move": chosen_move.uci()
            }

        # Continue game
        return {
            "status": "continue",
            "move": chosen_move.uci()
        }

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

    def get_game_score(self) -> int:
        """Calculate a simple game score based only on darkness level"""
        try:
            # Base score of 1000
            base_score = 1000
            
            # Get darkness level (0-100) and use it as a multiplier (1.0 to 2.0)
            multiplier = 1.0 + (random.gammavariate(2, 1) / 100)
            
            # Calculate final score
            final_score = int(base_score * multiplier)
            
            return final_score
            
        except Exception as e:
            print(f"Error calculating score: {e}")
            return 1000

    def __del__(self):
        """Ensure clean shutdown of the chess engine."""
        try:
            self.engine.quit()
        except chess.engine.EngineTerminatedError:
            pass
        except Exception as e:
            print(f"Error during engine shutdown: {e}")
