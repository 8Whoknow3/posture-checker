from dataclasses import dataclass
from typing import Optional
import math

import numpy as np


LANDMARK_NAMES = {
    "nose": 0,
    "left_ear": 7,
    "right_ear": 8,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_hip": 23,
    "right_hip": 24,
}


# Tier 1
CVA_POOR_MAX = 48.0
CVA_CAUTION_MAX = 50.0

TRUNK_CAUTION_MAX = 20.0
TRUNK_POOR_MAX = 60.0

SPINE_ALIGN_POOR_MAX = 150.0
SPINE_ALIGN_CAUTION_MAX = 160.0

# Tier 2
HEAD_TILT_CAUTION_DEG = 8.0
TRUNK_LATERAL_CAUTION_DEG = 8.0


STATUS_LABELS = {
    "good": "مطلوب",
    "caution": "نیازمند توجه",
    "poor": "پرخطر",
    "unavailable": "قابل سنجش نیست",
}


@dataclass
class Metric:
    key: str
    title: str
    tier: int
    value: Optional[float]
    unit: str
    status: str
    status_label: str
    reference: str
    tip: str
    convention_note: Optional[str] = None


def to_xyz(landmark) -> np.ndarray:
    return np.array(
        [landmark.x, landmark.y, landmark.z],
        dtype=float,
    )


def to_px(
    landmark,
    width: int,
    height: int,
) -> tuple[float, float]:
    return (
        landmark.x * width,
        landmark.y * height,
    )


def weighted_midpoint(
    points,
    weights,
) -> np.ndarray:
    weights = np.asarray(
        weights,
        dtype=float,
    )

    if weights.sum() <= 1e-6:
        weights = np.ones_like(weights)

    weights = weights / weights.sum()

    return np.average(
        np.asarray(points, dtype=float),
        axis=0,
        weights=weights,
    )


def angle_between(
    v1: np.ndarray,
    v2: np.ndarray,
) -> float:
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0

    cosine = np.clip(
        np.dot(v1, v2) / (norm1 * norm2),
        -1.0,
        1.0,
    )

    return math.degrees(
        math.acos(cosine)
    )


def line_angle(
    line: np.ndarray,
    reference: np.ndarray,
) -> float:
    angle = angle_between(
        line,
        reference,
    )

    return min(
        angle,
        180.0 - angle,
    )


def angle_2d(
    left_landmark,
    right_landmark,
) -> float:
    """Calculate the smaller angle of a 2D line relative to horizontal."""

    dx = (
        right_landmark.x -
        left_landmark.x
    )

    dy = (
        right_landmark.y -
        left_landmark.y
    )

    if (
        abs(dx) < 1e-9
        and abs(dy) < 1e-9
    ):
        return 0.0

    angle = abs(
        math.degrees(
            math.atan2(
                dy,
                dx,
            )
        )
    )

    if angle > 90.0:
        angle = 180.0 - angle

    return angle


def estimate_camera_view(
    landmarks_2d,
) -> str:
    left_shoulder = landmarks_2d[
        LANDMARK_NAMES["left_shoulder"]
    ]

    right_shoulder = landmarks_2d[
        LANDMARK_NAMES["right_shoulder"]
    ]

    dz = abs(
        left_shoulder.z -
        right_shoulder.z
    )

    dx = (
        abs(
            left_shoulder.x -
            right_shoulder.x
        )
        + 1e-6
    )

    ratio = dz / dx

    if ratio < 0.35:
        return "روبه‌رو (تمام‌رخ)"

    if ratio < 1.0:
        return "زاویه‌دار (سه‌رخ)"

    return "از پهلو (نیم‌رخ)"


def status_from_thresholds(
    value: float,
    poor_bound: float,
    caution_bound: float,
    higher_is_better: bool,
) -> str:
    if higher_is_better:
        if value < poor_bound:
            return "poor"

        if value < caution_bound:
            return "caution"

        return "good"

    if value > poor_bound:
        return "poor"

    if value > caution_bound:
        return "caution"

    return "good"


