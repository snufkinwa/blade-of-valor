from random import choice
from stockfish import Stockfish
from models.enums import DarknessState, GamePhase
from models.entities import DarklingWave, GameState
from core.darkness import DarknessSystem
from config.settings import Settings
from typing import List
import chess

class DarkChessEngine:
    def __init__(self, settings: Settings):
        self.board = chess.Board()
        self.stockfish = Stockfish(path=settings.STOCKFISH_PATH)
        self.darkness_system = DarknessSystem()
        self.base_darkling_count = 3
        self.game_phase = GamePhase.AWAKENING
        self._configure_engine(settings)

    def _configure_engine(self, settings: Settings):
        state = self.darkness_system.get_state()
        skill_levels = {
            DarknessState.LIGHT: settings.ENGINE_DIFFICULTY,    
            DarknessState.TWILIGHT: int(settings.ENGINE_DIFFICULTY * 0.75), 
            DarknessState.SHADOW: int(settings.ENGINE_DIFFICULTY * 0.5),   
            DarknessState.VOID: int(settings.ENGINE_DIFFICULTY * 0.25)      
        }
        self.stockfish.set_skill_level(skill_levels[state])
        self.stockfish.update_engine_parameters({
            "Threads": settings.ENGINE_THREADS,
            "Hash": settings.ENGINE_HASH
        })

    def calculate_move_quality(self, darkness_state: DarknessState) -> float:
        state_weights = {
            DarknessState.LIGHT: 1.0,     
            DarknessState.TWILIGHT: 0.7, 
            DarknessState.SHADOW: 0.4,   
            DarknessState.VOID: 0.1      
        }
        return state_weights[darkness_state]

    def get_moves(self, darkness_state: DarknessState) -> List[chess.Move]:
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

    def get_game_stage(self) -> str:
        evaluation = self.evaluate_position()
        material_count = len(self.board.piece_map())
        
        if material_count > 28:  # Opening
            return "AWAKENING" 
        elif material_count > 15:  # Middlegame
            return "CORRUPTION"
        else:  # Endgame
            return "FINAL_BATTLE"
            
    def get_darkling_wave(self) -> DarklingWave:
        try:
            evaluation = self.evaluate_position()
            stats = self.darkness_system.get_stats()
            phase_multipliers = {
                GamePhase.AWAKENING: 1.0,
                GamePhase.CORRUPTION: 1.5,
                GamePhase.FINAL_BATTLE: 2.0,
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

    def make_move(self, move_uci: str, use_dark_power: bool = False) -> GameState:
        # Validate and make player move
        try:
            move = chess.Move.from_uci(move_uci)
            if move not in self.board.legal_moves:
                raise ValueError("Illegal move")
            self.board.push(move)
        except ValueError as e:
            raise ValueError(f"Invalid move: {e}")

        # Update darkness system
        if use_dark_power:
            self.darkness_system.increase_corruption()
        
        # Get engine's response
        self.stockfish.set_position([move.uci() for move in self.board.move_stack])
        engine_move = self.stockfish.get_best_move()
        
        if engine_move:
            self.board.push(chess.Move.from_uci(engine_move))

        # Generate response state
        stats = self.darkness_system.get_stats()
        wave = self.get_darkling_wave()
        
        return GameState(
            valid_moves=[m.uci() for m in self.board.legal_moves],
            engine_move=engine_move,
            darkling_wave=wave,
            darkness_stats=stats
        )

    def __del__(self):
        try:
            self.engine.quit()
        except:
            pass