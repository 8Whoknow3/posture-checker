from fastapi import APIRouter


router = APIRouter(
    prefix="/api",
    tags=["Health"],
)


@router.get("/health")
def health_check():
    """Check whether the backend is running."""

    return {
        "status": "ok",
    }