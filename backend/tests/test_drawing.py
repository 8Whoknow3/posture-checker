import numpy as np

from app.utils.drawing import draw_pose_overlay


class FakeLandmark:
    def __init__(
        self,
        x: float,
        y: float,
    ):
        self.x = x
        self.y = y


def test_draw_pose_overlay():
    image = np.zeros(
        (100, 100, 3),
        dtype=np.uint8,
    )

    # MediaPipe Pose uses 33 landmarks.
    landmarks = [
        FakeLandmark(
            x=i / 33,
            y=i / 33,
        )
        for i in range(33)
    ]

    points = {
        "ear": (20, 20),
        "shoulder": (40, 40),
        "hip": (60, 60),
    }

    result = draw_pose_overlay(
        image,
        landmarks,
        points,
        "good",
    )

    assert isinstance(result, np.ndarray)
    assert result.shape == image.shape
    assert result.dtype == np.uint8