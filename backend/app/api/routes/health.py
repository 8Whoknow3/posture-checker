from fastapi import APIRouter


router = APIRouter(
    prefix="/api",
    tags=["Health"],
)


@router.get("/health")
def health_check() -> dict[str, str]:
    """Return the backend health status."""

    return {
        "status": "ok",
    }