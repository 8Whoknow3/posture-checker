from pathlib import Path

import cv2
import numpy as np

from app.metrics.posture_metrics import (
    Metric,
    analyze_posture,
    angle_between,
    compute_overall_risk,
    status_from_thresholds,
)
from app.vision.pose_detector import PoseDetector


IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)


# ============================================================
# Geometry
# ============================================================

def test_angle_between_perpendicular_vectors():
    angle = angle_between(
        np.array([1.0, 0.0, 0.0]),
        np.array([0.0, 1.0, 0.0]),
    )

    assert angle == 90.0


def test_angle_between_zero_vector():
    angle = angle_between(
        np.array([0.0, 0.0, 0.0]),
        np.array([1.0, 0.0, 0.0]),
    )

    assert angle == 0.0


# ============================================================
# Threshold Status
# ============================================================

def test_status_when_higher_is_better():
    assert (
        status_from_thresholds(
            47.0,
            48.0,
            50.0,
            True,
        )
        == "poor"
    )

    assert (
        status_from_thresholds(
            49.0,
            48.0,
            50.0,
            True,
        )
        == "caution"
    )

    assert (
        status_from_thresholds(
            51.0,
            48.0,
            50.0,
            True,
        )
        == "good"
    )


def test_status_when_lower_is_better():
    assert (
        status_from_thresholds(
            61.0,
            60.0,
            20.0,
            False,
        )
        == "poor"
    )

    assert (
        status_from_thresholds(
            30.0,
            60.0,
            20.0,
            False,
        )
        == "caution"
    )

    assert (
        status_from_thresholds(
            10.0,
            60.0,
            20.0,
            False,
        )
        == "good"
    )


# ============================================================
# Overall Risk
# ============================================================

def test_compute_overall_risk():
    metrics = [
        Metric(
            key="cva",
            title="CVA",
            tier=1,
            value=55.0,
            unit="درجه",
            status="good",
            status_label="مطلوب",
            reference="test",
            tip="test",
        ),
        Metric(
            key="trunk",
            title="Trunk",
            tier=1,
            value=10.0,
            unit="درجه",
            status="good",
            status_label="مطلوب",
            reference="test",
            tip="test",
        ),
        Metric(
            key="spine_align",
            title="Spine",
            tier=1,
            value=170.0,
            unit="درجه",
            status="good",
            status_label="مطلوب",
            reference="test",
            tip="test",
        ),
        Metric(
            key="head_tilt",
            title="Head Tilt",
            tier=2,
            value=2.0,
            unit="درجه",
            status="good",
            status_label="مطلوب",
            reference="test",
            tip="test",
        ),
        Metric(
            key="trunk_lateral",
            title="Trunk Lateral",
            tier=2,
            value=2.0,
            unit="درجه",
            status="good",
            status_label="مطلوب",
            reference="test",
            tip="test",
        ),
    ]

    result = compute_overall_risk(metrics)

    assert result["score"] == 3
    assert result["max_score"] == 11
    assert result["level"] == "low"
    assert result["level_label"] == "ریسک پایین"
    assert result["poor_count"] == 0
    assert result["caution_count"] == 0


# ============================================================
# Real MediaPipe + Posture Analysis
# ============================================================

def test_analyze_posture_with_real_pose():
    assert IMAGE_PATH.exists()

    frame = cv2.imread(str(IMAGE_PATH))

    assert frame is not None

    height, width = frame.shape[:2]

    detector = PoseDetector()

    try:
        result = detector.detect(frame)

        assert result is not None
        assert result.pose_landmarks
        assert result.pose_world_landmarks

        landmarks_2d = result.pose_landmarks[0]
        landmarks_3d = result.pose_world_landmarks[0]

        assert len(landmarks_2d) == 33
        assert len(landmarks_3d) == 33

        analysis = analyze_posture(
            landmarks_2d,
            landmarks_3d,
            width,
            height,
        )

        assert "view_label" in analysis
        assert "points" in analysis
        assert "metrics" in analysis
        assert "overall" in analysis

        assert len(analysis["metrics"]) == 5

        metric_keys = {
            metric.key
            for metric in analysis["metrics"]
        }

        assert metric_keys == {
            "cva",
            "trunk",
            "spine_align",
            "head_tilt",
            "trunk_lateral",
        }

        for metric in analysis["metrics"]:
            assert metric.status in {
                "good",
                "caution",
                "poor",
            }

            assert metric.status_label
            assert metric.title
            assert metric.unit

        overall = analysis["overall"]

        assert 0 <= overall["score"] <= overall["max_score"]

        assert overall["level"] in {
            "low",
            "medium",
            "high",
        }

        assert overall["level_label"]

        assert overall["poor_count"] >= 0
        assert overall["caution_count"] >= 0

        assert set(analysis["points"]) == {
            "ear",
            "shoulder",
            "hip",
        }

    finally:
        detector.close()