def analyze_posture(
    lm2d,
    lm3d,
    width: int,
    height: int,
):
    def visibility(name: str) -> float:
        return float(
            getattr(
                lm2d[LANDMARK_NAMES[name]],
                "visibility",
                1.0,
            )
        )

    left_ear = lm2d[
        LANDMARK_NAMES["left_ear"]
    ]

    right_ear = lm2d[
        LANDMARK_NAMES["right_ear"]
    ]

    left_shoulder = lm2d[
        LANDMARK_NAMES["left_shoulder"]
    ]

    right_shoulder = lm2d[
        LANDMARK_NAMES["right_shoulder"]
    ]

    left_hip = lm2d[
        LANDMARK_NAMES["left_hip"]
    ]

    right_hip = lm2d[
        LANDMARK_NAMES["right_hip"]
    ]

    camera_view = estimate_camera_view(
        lm2d
    )

    side_view = (
        camera_view ==
        "از پهلو (نیم‌رخ)"
    )

    ear_center = weighted_midpoint(
        [
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["left_ear"]
                ]
            ),
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["right_ear"]
                ]
            ),
        ],
        [
            visibility("left_ear"),
            visibility("right_ear"),
        ],
    )

    shoulder_center = weighted_midpoint(
        [
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["left_shoulder"]
                ]
            ),
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["right_shoulder"]
                ]
            ),
        ],
        [
            visibility("left_shoulder"),
            visibility("right_shoulder"),
        ],
    )

    hip_center = weighted_midpoint(
        [
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["left_hip"]
                ]
            ),
            to_xyz(
                lm3d[
                    LANDMARK_NAMES["right_hip"]
                ]
            ),
        ],
        [
            visibility("left_hip"),
            visibility("right_hip"),
        ],
    )

    vertical = np.array(
        [0.0, -1.0, 0.0],
        dtype=float,
    )

    horizontal = np.array(
        [1.0, 0.0, 0.0],
        dtype=float,
    )

    # ========================================================
    # Tier 1
    # ========================================================

    # 1. CVA
    neck_vector = (
        ear_center -
        shoulder_center
    )

    neck_angle = angle_between(
        neck_vector,
        vertical,
    )

    cva = 90.0 - neck_angle

    cva_status = status_from_thresholds(
        cva,
        CVA_POOR_MAX,
        CVA_CAUTION_MAX,
        True,
    )

    # 2. Trunk flexion
    trunk_vector = (
        shoulder_center -
        hip_center
    )

    trunk_flexion = angle_between(
        trunk_vector,
        vertical,
    )

    trunk_status = status_from_thresholds(
        trunk_flexion,
        TRUNK_POOR_MAX,
        TRUNK_CAUTION_MAX,
        False,
    )

    # 3. Spine alignment
    vector1 = (
        ear_center -
        shoulder_center
    )

    vector2 = (
        hip_center -
        shoulder_center
    )

    spine_alignment = angle_between(
        vector1,
        vector2,
    )

    spine_status = status_from_thresholds(
        spine_alignment,
        SPINE_ALIGN_POOR_MAX,
        SPINE_ALIGN_CAUTION_MAX,
        True,
    )

    # ========================================================
    # Tier 2
    # ========================================================

    # 4. Head tilt
    if side_view:
        head_tilt = None
        head_tilt_status = "unavailable"

    else:
        head_tilt = angle_2d(
            left_ear,
            right_ear,
        )

        head_tilt_status = (
            status_from_thresholds(
                head_tilt,
                HEAD_TILT_CAUTION_DEG * 2,
                HEAD_TILT_CAUTION_DEG,
                False,
            )
        )

    # 5. Trunk lateral
    if side_view:
        trunk_lateral = None
        trunk_lateral_status = "unavailable"

    else:
        trunk_lateral = angle_2d(
            left_shoulder,
            right_shoulder,
        )

        trunk_lateral_status = (
            status_from_thresholds(
                trunk_lateral,
                TRUNK_LATERAL_CAUTION_DEG * 2,
                TRUNK_LATERAL_CAUTION_DEG,
                False,
            )
        )

    # ========================================================
    # Metrics
    # ========================================================

    metrics = [
        Metric(
            key="cva",
            title="زاویه کرانیووِرتبرال (سر به جلو)",
            tier=1,
            value=cva,
            unit="درجه",
            status=cva_status,
            status_label=STATUS_LABELS[cva_status],
            reference="Physiopedia / Yip et al.",
            tip="چانه را به آرامی عقب بکشید.",
            convention_note="عدد بزرگ‌تر = وضعیت بهتر",
        ),
        Metric(
            key="trunk",
            title="خمیدگی تنه نسبت به عمود",
            tier=1,
            value=trunk_flexion,
            unit="درجه",
            status=trunk_status,
            status_label=STATUS_LABELS[trunk_status],
            reference="ISO 11226 / RULA-REBA",
            tip="کمر را صاف کرده و به پشتی صندلی تکیه دهید.",
        ),
        Metric(
            key="spine_align",
            title="هم‌راستایی ستون فقرات",
            tier=1,
            value=spine_alignment,
            unit="درجه",
            status=spine_status,
            status_label=STATUS_LABELS[spine_status],
            reference="Threshold تجربی / کالیبره‌شده",
            tip="گوش، شانه و باسن را هم‌راستا قرار دهید.",
        ),
        Metric(
            key="head_tilt",
            title="کجی جانبی سر",
            tier=2,
            value=head_tilt,
            unit="درجه",
            status=head_tilt_status,
            status_label=STATUS_LABELS[
                head_tilt_status
            ],
            reference=(
                "قابل ارزیابی در نمای روبه‌رو یا زاویه‌دار"
            ),
            tip="سر را در راستای عمود بدن نگه دارید.",
        ),
        Metric(
            key="trunk_lateral",
            title="کجی جانبی تنه",
            tier=2,
            value=trunk_lateral,
            unit="درجه",
            status=trunk_lateral_status,
            status_label=STATUS_LABELS[
                trunk_lateral_status
            ],
            reference=(
                "قابل ارزیابی در نمای روبه‌رو یا زاویه‌دار"
            ),
            tip="وزن بدن را یکنواخت توزیع کنید.",
        ),
    ]

    # ========================================================
    # Overlay points
    # ========================================================

    ear = (
        left_ear
        if visibility("left_ear")
        >= visibility("right_ear")
        else right_ear
    )

    shoulder = (
        left_shoulder
        if visibility("left_shoulder")
        >= visibility("right_shoulder")
        else right_shoulder
    )

    hip = (
        left_hip
        if visibility("left_hip")
        >= visibility("right_hip")
        else right_hip
    )

    return {
        "view_label": camera_view,
        "points": {
            "ear": to_px(
                ear,
                width,
                height,
            ),
            "shoulder": to_px(
                shoulder,
                width,
                height,
            ),
            "hip": to_px(
                hip,
                width,
                height,
            ),
        },
        "metrics": metrics,
        "overall": compute_overall_risk(
            metrics
        ),
    }


