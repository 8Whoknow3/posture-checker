import time
from pathlib import Path

import cv2

from app.vision.pose_detector import PoseDetector


IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)


# ============================================================
# IMAGE MODE
# ============================================================

def test_pose_detector_detects_pose():
    """Test pose detection in IMAGE mode."""

    assert IMAGE_PATH.exists()

    frame = cv2.imread(str(IMAGE_PATH))

    assert frame is not None

    detector = PoseDetector()

    try:
        result = detector.detect(frame)

        assert result is not None
        assert result.pose_landmarks
        assert result.pose_world_landmarks

        assert len(result.pose_landmarks[0]) == 33
        assert len(result.pose_world_landmarks[0]) == 33

    finally:
        detector.close()


# ============================================================
# LIVE STREAM MODE
# ============================================================

def test_pose_detector_live_stream():
    """Test asynchronous LIVE_STREAM detection."""

    assert IMAGE_PATH.exists()

    frame = cv2.imread(str(IMAGE_PATH))

    assert frame is not None

    received = []

    def callback(
        result,
        image,
        timestamp_ms,
    ):
        received.append(
            (
                result,
                image,
                timestamp_ms,
            )
        )

    detector = PoseDetector()

    live_detector = detector.create_live_detector(
        callback
    )

    try:
        mp_image = detector.frame_to_mp_image(
            frame
        )

        live_detector.detect_async(
            mp_image,
            1,
        )

        deadline = time.monotonic() + 5

        while (
            not received
            and time.monotonic() < deadline
        ):
            time.sleep(0.05)

        assert received

        result, image, timestamp_ms = received[-1]

        assert result is not None
        assert image is not None

        assert result.pose_landmarks
        assert result.pose_world_landmarks

        assert timestamp_ms == 1

        assert len(
            result.pose_landmarks[0]
        ) == 33

        assert len(
            result.pose_world_landmarks[0]
        ) == 33

    finally:
        live_detector.close()
        detector.close()


# ============================================================
# LIVE STREAM CALLBACK
# ============================================================

def test_live_stream_callback_is_called():
    """Test that LIVE_STREAM invokes the callback."""

    assert IMAGE_PATH.exists()

    frame = cv2.imread(str(IMAGE_PATH))

    assert frame is not None

    received = []

    def callback(
        result,
        image,
        timestamp_ms,
    ):
        received.append(
            (
                result,
                image,
                timestamp_ms,
            )
        )

    detector = PoseDetector()

    live_detector = detector.create_live_detector(
        callback
    )

    try:
        mp_image = detector.frame_to_mp_image(
            frame
        )

        live_detector.detect_async(
            mp_image,
            1000,
        )

        deadline = time.monotonic() + 5

        while (
            not received
            and time.monotonic() < deadline
        ):
            time.sleep(0.05)

        assert len(received) >= 1

        result, image, timestamp_ms = (
            received[0]
        )

        assert result is not None
        assert image is not None
        assert timestamp_ms == 1000

    finally:
        live_detector.close()
        detector.close()


# ============================================================
# MODEL PATH
# ============================================================

def test_pose_model_exists():
    """Test that the MediaPipe model exists."""

    detector = PoseDetector()

    try:
        model_path = detector._get_model_path()

        assert model_path.exists()
        assert model_path.is_file()

    finally:
        detector.close()