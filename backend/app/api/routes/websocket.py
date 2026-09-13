from __future__ import annotations

import asyncio
import base64
import time
from typing import Any

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.posture_service import PostureService


router = APIRouter(tags=["WebSocket"])


def build_posture_response(
    service: PostureService,
    frame: np.ndarray,
    result: Any,
) -> dict[str, Any]:
    """Build the response payload from a MediaPipe result."""

    analysis_result = service.analyze_landmarks(
        frame,
        result.pose_landmarks[0],
        result.pose_world_landmarks[0],
    )

    success, buffer = cv2.imencode(
        ".jpg",
        analysis_result["annotated_image"],
        [cv2.IMWRITE_JPEG_QUALITY, 80],
    )

    if not success:
        raise ValueError("Failed to encode output image.")

    image_base64 = base64.b64encode(
        buffer.tobytes()
    ).decode("utf-8")

    analysis = analysis_result["analysis"]

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
        "type": "posture_result",
        "annotated_image": (
            "data:image/jpeg;base64,"
            f"{image_base64}"
        ),
        "view_label": analysis["view_label"],
        "metrics": metrics,
        "overall": analysis["overall"],
    }


def decode_frame(frame_bytes: bytes) -> np.ndarray | None:
    """Decode JPEG bytes into an OpenCV BGR frame."""

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
    """Create a strictly increasing timestamp in milliseconds."""

    current_timestamp = (
        time.monotonic_ns() // 1_000_000
    )

    return max(
        current_timestamp,
        previous_timestamp + 1,
    )


def create_live_callback(
    loop: asyncio.AbstractEventLoop,
    result_queue: asyncio.Queue,
):
    """Create the callback used by MediaPipe LIVE_STREAM."""

    def callback(
        result,
        image,
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

    return callback


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


async def get_live_result(
    result_queue: asyncio.Queue,
):
    """Wait for a LIVE_STREAM result."""

    try:
        return await asyncio.wait_for(
            result_queue.get(),
            timeout=1.0,
        )
    except asyncio.TimeoutError:
        return None


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
    result_queue: asyncio.Queue = asyncio.Queue()

    live_callback = create_live_callback(
        loop,
        result_queue,
    )

    live_detector = (
        shared_detector.create_live_detector(
            live_callback
        )
    )

    last_timestamp = 0

    try:
        while True:
            frame_bytes = (
                await websocket.receive_bytes()
            )

            if not frame_bytes:
                continue

            frame = decode_frame(
                frame_bytes
            )

            if frame is None:
                await send_error(
                    websocket,
                    "Invalid image frame.",
                )
                continue

            timestamp_ms = create_timestamp(
                last_timestamp
            )

            last_timestamp = timestamp_ms

            mp_image = (
                shared_detector.frame_to_mp_image(
                    frame
                )
            )

            try:
                live_detector.detect_async(
                    mp_image,
                    timestamp_ms,
                )

            except ValueError as exc:
                await send_error(
                    websocket,
                    str(exc),
                )
                continue

            item = await get_live_result(
                result_queue
            )

            if item is None:
                continue

            if isinstance(item, Exception):
                await send_error(
                    websocket,
                    str(item),
                )
                continue

            result, processed_frame, result_timestamp = item

            if (
                not result.pose_landmarks
                or not result.pose_world_landmarks
            ):
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
                )

                response["timestamp_ms"] = (
                    result_timestamp
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