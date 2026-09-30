# Posture Checker

A web-based computer vision application for analyzing sitting posture using a webcam or uploaded images.

The application uses a locally stored **MediaPipe Pose Landmarker** model to detect human pose landmarks, calculate posture-related metrics, and provide an overall posture risk assessment.

**🇬🇧 English** | [🇮🇷 فارسی](README_FA.md)

## Features

* Image upload and posture analysis
* Webcam capture and analysis
* Real-time posture analysis
* WebSocket-based live processing
* MediaPipe Pose Landmarker with `IMAGE` and `LIVE_STREAM` modes
* Local pose model (`pose_landmarker_full.task`)
* Posture-related metrics
* Overall posture risk assessment
* Annotated pose visualization
* Camera-view estimation
* REST API
* Health check endpoint
* Application-specific error handling
* Unit and integration tests
* WebSocket testing
* Performance baseline testing
* Separate frontend and backend

## Architecture

The application follows a lightweight layered architecture that separates the frontend, API layer, posture analysis, computer vision, and utility components.

```text
                         ┌──────────────────────────┐
                         │         Frontend         │
                         │      HTML / CSS / JS     │
                         │                          │
                         │  Upload │ Webcam │ Live  │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴─────────────┐
                         │                          │
                      HTTP/REST                WebSocket
                         │                          │
                         ▼                          ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │    Analyze Route    │   │   WebSocket Route   │
              │   POST /api/analyze │   │     /ws/posture     │
              └──────────┬──────────┘   └──────────┬──────────┘
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │      PostureService      │
                         │                          │
                         │ Detection + Analysis     │
                         │ + Result Coordination    │
                         └────────────┬─────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       │                             │
                       ▼                             ▼
              ┌─────────────────────┐    ┌─────────────────────┐
              │    PoseDetector     │    │   Posture Metrics   │
              │                     │    │                     │
              │ MediaPipe Pose      │    │ Posture calculations│
              │ Landmarker          │    │ and risk assessment │
              └──────────┬──────────┘    └──────────┬──────────┘
                         │                          │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │ Result / Serializer      │
                         │                          │
                         │ Metrics + Overall +      │
                         │ Annotated Image          │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │         Frontend         │
                         │      Rendered Results    │
                         └──────────────────────────┘
```

## Main Components

| Component           | Responsibility                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Frontend**        | User interface, image upload, webcam access, live communication, and result rendering  |
| **Analyze Route**   | Handles single-image analysis through REST                                             |
| **Health Route**    | Provides a simple backend health check                                                 |
| **WebSocket Route** | Handles real-time posture analysis                                                     |
| **PostureService**  | Coordinates pose detection, posture analysis, and annotated result generation          |
| **PoseDetector**    | Wraps MediaPipe Pose Landmarker for `IMAGE` and session-based `LIVE_STREAM` processing |
| **Posture Metrics** | Calculates posture-related metrics and overall risk                                    |
| **Serializer**      | Converts internal analysis results into API and WebSocket responses                    |
| **Exceptions**      | Provides application-specific error types                                              |
| **Utilities**       | Handles image processing and pose visualization                                        |

## Project Structure

```text
posture-checker/
│
├── run.py
├── README.md
├── README_FA.md
├── .gitignore
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   ├── │   ├── analyze.py
│   │   │   ├── │   ├── health.py
│   │   │   └── │   └── websocket.py
│   │   │   └── serializers/
│   │   │       └── posture.py
│   │   │
│   │   ├── core/
│   │   │   ├── dependencies.py
│   │   │   └── exceptions.py
│   │   │
│   │   ├── metrics/
│   │   │   └── posture_metrics.py
│   │   │
│   │   ├── services/
│   │   │   └── posture_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── drawing.py
│   │   │   └── image.py
│   │   │
│   │   └── vision/
│   │       └── pose_detector.py
│   │
│   ├── models/
│   │   └── pose_landmarker_full.task
│   │
│   ├── tests/
│   │   ├── assets/
│   │   ├── conftest.py
│   │   ├── test_analyze.py
│   │   ├── test_drawing.py
│   │   ├── test_health.py
│   │   ├── test_image.py
│   │   ├── test_pose_detector.py
│   │   ├── test_posture_metrics.py
│   │   ├── test_posture_serializer.py
│   │   ├── test_posture_service.py
│   │   ├── test_websocket.py
│   │   └── test_websocket_performance.py
│   │
│   ├── requirements.txt
│   └── requirements-dev.txt
│
└── frontend/            (PAW UI — see "Frontend (PAW)")
    ├── index.html
    ├── package.json
    └── src/
```

