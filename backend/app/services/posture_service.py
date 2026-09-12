from __future__ import annotations

from typing import Any

import numpy as np

from app.core.exceptions import (
    PoseNotDetectedError,
    WorldLandmarksUnavailableError,
)
from app.metrics.posture_metrics import analyze_posture
from app.utils.drawing import draw_pose_overlay
from app.vision.pose_detector import PoseDetector


class PostureService:
    """Coordinate pose detection, posture analysis, and drawing."""

    def __init__(
        self,
        detector: PoseDetector,
    ) -> None:
        self.detector = detector

    def analyze_landmarks(
        self,
        frame: np.ndarray,
        landmarks_2d: list[Any],
        landmarks_3d: list[Any],
    ) -> dict[str, Any]:
        """
        Analyze already-detected pose landmarks.

        This method is used by both IMAGE and LIVE_STREAM flows.
        """

        height, width = frame.shape[:2]

        analysis = analyze_posture(
            landmarks_2d,
            landmarks_3d,
            width,
            height,
        )

        overall_status = {
            "low": "good",
            "medium": "caution",
            "high": "poor",
        }.get(
            analysis["overall"]["level"],
            "caution",
        )

        annotated_image = draw_pose_overlay(
            frame,
            landmarks_2d,
            analysis["points"],
            overall_status,
        )

        return {
            "analysis": analysis,
            "annotated_image": annotated_image,
        }

    def analyze_frame(
        self,
        frame: np.ndarray,
    ) -> dict[str, Any]:
        """Detect and analyze posture from an OpenCV BGR frame."""

        result = self.detector.detect(
            frame
        )

        if not result.pose_landmarks:
            raise PoseNotDetectedError(
                "No person detected."
            )

        if not result.pose_world_landmarks:
            raise WorldLandmarksUnavailableError(
                "3D pose landmarks are unavailable."
            )

        return self.analyze_landmarks(
            frame=frame,
            landmarks_2d=result.pose_landmarks[0],
            landmarks_3d=result.pose_world_landmarks[0],
        )