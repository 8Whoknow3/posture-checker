from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analyze import router as analyze_router
from app.api.routes.websocket import router as websocket_router
from app.services.posture_service import PostureService
from app.vision.pose_detector import PoseDetector


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown resources."""

    detector = PoseDetector()

    app.state.posture_service = PostureService(
        detector
    )

    try:
        yield

    finally:
        detector.close()


app = FastAPI(
    title="دستیار هوشمند تشخیص ناهنجاری وضعیت نشستن",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    analyze_router
)

app.include_router(
    websocket_router
)