## Technologies

### Backend

* Python 3.11+
* FastAPI
* Uvicorn
* MediaPipe
* OpenCV
* NumPy
* Pillow

### Frontend

* React + TypeScript + Vite
* Plain CSS with design tokens (RTL, Persian-first)
* WebSocket API
* MediaDevices API
* Vitest

### Testing

* Pytest
* Pytest-Cov
* WebSockets
* HTTPX2

## Requirements

### Runtime Dependencies

```text
fastapi>=0.110
uvicorn[standard]>=0.29
python-multipart>=0.0.9
mediapipe==0.10.13
opencv-python-headless>=4.9
pillow>=10.0
numpy>=1.26,<2.0
```

### Development and Testing Dependencies

```text
-r requirements.txt
pytest>=9.0
pytest-cov>=7.0
websockets>=15.0
httpx2>=0.2
```

## Installation

Clone the repository:

```bash
git clone https://github.com/8Whoknow3/posture-checker.git
cd posture-checker
```

Create a Python 3.11 environment:

```powershell
conda create -n posture-web python=3.11
conda activate posture-web
```

Install runtime and development dependencies:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
```

## Local Pose Model

The application uses a locally stored MediaPipe Pose Landmarker model:

```text
backend/models/pose_landmarker_full.task
```

The model is loaded directly from the local filesystem and is used for pose inference without requiring an online inference API.

MediaPipe provides the runtime used to process the model and obtain human pose landmarks.

## Running the Application

From the project root:

```powershell
python run.py
```

The launcher starts both the backend and frontend automatically.

### Application URLs

```text
Frontend : http://127.0.0.1:5173
Backend  : http://127.0.0.1:8000
Swagger  : http://127.0.0.1:8000/docs
```

## Frontend (PAW)

The UI is a React + TypeScript + Vite app called **PAW**. `python run.py` starts it
with the real backend (port 5173). The UI talks to the backend only through a service layer:

```text
Pages / components
        ↓
State (reducers + hooks)
        ↓
services/  PostureService · LiveAnalysisService   (interfaces)
        ↓
adapters/  api/ (REST)  ws/ (WebSocket)  mock/ (development only)
        ↓
Backend  POST /api/analyze · WS /ws/posture
```

Backend DTOs (snake_case) are mapped to UI models in `frontend/src/adapters/api/mappers.ts`;
no other file knows the wire format. The Project Risk Score is displayed exactly as the
service returns it; unavailable metrics (`value: null`) are shown as `—` / Unavailable.

### Frontend commands

```powershell
cd frontend
npm install
npm run dev        # http://127.0.0.1:5173 (mock adapters by default)
npm test
npm run build
```

### Configuration (`frontend/.env.example`)

| Variable            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `VITE_USE_MOCK`     | `true` (default) uses development mock adapters; `false` uses the real backend |
| `VITE_API_BASE_URL` | REST base URL, e.g. `http://127.0.0.1:8000`                    |
| `VITE_WS_URL`       | WebSocket URL (derived from the API URL when omitted)          |

Adapters are selected in one place: `frontend/src/services/index.ts`.

## Health Check

To verify that the backend is running:

