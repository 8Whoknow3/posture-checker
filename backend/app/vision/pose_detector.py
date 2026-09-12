from __future__ import annotations

from pathlib import Path
from typing import Callable, Optional

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    PoseLandmarkerResult,
    RunningMode,
)


PoseCallback = Callable[
    [PoseLandmarkerResult, mp.Image, int],
    None,
]


class PoseDetector:
    """Wrapper around MediaPipe Pose Landmarker."""

    def __init__(self) -> None:
        """Initialize the shared IMAGE detector."""

        model_path = self._get_model_path()

        if not model_path.exists():
            raise FileNotFoundError(
                f"Pose model not found: {model_path}"
            )

        self._image_detector = self._create_detector(
            model_path,
            RunningMode.IMAGE,
        )

    @staticmethod
    def _get_model_path() -> Path:
        """Return the path to the MediaPipe pose model."""

        backend_dir = Path(__file__).resolve().parents[2]

        return (
            backend_dir
            / "models"
            / "pose_landmarker_full.task"
        )

    def _create_detector(
        self,
        model_path: Path,
        running_mode: RunningMode,
        callback: Optional[PoseCallback] = None,
    ) -> PoseLandmarker:
        """Create a MediaPipe PoseLandmarker instance."""

        base_options = BaseOptions(
            model_asset_path=str(model_path),
        )

        options_kwargs = {
            "base_options": base_options,
            "running_mode": running_mode,
            "num_poses": 1,
            "min_pose_detection_confidence": 0.5,
            "min_pose_presence_confidence": 0.5,
            "min_tracking_confidence": 0.5,
        }

        if running_mode == RunningMode.LIVE_STREAM:
            if callback is None:
                raise ValueError(
                    "LIVE_STREAM requires a callback."
                )

            options_kwargs["result_callback"] = callback

        options = PoseLandmarkerOptions(
            **options_kwargs
        )

        return PoseLandmarker.create_from_options(
            options
        )

    # ========================================================
    # IMAGE MODE
    # ========================================================

    def detect(self, frame):
        """Detect pose landmarks from an OpenCV BGR image."""

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB,
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame,
        )

        return self._image_detector.detect(
            mp_image
        )

    # ========================================================
    # LIVE STREAM
    # ========================================================

    def create_live_detector(
        self,
        callback: PoseCallback,
    ) -> PoseLandmarker:
        """
        Create a dedicated LIVE_STREAM detector.

        Each WebSocket session should use its own detector.
        """

        model_path = self._get_model_path()

        return self._create_detector(
            model_path,
            RunningMode.LIVE_STREAM,
            callback,
        )

    @staticmethod
    def frame_to_mp_image(frame) -> mp.Image:
        """Convert an OpenCV BGR frame to a MediaPipe image."""

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB,
        )

        return mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame,
        )

    # ========================================================
    # RESOURCE MANAGEMENT
    # ========================================================

    def close(self) -> None:
        """Close the shared IMAGE detector."""

        self._image_detector.close()