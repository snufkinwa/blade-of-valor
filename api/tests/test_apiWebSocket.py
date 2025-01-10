import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from datetime import datetime, timedelta
from api.main import app, connection_manager, game_manager
from api.exceptions.errors import GameLimitExceeded


@pytest.fixture
def test_client():
    return TestClient(app, base_url="http://localhost:5328")


@pytest.fixture(autouse=True)
def clear_game_state():
    game_manager.games.clear()
    connection_manager.active_connections.clear()
    connection_manager.last_activity.clear()
    yield


def test_websocket_connection(test_client):
    with test_client.websocket_connect("/ws/test_game") as websocket:
        assert "test_game" in game_manager.games
        assert "test_game" in connection_manager.active_connections
        websocket.close()


def test_game_limit_exceeded(test_client):
    with patch("api.main.settings.MAX_GAMES", 1):
        # Connect the first game
        with test_client.websocket_connect("/ws/game1"):
            pass
        # Try connecting another game and expect an exception
        with pytest.raises(Exception):
            test_client.websocket_connect("/ws/game2")


def test_valid_move(test_client):
    with test_client.websocket_connect("/ws/test_game") as websocket:
        websocket.send_json({"type": "move", "move": "e2e4"})
        response = websocket.receive_json()

        assert response["status"] == "success"
        assert "engine_move" in response
        assert "darkling_wave" in response

def test_game_cleanup_on_disconnect(test_client):
    with test_client.websocket_connect("/ws/test_game"):
        assert "test_game" in game_manager.games
        assert "test_game" in connection_manager.active_connections

    # After disconnection, the game and connection should be cleaned up
    assert "test_game" not in game_manager.games
    assert "test_game" not in connection_manager.active_connections


@pytest.mark.asyncio
async def test_cleanup_inactive_games():
    game_id = "inactive_test"

    # Simulate an active game
    with TestClient(app).websocket_connect(f"/ws/{game_id}"):
        connection_manager.last_activity[game_id] = datetime.now() - timedelta(hours=2)

    # Run cleanup
    await asyncio.sleep(1)  # Allow cleanup to execute
    assert game_id not in game_manager.games
    assert game_id not in connection_manager.active_connections


def test_invalid_request_format(test_client):
    with test_client.websocket_connect("/ws/test_game") as websocket:
        websocket.send_json({"type": "invalid_type"})
        response = websocket.receive_json()

        assert response["status"] == "error"
        assert "message" in response


def test_game_creation_on_first_connection(test_client):
    game_id = "new_game"
    with test_client.websocket_connect(f"/ws/{game_id}"):
        assert game_id in game_manager.games
    assert game_id not in game_manager.games  # Verify cleanup after disconnection