```text
http://127.0.0.1:8000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## API

### REST Endpoints

| Method | Endpoint       | Description                      |
| ------ | -------------- | -------------------------------- |
| `GET`  | `/api/health`  | Checks backend availability      |
| `POST` | `/api/analyze` | Analyzes a single uploaded image |

### Image Analysis

```http
POST /api/analyze
```

The endpoint accepts an image using `multipart/form-data`.

A successful response contains:

* `annotated_image`
* `view_label`
* `metrics`
* `overall`

### Live WebSocket

```text
ws://127.0.0.1:8000/ws/posture
```

In live mode, the browser sends JPEG frames as binary WebSocket messages.

Example successful response:

```json
{
  "type": "posture_result",
  "annotated_image": "...",
  "view_label": "...",
  "metrics": [],
  "overall": {},
  "timestamp_ms": 123456789
}
```

Example error response:

```json
{
  "type": "error",
  "error": "No person detected."
}
```

## Posture Metrics

The current implementation provides five posture-related metrics.

### Tier 1

* Craniovertebral Angle (CVA)
* Trunk Flexion
* Spine Alignment

### Tier 2

* Head Tilt
* Trunk Lateral

### Side View

For side-view images, **Head Tilt** and **Trunk Lateral** are reported as unavailable because the required information cannot be reliably evaluated from that camera view.

Example:

```json
{
  "key": "head_tilt",
  "value": null,
  "status": "unavailable",
  "status_label": "قابل سنجش نیست"
}
```

Metrics marked as `unavailable` do not increase the overall risk score.

## MediaPipe Processing Modes

### `IMAGE`

The `IMAGE` mode is used for single-image analysis through the REST API.

```text
Image
  ↓
REST API
  ↓
PoseDetector
  ↓
MediaPipe IMAGE
  ↓
Posture Metrics
  ↓
Result
```

### `LIVE_STREAM`

The `LIVE_STREAM` mode is used for real-time analysis through WebSocket.

```text
Camera
  ↓
WebSocket
  ↓
PoseDetector
  ↓
MediaPipe LIVE_STREAM
  ↓
Posture Metrics
  ↓
Result
  ↓
WebSocket
  ↓
Frontend
```

Each WebSocket session creates its own `LIVE_STREAM` detector. This keeps sessions isolated and allows MediaPipe timestamps to remain monotonically increasing.

## Testing

Run the complete test suite:

```powershell
cd backend
pytest -q
```

Run individual test groups:

```powershell
pytest tests/test_pose_detector.py -v
pytest tests/test_posture_metrics.py -v
pytest tests/test_posture_service.py -v
pytest tests/test_analyze.py -v
pytest tests/test_websocket.py -v
```

Run the WebSocket performance test:

```powershell
pytest tests/test_websocket_performance.py -s -v
```

## Test Status

The current project passes the complete automated test suite:

```text
32 passed
```

The test suite covers:

* Image utilities
* Drawing
* Pose detection
* `IMAGE` mode
* `LIVE_STREAM` mode
* Posture metrics
* Posture service
* Serializer
* REST API
* Health API
* WebSocket API
* Error handling
* Performance baseline

## Performance

A local WebSocket development test using 20 frames produced the following baseline:

```text
Frames requested : 20
Frames received  : 20
Average latency  : 52.8 ms
Approx. FPS      : 18.95
```

Browser-side testing produced approximately:

```text
Latency : ~24 ms
FPS     : ~13
```

These values are development measurements and may vary depending on hardware, camera resolution, browser rendering, and runtime conditions.

## Running with `run.py`

For easier local development, `run.py` automates the application startup process:

```text
Backend
   ↓
Wait for backend readiness
   ↓
Frontend
   ↓
Wait for frontend readiness
   ↓
Open browser
```

Press:

```text
Ctrl + C
```

to stop the application.

## Development Notes

The project is structured so that pose detection, posture metrics, analysis coordination, API handling, and frontend rendering remain separated.

### Static Image Flow

```text
Image
  ↓
REST
  ↓
PostureService
  ↓
PoseDetector
  ↓
MediaPipe IMAGE
  ↓
Posture Metrics
  ↓
Result
```

### Real-Time Flow

```text
Camera
  ↓
WebSocket
  ↓
PoseDetector
  ↓
MediaPipe LIVE_STREAM
  ↓
Posture Metrics
  ↓
Result
  ↓
WebSocket
  ↓
Frontend
```

## Current Project Status

The main technical scope of the project is complete:

```text
✅ Backend
✅ Frontend
✅ REST API
✅ WebSocket
✅ MediaPipe Pose Landmarker
✅ IMAGE / LIVE_STREAM
✅ Posture Metrics
✅ Error Handling
✅ Local Model
✅ Automated Tests
✅ Performance Baseline
✅ Code Audit
✅ Clean Install
```

Features such as database integration and further performance optimization are outside the current primary scope.

## Project Goal

This project was developed for educational and university purposes, with the goal of exploring practical applications of computer vision for sitting-posture analysis, real-time WebSocket communication, and separated frontend/backend architecture.
