from pathlib import Path

import cv2
import numpy as np
import pytest

from app.core.exceptions import (
    PoseNotDetectedError,
    WorldLandmarksUnavailableError,
)
from app.services.posture_service import PostureService
from app.vision.pose_detector import PoseDetector


IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)


# ============================================================
# ANALYSIS
# ============================================================

def test_posture_service_analyzes_frame():
    """Test posture analysis from an image frame."""

    assert IMAGE_PATH.exists()

    frame = cv2.imread(str(IMAGE_PATH))

    assert frame is not None

    detector = PoseDetector()
    service = PostureService(detector)

    try:
        result = service.analyze_frame(frame)

        assert "analysis" in result
        assert "annotated_image" in result

        analysis = result["analysis"]

        assert "metrics" in analysis
        assert "overall" in analysis
        assert "points" in analysis
        assert "view_label" in analysis

        assert len(
            analysis["metrics"]
        ) == 5

        annotated_image = (
            result["annotated_image"]
        )

        assert isinstance(
            annotated_image,
            np.ndarray,
        )

        assert (
            annotated_image.shape
            == frame.shape
        )

    finally:
        detector.close()


# ============================================================
# NO POSE
# ============================================================

def test_posture_service_raises_when_pose_is_missing():
    """Test the missing-pose error."""

    class FakeDetector:

        def detect(self, frame):
            class FakeResult:
                pose_landmarks = []
                pose_world_landmarks = []

            return FakeResult()

    service = PostureService(
        FakeDetector()
    )

    frame = np.zeros(
        (100, 100, 3),
        dtype=np.uint8,
    )

    with pytest.raises(
        PoseNotDetectedError,
        match="No person detected",
    ):
        service.analyze_frame(frame)


# ============================================================
# MISSING WORLD LANDMARKS
# ============================================================

def test_posture_service_raises_when_world_landmarks_are_missing():
    """Test the missing 3D landmark error."""

    class FakeLandmark:
        x = 0.5
        y = 0.5
        z = 0.0
        visibility = 1.0

    class FakeDetector:

        def detect(self, frame):
            class FakeResult:
                pose_landmarks = [
                    [
                        FakeLandmark()
                        for _ in range(33)
                    ]
                ]

                pose_world_landmarks = []

            return FakeResult()

    service = PostureService(
        FakeDetector()
    )

    frame = np.zeros(
        (100, 100, 3),
        dtype=np.uint8,
    )

    with pytest.raises(
        WorldLandmarksUnavailableError,
        match="3D pose landmarks are unavailable",
    ):
        service.analyze_frame(frame)


# ============================================================
# LANDMARK ANALYSIS
# ============================================================

def test_posture_service_analyzes_landmarks():
    """Test analysis using already detected landmarks."""

    class FakeLandmark:
        x = 0.5
        y = 0.5
        z = 0.0
        visibility = 1.0

    landmarks_2d = [
        FakeLandmark()
        for _ in range(33)
    ]

    landmarks_3d = [
        FakeLandmark()
        for _ in range(33)
    ]

    frame = np.zeros(
        (100, 100, 3),
        dtype=np.uint8,
    )

    detector = PoseDetector()
    service = PostureService(detector)

    try:
        result = service.analyze_landmarks(
            frame,
            landmarks_2d,
            landmarks_3d,
        )

        assert "analysis" in result
        assert "annotated_image" in result

        assert len(
            result["analysis"]["metrics"]
        ) == 5

        assert isinstance(
            result["annotated_image"],
            np.ndarray,
        )

    finally:
        detector.close()