class GameError(Exception):
    """Base class for all game-related errors."""
    pass

class GameLimitExceeded(GameError):
    pass