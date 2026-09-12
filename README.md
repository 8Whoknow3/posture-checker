# Posture Checker

A web-based computer vision application for analyzing sitting posture using a webcam or uploaded images.

The application detects human pose landmarks with **MediaPipe Pose Landmarker**, calculates posture-related metrics, and provides an overall posture assessment.

**🇬🇧 English** | [🇮🇷 فارسی](README_FA.md)

## Features

- Image upload and analysis
- Webcam capture and analysis
- Real-time posture analysis
- WebSocket-based live processing
- MediaPipe Pose Landmarker
- Posture metrics and overall assessment
- Annotated pose visualization
- REST API
- Health check endpoint
- Error handling
- Unit and integration tests
- WebSocket performance testing

## Architecture

The application follows a lightweight layered architecture that separates the web interface, API layer, posture analysis, computer vision, and utility components.

```text
                         ┌──────────────────────────┐
                         │        Frontend          │
                         │      HTML / CSS / JS      │
                         │                          │
                         │  Upload │ Webcam │ Live │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                      HTTP/REST                WebSocket
                         │                         │
                         ▼                         ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │   Analyze Route     │   │  WebSocket Route   │
              │   POST /api/analyze │   │  /ws/posture       │
              └──────────┬──────────┘   └──────────┬──────────┘
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │     PostureService       │
                         │                          │
                         │ Detection + Analysis     │
                         │ + Result Coordination    │
                         └────────────┬─────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
                     ▼                                 ▼
          ┌─────────────────────┐          ┌─────────────────────┐
          │    PoseDetector     │          │   Posture Metrics   │
          │                     │          │                     │
          │ MediaPipe Pose      │          │ Posture calculations │
          │ Landmarker          │          │ and risk assessment  │
          └──────────┬──────────┘          └──────────┬──────────┘
                     │                                 │
                     └────────────────┬────────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │   Result / Serializer    │
                         │                          │
                         │ Metrics + Overall +      │
                         │ Annotated Image          │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │         Frontend         │
                         │     Rendered Results     │
                         └──────────────────────────┘
```

### Main Components

| Component           | Responsibility                                                                        |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Frontend**        | User interface, image upload, webcam access, live communication, and result rendering |
| **Analyze Route**   | Handles single-image REST requests                                                    |
| **WebSocket Route** | Handles real-time posture analysis                                                    |
| **PostureService**  | Coordinates pose detection, posture analysis, and annotated results                   |
| **PoseDetector**    | Wraps MediaPipe Pose Landmarker for IMAGE and LIVE_STREAM modes                       |
| **Posture Metrics** | Calculates posture-related metrics and overall assessment                             |
| **Serializer**      | Converts internal analysis results into API/WebSocket responses                       |
| **Utilities**       | Image encoding/decoding and pose visualization                                        |

## Project Structure

```text
Finale 2/
│
├── run.py
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── analyze.py
│   │   │   │   ├── health.py
│   │   │   │   └── websocket.py
│   │   │   │
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
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Technologies

### Backend

- Python 3.11+
- FastAPI
- Uvicorn
- MediaPipe
- OpenCV
- NumPy
- Pillow

### Frontend

- HTML
- CSS
- JavaScript
- WebSocket API
- MediaDevices API

### Testing

- Pytest
- Pytest-Cov
- WebSockets

## Requirements

### Runtime

```text
fastapi>=0.110
uvicorn[standard]>=0.29
python-multipart>=0.0.9
mediapipe==0.10.13
opencv-python-headless>=4.9
pillow>=10.0
numpy>=1.26,<2.0
```

### Development and Testing

```text
-r requirements.txt

pytest>=9.0
pytest-cov>=7.0
websockets>=15.0
```

## Installation

Clone the repository:

```bash
git clone https://github.com/8Whoknow3/posture-checker.git
cd posture-checker
```

Create and activate a Python 3.11 environment:

```powershell
conda create -n posture-web python=3.11
conda activate posture-web
```

Install dependencies:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
```

## Running the Application

From the project root:

```powershell
python run.py
```

The application starts:

```text
Frontend: http://127.0.0.1:5500
Backend:  http://127.0.0.1:8000
Swagger:  http://127.0.0.1:8000/docs
```

## API

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

### Image Analysis

```http
POST /api/analyze
```

The endpoint accepts an image using `multipart/form-data`.

### Live WebSocket

```text
/ws/posture
```

The client sends JPEG frames as binary WebSocket messages.

Successful response:

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

Error response:

```json
{
  "type": "error",
  "error": "No person detected."
}
```

## Testing

Run the complete test suite:

```powershell
cd backend
pytest -q
```

Run WebSocket tests:

```powershell
pytest tests/test_websocket.py -v
```

Run the WebSocket performance test:

```powershell
pytest tests/test_websocket_performance.py -s -v
```

## Performance

A development test using 20 frames produced the following baseline:

```text
Frames requested : 20
Frames received  : 20
Average latency  : 52.8 ms
Approx. FPS      : 18.95
```

Performance may vary depending on hardware, camera resolution, and runtime conditions.

## License

This project was developed for educational and university purposes.
