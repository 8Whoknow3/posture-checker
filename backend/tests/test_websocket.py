from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)


def wait_for_message(websocket, timeout: float = 5.0):
    """Wait for a WebSocket message."""

    websocket.receive_timeout = timeout
    return websocket.receive_json()


def test_websocket_connection():
    """Test WebSocket connection."""

    with TestClient(app) as client:
        with client.websocket_connect(
            "/ws/posture"
        ) as websocket:
            assert websocket is not None


def test_websocket_posture_result():
    """Test a valid frame and posture result."""

    assert IMAGE_PATH.exists()

    image_bytes = IMAGE_PATH.read_bytes()

    with TestClient(app) as client:
        with client.websocket_connect(
            "/ws/posture"
        ) as websocket:

            websocket.send_bytes(image_bytes)

            message = wait_for_message(
                websocket
            )

            assert message["type"] == "posture_result"
            assert "annotated_image" in message
            assert "view_label" in message
            assert "metrics" in message
            assert "overall" in message
            assert "timestamp_ms" in message

            assert message["annotated_image"].startswith(
                "data:image/jpeg;base64,"
            )

            assert len(message["metrics"]) == 5

            metric_keys = {
                metric["key"]
                for metric in message["metrics"]
            }

            assert metric_keys == {
                "cva",
                "trunk",
                "spine_align",
                "head_tilt",
                "trunk_lateral",
            }

            overall = message["overall"]

            assert "score" in overall
            assert "max_score" in overall
            assert "level" in overall
            assert "level_label" in overall

            assert overall["level"] in {
                "low",
                "medium",
                "high",
            }


def test_websocket_invalid_frame():
    """Test invalid binary frame."""

    with TestClient(app) as client:
        with client.websocket_connect(
            "/ws/posture"
        ) as websocket:

            websocket.send_bytes(
                b"this-is-not-an-image"
            )

            message = wait_for_message(
                websocket
            )

            assert message["type"] == "error"
            assert message["error"] == "Invalid image frame."


def test_websocket_without_person():
    """Test frame without a detectable person."""

    image_path = (
        Path(__file__).resolve().parent
        / "assets"
        / "no_person.jpg"
    )

    assert image_path.exists()

    image_bytes = image_path.read_bytes()

    with TestClient(app) as client:
        with client.websocket_connect(
            "/ws/posture"
        ) as websocket:

            websocket.send_bytes(
                image_bytes
            )

            message = wait_for_message(
                websocket
            )

            assert message["type"] == "error"
            assert message["error"] == "No person detected."


def test_websocket_timestamp_is_present():
    """Test that a processed result contains a timestamp."""

    assert IMAGE_PATH.exists()

    image_bytes = IMAGE_PATH.read_bytes()

    with TestClient(app) as client:
        with client.websocket_connect(
            "/ws/posture"
        ) as websocket:

            websocket.send_bytes(
                image_bytes
            )

            message = wait_for_message(
                websocket
            )

            assert message["type"] == "posture_result"
            assert isinstance(
                message["timestamp_ms"],
                int,
            )
            assert message["timestamp_ms"] > 0