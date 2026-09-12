import asyncio
import json
import socket
import statistics
import subprocess
import sys
import time
from pathlib import Path

import websockets


HOST = "127.0.0.1"
PORT = 8000
WS_URL = f"ws://{HOST}:{PORT}/ws/posture"

IMAGE_PATH = (
    Path(__file__).resolve().parent
    / "assets"
    / "seated_person.jpg"
)

FRAME_COUNT = 20
SERVER_START_TIMEOUT = 15.0


def is_server_ready() -> bool:
    """Check whether the test server is accepting TCP connections."""

    with socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM,
    ) as sock:
        sock.settimeout(0.2)

        return (
            sock.connect_ex(
                (HOST, PORT)
            )
            == 0
        )


def wait_for_server(
    process: subprocess.Popen,
    timeout: float = SERVER_START_TIMEOUT,
) -> None:
    """Wait until Uvicorn is ready to accept connections."""

    deadline = (
        time.monotonic()
        + timeout
    )

    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                "Uvicorn server stopped before becoming ready."
            )

        if is_server_ready():
            return

        time.sleep(0.1)

    process.terminate()

    raise TimeoutError(
        "Timed out waiting for Uvicorn server."
    )


def start_server() -> subprocess.Popen:
    """Start a temporary Uvicorn server for the performance test."""

    backend_dir = (
        Path(__file__).resolve().parents[1]
    )

    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ],
        cwd=backend_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    wait_for_server(process)

    return process


def stop_server(
    process: subprocess.Popen,
) -> None:
    """Stop the temporary Uvicorn server."""

    if process.poll() is None:
        process.terminate()

        try:
            process.wait(timeout=5)

        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


async def run_performance_test() -> None:
    """Measure WebSocket round-trip latency."""

    if not IMAGE_PATH.exists():
        raise FileNotFoundError(
            f"Test image not found: {IMAGE_PATH}"
        )

    image_bytes = IMAGE_PATH.read_bytes()

    latencies: list[float] = []

    async with websockets.connect(
        WS_URL,
        max_size=10 * 1024 * 1024,
    ) as websocket:

        for _ in range(FRAME_COUNT):
            start = time.perf_counter()

            await websocket.send(
                image_bytes
            )

            while True:
                message = await websocket.recv()

                if not isinstance(message, str):
                    continue

                data = json.loads(message)

                message_type = data.get("type")

                if message_type == "posture_result":
                    elapsed_ms = (
                        time.perf_counter()
                        - start
                    ) * 1000

                    latencies.append(
                        elapsed_ms
                    )

                    break

                if message_type == "error":
                    raise RuntimeError(
                        data.get(
                            "error",
                            "Unknown WebSocket error.",
                        )
                    )

    if not latencies:
        raise RuntimeError(
            "No posture_result messages were received."
        )

    average_latency = statistics.mean(
        latencies
    )

    print()
    print("=" * 50)
    print("WebSocket Performance")
    print("=" * 50)
    print(
        f"Frames requested : {FRAME_COUNT}"
    )
    print(
        f"Frames received  : {len(latencies)}"
    )
    print()

    print(
        f"Min latency     : "
        f"{min(latencies):.1f} ms"
    )

    print(
        f"Max latency     : "
        f"{max(latencies):.1f} ms"
    )

    print(
        f"Average latency : "
        f"{average_latency:.1f} ms"
    )

    print(
        f"Median latency  : "
        f"{statistics.median(latencies):.1f} ms"
    )

    print(
        f"Approx. FPS     : "
        f"{1000 / average_latency:.2f}"
    )

    print("=" * 50)


def test_websocket_performance():
    """Run the WebSocket performance test with a temporary server."""

    server = start_server()

    try:
        asyncio.run(
            run_performance_test()
        )

    finally:
        stop_server(server)