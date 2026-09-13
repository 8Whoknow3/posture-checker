from __future__ import annotations

import base64
from typing import Any

import numpy as np

from app.utils.image import encode_jpeg


def serialize_analysis(
    analysis: dict[str, Any],
) -> dict[str, Any]:
    """Convert internal posture analysis into API data."""

    metrics = [
        {
            "key": metric.key,
            "title": metric.title,
            "tier": metric.tier,
            "value": (
                round(metric.value, 1)
                if metric.value is not None
                else None
            ),
            "unit": metric.unit,
            "status": metric.status,
            "status_label": metric.status_label,
            "reference": metric.reference,
            "tip": metric.tip,
            "convention_note": metric.convention_note,
        }
        for metric in analysis["metrics"]
    ]

    return {
        "view_label": analysis["view_label"],
        "metrics": metrics,
        "overall": analysis["overall"],
    }


def serialize_posture_result(
    analysis: dict[str, Any],
    annotated_image: np.ndarray,
    quality: int = 90,
) -> dict[str, Any]:
    """Serialize posture analysis and annotated image."""

    encoded_image = encode_jpeg(
        annotated_image,
        quality=quality,
    )

    image_base64 = base64.b64encode(
        encoded_image
    ).decode("utf-8")

    response = serialize_analysis(
        analysis
    )

    response["annotated_image"] = (
        "data:image/jpeg;base64,"
        f"{image_base64}"
    )

    return response