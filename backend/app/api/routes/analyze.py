from __future__ import annotations

import base64

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from app.core.dependencies import get_posture_service
from app.core.exceptions import (
    ImageEncodingError,
    InvalidImageError,
    PoseNotDetectedError,
    WorldLandmarksUnavailableError,
)
from app.services.posture_service import PostureService
from app.utils.image import decode_image, encode_jpeg


router = APIRouter(
    prefix="/api",
    tags=["Posture"],
)


@router.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    service: PostureService = Depends(
        get_posture_service
    ),
):
    """Analyze an uploaded image."""

    contents = await image.read()

    try:
        frame = decode_image(contents)

        result = service.analyze_frame(
            frame
        )

        encoded_image = encode_jpeg(
            result["annotated_image"]
        )

    except InvalidImageError as exc:
        return JSONResponse(
            status_code=400,
            content={
                "error": str(exc),
            },
        )

    except (
        PoseNotDetectedError,
        WorldLandmarksUnavailableError,
    ) as exc:
        return JSONResponse(
            status_code=422,
            content={
                "error": str(exc),
            },
        )

    except ImageEncodingError as exc:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(exc),
            },
        )

    image_base64 = base64.b64encode(
        encoded_image
    ).decode("utf-8")

    analysis = result["analysis"]

    metrics = [
        {
            "key": metric.key,
            "title": metric.title,
            "tier": metric.tier,
            "value": round(
                metric.value,
                1,
            ),
            "unit": metric.unit,
            "status": metric.status,
            "status_label": metric.status_label,
            "reference": metric.reference,
            "tip": metric.tip,
            "convention_note": (
                metric.convention_note
            ),
        }
        for metric in analysis["metrics"]
    ]

    return {
        "annotated_image": (
            "data:image/jpeg;base64,"
            f"{image_base64}"
        ),
        "view_label": analysis["view_label"],
        "metrics": metrics,
        "overall": analysis["overall"],
    }