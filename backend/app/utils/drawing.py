from __future__ import annotations

import cv2
from mediapipe.tasks.python.vision import PoseLandmarksConnections


STATUS_COLORS = {
    "good": (110, 190, 60),
    "caution": (30, 170, 235),
    "poor": (60, 60, 235),
}

NEUTRAL_COLOR = (210, 170, 60)
HIGHLIGHT_COLOR = (255, 255, 255)

BASE_SIZE = 640.0


def draw_pose_overlay(
    image_bgr,
    landmarks,
    points: dict,
    overall_status: str,
):
    """Draw pose landmarks and analysis points on an image."""

    height, width = image_bgr.shape[:2]
    overlay = image_bgr.copy()

    scale = min(
        width,
        height,
    ) / BASE_SIZE

    line_thickness = max(
        1,
        round(2 * scale),
    )

    landmark_radius = max(
        2,
        round(5 * scale),
    )

    highlight_radius = max(
        3,
        round(6 * scale),
    )

    highlight_thickness = max(
        1,
        round(2 * scale),
    )

    line_color = STATUS_COLORS.get(
        overall_status,
        NEUTRAL_COLOR,
    )

    for connection in PoseLandmarksConnections.POSE_LANDMARKS:
        point_a = landmarks[connection.start]
        point_b = landmarks[connection.end]

        point_a_px = (
            int(point_a.x * width),
            int(point_a.y * height),
        )

        point_b_px = (
            int(point_b.x * width),
            int(point_b.y * height),
        )

        cv2.line(
            overlay,
            point_a_px,
            point_b_px,
            line_color,
            line_thickness,
            cv2.LINE_AA,
        )

    for landmark in landmarks:
        point_px = (
            int(landmark.x * width),
            int(landmark.y * height),
        )

        cv2.circle(
            overlay,
            point_px,
            landmark_radius,
            NEUTRAL_COLOR,
            -1,
            cv2.LINE_AA,
        )

        cv2.circle(
            overlay,
            point_px,
            landmark_radius,
            HIGHLIGHT_COLOR,
            highlight_thickness,
            cv2.LINE_AA,
        )

    for point in points.values():
        point_px = (
            int(point[0]),
            int(point[1]),
        )

        cv2.circle(
            overlay,
            point_px,
            highlight_radius,
            HIGHLIGHT_COLOR,
            highlight_thickness,
            cv2.LINE_AA,
        )

    return cv2.addWeighted(
        overlay,
        0.85,
        image_bgr,
        0.15,
        0,
    )