from __future__ import annotations

import asyncio
import base64
import time

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.posture_service import PostureService


router = APIRouter(
    tags=["WebSocket"],
)


def build_response(
    service: PostureService,
    frame: np.ndarray,
    landmarks_2d,
    landmarks_3d,
) -> dict:
    """Build the WebSocket response from detected pose landmarks."""

    result = service.analyze_landmarks(
        frame,
        landmarks_2d,
        landmarks_3d,
    )

    annotated_image = result["annotated_image"]

    success, buffer = cv2.imencode(
        ".jpg",
        annotated_image,
        [cv2.IMWRITE_JPEG_QUALITY, 80],
    )

    if not success:
        raise ValueError(
            "Failed to encode output image."
        )

    image_base64 = base64.b64encode(
        buffer.tobytes()
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
            "convention_note": metric.convention_note,
        }
        for metric in analysis["metrics"]
    ]

    return {
        "type": "posture_result",
        "annotated_image": (
            f"data:image/jpeg;base64,{image_base64}"
        ),
        "view_label": analysis["view_label"],
        "metrics": metrics,
        "overall": analysis["overall"],
    }


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

    def live_callback(
        result,
        image,
        timestamp_ms: int,
    ) -> None:
        """Receive a result from MediaPipe LIVE_STREAM."""

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

            if not frame_bytes:
                continue

            frame_array = np.frombuffer(
                frame_bytes,
                dtype=np.uint8,
            )

            frame = cv2.imdecode(
                frame_array,
                cv2.IMREAD_COLOR,
            )

            if frame is None:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "Invalid image frame.",
                    }
                )

                continue

            timestamp_ms = max(
                time.monotonic_ns() // 1_000_000,
                last_timestamp_ms + 1,
            )

            last_timestamp_ms = timestamp_ms

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
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": str(exc),
                    }
                )

                continue

            try:
                item = await asyncio.wait_for(
                    result_queue.get(),
                    timeout=1.0,
                )

            except asyncio.TimeoutError:
                continue

            if isinstance(item, Exception):
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": str(item),
                    }
                )

                continue

            (
                result,
                processed_frame,
                result_timestamp,
            ) = item

            if (
                not result.pose_landmarks
                or not result.pose_world_landmarks
            ):
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": "No person detected.",
                    }
                )

                continue

            try:
                response = build_response(
                    service,
                    processed_frame,
                    result.pose_landmarks[0],
                    result.pose_world_landmarks[0],
                )

                response["timestamp_ms"] = (
                    result_timestamp
                )

                await websocket.send_json(
                    response
                )

            except ValueError as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": str(exc),
                    }
                )

    except WebSocketDisconnect:
        pass

    finally:
        live_detector.close()