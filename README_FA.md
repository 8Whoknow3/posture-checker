# دستیار تحلیل وضعیت نشستن

یک سامانه وب مبتنی بر بینایی ماشین برای تحلیل وضعیت نشستن با استفاده از وبکم یا تصاویر آپلودشده.

این سامانه با استفاده از **MediaPipe Pose Landmarker** نقاط کلیدی بدن را تشخیص می‌دهد، شاخص‌های مرتبط با وضعیت بدن را محاسبه می‌کند و یک ارزیابی کلی از وضعیت نشستن ارائه می‌دهد.

[🇬🇧 English](README.md) | **🇮🇷 فارسی**

## قابلیت‌ها

- تحلیل تصاویر آپلودشده
- تحلیل تصویر ثبت‌شده با وبکم
- تحلیل بلادرنگ وضعیت نشستن
- پردازش زنده با WebSocket
- تشخیص Pose با MediaPipe Pose Landmarker
- محاسبه شاخص‌های وضعیت بدن
- ارزیابی کلی وضعیت
- نمایش Skeleton و نقاط Pose روی تصویر
- REST API
- Health Check
- مدیریت خطا
- تست‌های Unit و Integration
- تست Performance برای WebSocket

## معماری

این پروژه از یک معماری لایه‌ای سبک استفاده می‌کند که رابط کاربری، API، منطق تحلیل وضعیت بدن، بینایی ماشین و ابزارهای کمکی را از یکدیگر جدا می‌کند.

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

### اجزای اصلی

| جزء                 | مسئولیت                                                             |
| ------------------- | ------------------------------------------------------------------- |
| **Frontend**        | رابط کاربری، آپلود تصویر، دسترسی به وبکم، ارتباط زنده و نمایش نتایج |
| **Analyze Route**   | پردازش درخواست‌های تحلیل تصویر                                      |
| **WebSocket Route** | مدیریت تحلیل بلادرنگ                                                |
| **PostureService**  | هماهنگ‌سازی تشخیص Pose، تحلیل وضعیت و تولید نتیجه                   |
| **PoseDetector**    | ارتباط با MediaPipe Pose Landmarker در حالت‌های IMAGE و LIVE_STREAM |
| **Posture Metrics** | محاسبه شاخص‌های وضعیت بدن و ارزیابی کلی                             |
| **Serializer**      | تبدیل نتیجه داخلی به پاسخ مناسب برای API و WebSocket                |
| **Utilities**       | پردازش تصویر و رسم نقاط و Skeleton                                  |

## ساختار پروژه

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
│   │   │   ├── health.py
│   │   │   └── websocket.py
│   │   │
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

## فناوری‌های استفاده‌شده

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

## پیش‌نیازها

وابستگی‌های Runtime:

```text
fastapi>=0.110
uvicorn[standard]>=0.29
python-multipart>=0.0.9
mediapipe==0.10.13
opencv-python-headless>=4.9
pillow>=10.0
numpy>=1.26,<2.0
```

وابستگی‌های توسعه و تست:

```text
-r requirements.txt

pytest>=9.0
pytest-cov>=7.0
websockets>=15.0
```

## نصب

Repository را دریافت کنید:

```bash
git clone https://github.com/8Whoknow3/posture-checker.git
cd posture-checker
```

ساخت محیط Python:

```powershell
conda create -n posture-web python=3.11
conda activate posture-web
```

نصب وابستگی‌ها:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
```

## اجرای پروژه

از ریشه پروژه:

```powershell
python run.py
```

آدرس‌ها:

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

پاسخ:

```json
{
  "status": "ok"
}
```

### تحلیل تصویر

```http
POST /api/analyze
```

پارامتر تصویر با `multipart/form-data` ارسال می‌شود.

### WebSocket

```text
/ws/posture
```

در این مسیر، فریم‌های JPEG به صورت Binary ارسال می‌شوند.

پاسخ موفق:

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

پاسخ خطا:

```json
{
  "type": "error",
  "error": "No person detected."
}
```

## تحلیل وضعیت بدن

سیستم چند شاخص مرتبط با وضعیت بدن را محاسبه کرده و آنها را در سطوح مختلف نمایش می‌دهد.

هر Metric شامل اطلاعاتی مانند:

```text
key
title
tier
value
unit
status
status_label
reference
tip
convention_note
```

همچنین یک ارزیابی کلی برای وضعیت تولید می‌شود.

این ارزیابی برای اهداف تحلیلی و آموزشی این پروژه است و جایگزین ارزیابی پزشکی یا فیزیوتراپی نیست.

## تست‌ها

اجرای کل تست‌ها:

```powershell
cd backend
pytest -q
```

تست WebSocket:

```powershell
pytest tests/test_websocket.py -v
```

تست Performance:

```powershell
pytest tests/test_websocket_performance.py -s -v
```

## Performance

در یک تست توسعه با ۲۰ فریم، نتیجه زیر به دست آمده است:

```text
Frames requested : 20
Frames received  : 20
Average latency  : 52.8 ms
Approx. FPS      : 18.95
```

نتایج Performance به سخت‌افزار، دوربین و شرایط اجرای سیستم وابسته هستند.

## License

This project was developed for educational and university purposes.
