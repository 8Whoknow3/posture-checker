import pytest

from app.vision.pose_detector import PoseDetector


@pytest.fixture
def detector():
    """Provide a PoseDetector and close it after the test."""

    pose_detector = PoseDetector()

    try:
        yield pose_detector
    finally:
        pose_detector.close()