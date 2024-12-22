from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    STOCKFISH_PATH: str = "/usr/local/bin/stockfish"
    ENGINE_DIFFICULTY: int = 20
    ENGINE_THREADS: int = 2
    ENGINE_HASH: int = 512
    GAME_TIMEOUT: int = 3600
    MAX_GAMES: int = 100

    class Config:
        env_file = ".env"
        env_prefix = "APP_"
    def __init__(self, **data):
        data.pop("PYTHONPATH", None)  # Remove PYTHONPATH if present
        super().__init__(**data)