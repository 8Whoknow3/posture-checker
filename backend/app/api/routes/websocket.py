from __future__ import annotations

import asyncio
import time

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
        tuple[
            PoseLandmarkerResult,
            np.ndarray,
            int,
        ] | Exception
    ] = asyncio.Queue()

    def live_callback(
        result: PoseLandmarkerResult,
        image: mp.Image,
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

            # Decode the JPEG frame received from the browser.
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

            # MediaPipe LIVE_STREAM requires
            # strictly increasing timestamps.
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
                analysis_result = (
                    service.analyze_landmarks(
                        processed_frame,
                        result.pose_landmarks[0],
                        result.pose_world_landmarks[0],
                    )
                )

                response = serialize_posture_result(
                    analysis=analysis_result["analysis"],
                    annotated_image=(
                        analysis_result[
                            "annotated_image"
                        ]
                    ),
                    quality=80,
                )

                response["type"] = "posture_result"
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