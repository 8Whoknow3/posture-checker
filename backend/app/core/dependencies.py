from fastapi import Request

from app.services.posture_service import PostureService


def get_posture_service(request: Request) -> PostureService:
    """Return the application-level PostureService."""

    return request.app.state.posture_service