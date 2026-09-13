from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from app.api.serializers.posture import serialize_posture_result
from app.core.dependencies import get_posture_service
from app.core.exceptions import (
    ImageEncodingError,
    InvalidImageError,
    PoseNotDetectedError,
    WorldLandmarksUnavailableError,
)
from app.services.posture_service import PostureService
from app.utils.image import decode_image


router = APIRouter(
    prefix="/api",
    tags=["Posture"],
)


@router.post(
    "/analyze",
    response_model=None,
)
async def analyze(
    image: UploadFile = File(...),
    service: PostureService = Depends(get_posture_service),
) -> dict[str, Any] | JSONResponse:
    """Analyze an uploaded image."""

    contents = await image.read()

    try:
        frame = decode_image(contents)
        result = service.analyze_frame(frame)

        return serialize_posture_result(
            analysis=result["analysis"],
            annotated_image=result["annotated_image"],
        )

    except InvalidImageError as exc:
        return JSONResponse(
            status_code=400,
            content={"error": str(exc)},
        )

    except (
        PoseNotDetectedError,
        WorldLandmarksUnavailableError,
    ) as exc:
        return JSONResponse(
            status_code=422,
            content={"error": str(exc)},
        )

    except ImageEncodingError as exc:
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )