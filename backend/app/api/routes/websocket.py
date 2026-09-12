from __future__ import annotations

import asyncio
import time
from typing import Any

import cv2
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from mediapipe.tasks.python.vision import PoseLandmarkerResult

from app.api.serializers.posture import (
    serialize_posture_result,
)
from app.services.posture_service import PostureService


router = APIRouter(
    tags=["WebSocket"],
)


LiveResult = tuple[
    PoseLandmarkerResult,
    np.ndarray,
    int,
]


async def send_error(
    websocket: WebSocket,
    message: str,
) -> None:
    """Send a standardized WebSocket error response."""

    await websocket.send_json(
        {
            "type": "error",
            "error": message,
        }
    )


def decode_frame(
    frame_bytes: bytes,
) -> np.ndarray | None:
    """Decode JPEG bytes into a BGR OpenCV frame."""

    if not frame_bytes:
        return None

    frame_array = np.frombuffer(
        frame_bytes,
        dtype=np.uint8,
    )

    return cv2.imdecode(
        frame_array,
        cv2.IMREAD_COLOR,
    )


def create_timestamp(
    previous_timestamp: int,
) -> int:
    """Create a strictly increasing MediaPipe timestamp."""

    current_timestamp = (
        time.monotonic_ns() // 1_000_000
    )

    return max(
        current_timestamp,
        previous_timestamp + 1,
    )


def create_live_callback(
    loop: asyncio.AbstractEventLoop,
    result_queue: asyncio.Queue[
        LiveResult | Exception
    ],
):
    """Create the callback used by MediaPipe LIVE_STREAM."""

    def live_callback(
        result: PoseLandmarkerResult,
        image: mp.Image,
        timestamp_ms: int,
    ) -> None:
        try:
            rgb_frame = np.asarray(
                image.numpy_view()
            ).copy()

            frame_bgr = cv2.cvtColor(
                rgb_frame,
                cv2.COLOR_RGB2BGR,
            )

            loop.call_soon_threadsafe(
                result_queue.put_nowait,
                (
                    result,
                    frame_bgr,
                    timestamp_ms,
                ),
            )

        except Exception as exc:
            loop.call_soon_threadsafe(
                result_queue.put_nowait,
                exc,
            )

    return live_callback


async def get_live_result(
    result_queue: asyncio.Queue[
        LiveResult | Exception
    ],
    timeout: float = 1.0,
) -> LiveResult | Exception | None:
    """Wait for the next MediaPipe LIVE_STREAM result."""

    try:
        return await asyncio.wait_for(
            result_queue.get(),
            timeout=timeout,
        )

    except asyncio.TimeoutError:
        return None


def has_pose(
    result: PoseLandmarkerResult,
) -> bool:
    """Return whether both required landmark sets are available."""

    return bool(
        result.pose_landmarks
        and result.pose_world_landmarks
    )


def build_posture_response(
    service: PostureService,
    frame: np.ndarray,
    result: PoseLandmarkerResult,
    timestamp_ms: int,
) -> dict[str, Any]:
    """Build the final WebSocket posture response."""

    analysis_result = service.analyze_landmarks(
        frame,
        result.pose_landmarks[0],
        result.pose_world_landmarks[0],
    )

    response = serialize_posture_result(
        analysis=analysis_result["analysis"],
        annotated_image=analysis_result[
            "annotated_image"
        ],
        quality=80,
    )

    response["type"] = "posture_result"
    response["timestamp_ms"] = timestamp_ms

    return response


@router.websocket("/ws/posture")
async def posture_websocket(
    websocket: WebSocket,
) -> None:
    """Handle real-time posture analysis for one WebSocket session."""

    await websocket.accept()

    service: PostureService = (
        websocket.app.state.posture_service
    )

    shared_detector = service.detector
    loop = asyncio.get_running_loop()

    result_queue: asyncio.Queue[
        LiveResult | Exception
    ] = asyncio.Queue()

    live_callback = create_live_callback(
        loop,
        result_queue,
    )

    live_detector = (
        shared_detector.create_live_detector(
            live_callback
        )
    )

    last_timestamp_ms = 0

    try:
        while True:
            frame_bytes = (
                await websocket.receive_bytes()
            )

            frame = decode_frame(
                frame_bytes
            )

            if frame is None:
                await send_error(
                    websocket,
                    "Invalid image frame.",
                )
                continue

            last_timestamp_ms = create_timestamp(
                last_timestamp_ms
            )

            mp_image = (
                shared_detector.frame_to_mp_image(
                    frame
                )
            )

            try:
                live_detector.detect_async(
                    mp_image,
                    last_timestamp_ms,
                )

            except ValueError as exc:
                await send_error(
                    websocket,
                    str(exc),
                )
                continue

            live_result = await get_live_result(
                result_queue
            )

            if live_result is None:
                continue

            if isinstance(
                live_result,
                Exception,
            ):
                await send_error(
                    websocket,
                    str(live_result),
                )
                continue

            (
                result,
                processed_frame,
                result_timestamp,
            ) = live_result

            if not has_pose(result):
                await send_error(
                    websocket,
                    "No person detected.",
                )
                continue

            try:
                response = build_posture_response(
                    service,
                    processed_frame,
                    result,
                    result_timestamp,
                )

                await websocket.send_json(
                    response
                )

            except ValueError as exc:
                await send_error(
                    websocket,
                    str(exc),
                )

    except WebSocketDisconnect:
        pass

    finally:
        live_detector.close()