from __future__ import annotations

import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_HOST = "127.0.0.1"
FRONTEND_PORT = 5500

BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
FRONTEND_URL = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"
SWAGGER_URL = f"{BACKEND_URL}/docs"


def is_port_open(host: str, port: int) -> bool:
    """Return True when a TCP port is accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        return sock.connect_ex((host, port)) == 0


def wait_for_port(host: str, port: int, timeout: float = 15.0) -> bool:
    """Wait until a TCP port becomes available."""
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        if is_port_open(host, port):
            return True
        time.sleep(0.2)

    return False


def stop_process(process: subprocess.Popen[object] | None) -> None:
    """Terminate a child process if it is still running."""
    if process is None or process.poll() is not None:
        return

    process.terminate()

    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def main() -> int:
    """Start the backend and frontend servers and open the browser."""
    if not BACKEND_DIR.is_dir():
        print(f"Backend directory not found: {BACKEND_DIR}")
        return 1

    if not FRONTEND_DIR.is_dir():
        print(f"Frontend directory not found: {FRONTEND_DIR}")
        return 1

    if is_port_open(BACKEND_HOST, BACKEND_PORT):
        print(f"Backend port {BACKEND_PORT} is already in use.")
        return 1

    if is_port_open(FRONTEND_HOST, FRONTEND_PORT):
        print(f"Frontend port {FRONTEND_PORT} is already in use.")
        return 1

    print("Starting Posture Checker...")
    print()
    print(f"Backend  : {BACKEND_URL}")
    print(f"Swagger  : {SWAGGER_URL}")
    print(f"Frontend : {FRONTEND_URL}")
    print()

    backend_command = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        BACKEND_HOST,
        "--port",
        str(BACKEND_PORT),
    ]

    frontend_command = [
        sys.executable,
        "-m",
        "http.server",
        str(FRONTEND_PORT),
        "--bind",
        FRONTEND_HOST,
    ]

    backend_process: subprocess.Popen[object] | None = None
    frontend_process: subprocess.Popen[object] | None = None

    try:
        backend_process = subprocess.Popen(
            backend_command,
            cwd=BACKEND_DIR,
        )

        if not wait_for_port(
            BACKEND_HOST,
            BACKEND_PORT,
        ):
            print("Backend failed to start.")
            return 1

        print("Backend started.")

        frontend_process = subprocess.Popen(
            frontend_command,
            cwd=FRONTEND_DIR,
        )

        if not wait_for_port(
            FRONTEND_HOST,
            FRONTEND_PORT,
        ):
            print("Frontend failed to start.")
            return 1

        print("Frontend started.")
        print()
        print("Opening frontend...")

        webbrowser.open(FRONTEND_URL)

        print()
        print("Posture Checker is running.")
        print("Press Ctrl+C to stop both servers.")

        while True:
            if backend_process.poll() is not None:
                print("Backend stopped.")
                break

            if frontend_process.poll() is not None:
                print("Frontend stopped.")
                break

            time.sleep(0.5)

    except KeyboardInterrupt:
        print()
        print("Stopping Posture Checker...")

    finally:
        stop_process(frontend_process)
        stop_process(backend_process)

    print("Posture Checker stopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