def compute_overall_risk(
    metrics,
):
    score_map = {
        "good": 1,
        "caution": 2,
        "poor": 3,
    }

    tier1 = [
        metric
        for metric in metrics
        if metric.tier == 1
    ]

    tier2 = {
        metric.key: metric
        for metric in metrics
        if metric.tier == 2
    }

    base_score = sum(
        score_map[metric.status]
        for metric in tier1
    )

    adjustment = 0

    if (
        tier2.get("head_tilt")
        and tier2["head_tilt"].status
        in {"caution", "poor"}
    ):
        adjustment += 1

    if (
        tier2.get("trunk_lateral")
        and tier2["trunk_lateral"].status
        in {"caution", "poor"}
    ):
        adjustment += 1

    total = (
        base_score +
        adjustment
    )

    max_score = (
        len(tier1) * 3 +
        2
    )

    if total <= max_score * 0.4:
        level = "low"
        level_label = "ریسک پایین"

    elif total <= max_score * 0.7:
        level = "medium"
        level_label = "ریسک متوسط"

    else:
        level = "high"
        level_label = "ریسک بالا"

    return {
        "score": total,
        "max_score": max_score,
        "level": level,
        "level_label": level_label,
        "poor_count": sum(
            metric.status == "poor"
            for metric in tier1
        ),
        "caution_count": sum(
            metric.status == "caution"
            for metric in tier1
        ),
    }