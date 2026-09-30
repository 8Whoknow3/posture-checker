# Posture Checker

یک سامانه وب مبتنی بر **بینایی ماشین** برای تحلیل وضعیت نشستن که با استفاده از وبکم یا تصویر ورودی، وضعیت بدن را بررسی کرده و شاخص‌های مرتبط با پوسچر و سطح ریسک کلی را ارائه می‌دهد.

این پروژه از مدل **MediaPipe Pose Landmarker** به‌صورت محلی استفاده می‌کند. مدل در پروژه ذخیره شده و برای تشخیص نقاط بدن، محاسبه شاخص‌های وضعیت نشستن و ارزیابی ریسک مورد استفاده قرار می‌گیرد.

**🇮🇷 فارسی** | [🇬🇧 English](README.md)

## قابلیت‌ها

* بارگذاری تصویر و تحلیل وضعیت نشستن
* دریافت تصویر از وبکم
* تحلیل زنده وضعیت نشستن
* پردازش بلادرنگ با WebSocket
* استفاده از MediaPipe Pose Landmarker در حالت‌های `IMAGE` و `LIVE_STREAM`
* استفاده از مدل محلی `pose_landmarker_full.task`
* محاسبه شاخص‌های وضعیت بدن
* محاسبه ریسک کلی وضعیت نشستن
* نمایش تصویر Annotated همراه با نقاط و اسکلت بدن
* تشخیص نوع نمای دوربین
* REST API
* Health Check
* مدیریت خطا با Exceptionهای اختصاصی
* تست‌های Unit و Integration
* تست WebSocket
* تست پایه Performance
* جداسازی Frontend و Backend

## معماری پروژه

پروژه با یک معماری لایه‌ای سبک طراحی شده است تا رابط کاربری، API، منطق تحلیل پوسچر، تشخیص Pose و ابزارهای کمکی از یکدیگر جدا باشند.

```text
                         ┌──────────────────────────┐
                         │        Frontend          │
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
              │ MediaPipe Pose      │    │ محاسبه شاخص‌ها و    │
              │ Landmarker          │    │ ارزیابی ریسک       │
              └──────────┬──────────┘    └──────────┬──────────┘
                         │                          │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │        Serializer        │
                         │                          │
                         │ Metrics + Overall +      │
                         │ Annotated Image          │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │        Frontend          │
                         │     نمایش نتیجه نهایی   │
                         └──────────────────────────┘
```

## اجزای اصلی

| بخش                 | وظیفه                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| **Frontend**        | رابط کاربری، آپلود تصویر، دسترسی به وبکم، ارتباط WebSocket و نمایش نتایج |
| **Analyze Route**   | دریافت و تحلیل یک تصویر از طریق REST                                     |
| **Health Route**    | بررسی فعال بودن Backend                                                  |
| **WebSocket Route** | دریافت فریم‌های زنده و ارسال نتیجه تحلیل                                 |
| **PostureService**  | هماهنگ‌کردن تشخیص Pose، تحلیل پوسچر و تولید نتیجه Annotated              |
| **PoseDetector**    | مدیریت MediaPipe Pose Landmarker در حالت‌های `IMAGE` و `LIVE_STREAM`     |
| **Posture Metrics** | محاسبه شاخص‌های پوسچر و ریسک کلی                                         |
| **Serializer**      | تبدیل نتایج داخلی به خروجی API و WebSocket                               |
| **Exceptions**      | مدیریت خطاهای اختصاصی برنامه                                             |
| **Utilities**       | پردازش تصویر و رسم Pose                                                  |

## ساختار پروژه

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
│   │   ├── │   ├── routes/
│   │   │   │   ├── analyze.py
│   │   │   │   ├── health.py
│   │   │   │   └── websocket.py
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

* Python 3.11+
* FastAPI
* Uvicorn
* MediaPipe
* OpenCV
* NumPy
* Pillow

### Frontend

* HTML
* CSS
* JavaScript
* WebSocket API
* MediaDevices API

### تست

* Pytest
* Pytest-Cov
* WebSockets
* HTTPX2

## پیش‌نیازها

### وابستگی‌های Runtime

```text
fastapi>=0.110
uvicorn[standard]>=0.29
python-multipart>=0.0.9
mediapipe==0.10.13
opencv-python-headless>=4.9
pillow>=10.0
numpy>=1.26,<2.0
```

### وابستگی‌های توسعه و تست

```text
-r requirements.txt
pytest>=9.0
pytest-cov>=7.0
websockets>=15.0
httpx2>=0.2
```

## نصب

ابتدا repository را Clone کنید:

```bash
git clone https://github.com/8Whoknow3/posture-checker.git
cd posture-checker
```

یک محیط Python 3.11 ایجاد کنید:

```powershell
conda create -n posture-web python=3.11
conda activate posture-web
```

سپس dependencyهای پروژه را نصب کنید:

```powershell
cd backend
python -m pip install -r requirements-dev.txt
```

## مدل محلی Pose

مدل MediaPipe Pose Landmarker به‌صورت محلی در مسیر زیر قرار دارد:

```text
backend/models/pose_landmarker_full.task
```

برنامه مدل را مستقیماً از فایل محلی بارگذاری می‌کند؛ بنابراین برای انجام inference به یک API آنلاین نیاز ندارد.

MediaPipe به‌عنوان runtime برای اجرای مدل و دریافت Pose Landmarks مورد استفاده قرار می‌گیرد.

## اجرای پروژه

از ریشه پروژه اجرا کنید:

```powershell
python run.py
```

فایل `run.py` به‌صورت خودکار Backend و Frontend را اجرا می‌کند.

### آدرس‌های پروژه

```text
Frontend : http://127.0.0.1:5173
Backend  : http://127.0.0.1:8000
Swagger  : http://127.0.0.1:8000/docs
```

## رابط کاربری PAW

فرانت‌اند با React + TypeScript + Vite ساخته شده و نام محصول **PAW** است.
با `python run.py` همراه Backend واقعی روی پورت 5173 اجرا می‌شود. رابط کاربری فقط از طریق لایهٔ سرویس‌ها با Backend ارتباط می‌گیرد
(`frontend/src/services` و `frontend/src/adapters`).

```powershell
cd frontend
npm install
npm run dev      # حالت پیش‌فرض: Adapterهای آزمایشی (Mock)
npm test
npm run build
```

تنظیمات در `frontend/.env.example`:

* `VITE_USE_MOCK` ← `false` برای اتصال به Backend واقعی
* `VITE_API_BASE_URL` ← آدرس REST
* `VITE_WS_URL` ← آدرس WebSocket

## بررسی سلامت Backend

برای بررسی فعال بودن Backend:

```text
http://127.0.0.1:8000/api/health
```

خروجی مورد انتظار:

```json
{
  "status": "ok"
}
```

## API

### REST Endpoints

| متد    | Endpoint       | توضیح                   |
| ------ | -------------- | ----------------------- |
| `GET`  | `/api/health`  | بررسی فعال بودن Backend |
| `POST` | `/api/analyze` | تحلیل یک تصویر ورودی    |

### تحلیل تصویر

```http
POST /api/analyze
```

این Endpoint یک تصویر را از طریق `multipart/form-data` دریافت می‌کند.

در صورت موفقیت، اطلاعات زیر برگردانده می‌شوند:

* `annotated_image`
* `view_label`
* `metrics`
* `overall`

### تحلیل زنده با WebSocket

```text
ws://127.0.0.1:8000/ws/posture
```

در حالت Live، مرورگر فریم‌ها را به‌صورت Binary JPEG از طریق WebSocket ارسال می‌کند.

نمونه پاسخ موفق:

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

نمونه پاسخ خطا:

```json
{
  "type": "error",
  "error": "No person detected."
}
```

## شاخص‌های وضعیت نشستن

در نسخه فعلی پنج شاخص مرتبط با وضعیت نشستن بررسی می‌شوند.

### Tier 1

* **Craniovertebral Angle (CVA)**
* **Trunk Flexion**
* **Spine Alignment**

### Tier 2

* **Head Tilt**
* **Trunk Lateral**

### نمای جانبی

در تصاویر گرفته‌شده از **نمای جانبی (Side View)**، دو شاخص زیر به‌عنوان غیرقابل‌سنجش گزارش می‌شوند:

```text
Head Tilt
Trunk Lateral
```

دلیل این موضوع آن است که اطلاعات مورد نیاز برای ارزیابی قابل اعتماد این دو شاخص در نمای جانبی در دسترس نیست.

نمونه خروجی:

```json
{
  "key": "head_tilt",
  "value": null,
  "status": "unavailable",
  "status_label": "قابل سنجش نیست"
}
```

شاخص‌هایی که مقدار `unavailable` دارند، در محاسبه ریسک کلی جریمه نمی‌شوند.

## حالت‌های پردازش MediaPipe

### `IMAGE`

حالت `IMAGE` برای تحلیل تصاویر ثابت و درخواست‌های REST استفاده می‌شود.

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

حالت `LIVE_STREAM` برای تحلیل Real-Time از طریق WebSocket استفاده می‌شود.

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

هر WebSocket Session یک `LIVE_STREAM` detector مستقل ایجاد می‌کند. این طراحی باعث می‌شود Sessionها از یکدیگر جدا بمانند و Timestampهای MediaPipe به‌صورت monotonically increasing تولید شوند.

## تست

برای اجرای تمام تست‌ها:

```powershell
cd backend
pytest -q
```

برای اجرای تست‌های بخش‌های مختلف:

```powershell
pytest tests/test_pose_detector.py -v
pytest tests/test_posture_metrics.py -v
pytest tests/test_posture_service.py -v
pytest tests/test_analyze.py -v
pytest tests/test_websocket.py -v
```

برای اجرای تست Performance:

```powershell
pytest tests/test_websocket_performance.py -s -v
```

## وضعیت تست

مجموعه تست فعلی پروژه با موفقیت اجرا شده است:

```text
32 passed
```

تست‌ها بخش‌های زیر را پوشش می‌دهند:

* Image Utilities
* Drawing
* Pose Detection
* `IMAGE` mode
* `LIVE_STREAM` mode
* Posture Metrics
* Posture Service
* Serializer
* REST API
* Health API
* WebSocket API
* مدیریت خطا
* Performance Baseline

## Performance

تست WebSocket با ۲۰ فریم در محیط توسعه به نتایج زیر رسیده است:

```text
Frames requested : 20
Frames received  : 20
Average latency  : 52.8 ms
Approx. FPS      : 18.95
```

در تست مرورگر نیز تقریباً:

```text
Latency : ~24 ms
FPS     : ~13
```

این اعداد مربوط به محیط توسعه هستند و ممکن است با توجه به مشخصات سخت‌افزار، رزولوشن وبکم، مرورگر و شرایط اجرای برنامه تغییر کنند.

## اجرای ساده با `run.py`

برای ساده‌تر شدن اجرای پروژه، فایل `run.py` مراحل راه‌اندازی را به‌صورت خودکار انجام می‌دهد:

```text
Backend
   ↓
صبر برای آماده شدن Backend
   ↓
Frontend
   ↓
صبر برای آماده شدن Frontend
   ↓
باز کردن مرورگر
```

برای متوقف کردن برنامه کافی است:

```text
Ctrl + C
```

را فشار دهید.

## نکات توسعه

ساختار پروژه به‌گونه‌ای طراحی شده است که منطق تشخیص Pose، محاسبه شاخص‌ها، سرویس تحلیل، API و رابط کاربری از یکدیگر جدا باشند.

### جریان تحلیل تصویر ثابت

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

### جریان تحلیل Real-Time

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

## وضعیت فعلی پروژه

بخش فنی اصلی پروژه در حال حاضر تکمیل شده است:

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

قابلیت‌هایی مانند Database و بهینه‌سازی‌های بیشتر Performance در نسخه فعلی جزو محدوده اصلی پروژه نیستند.

## هدف پروژه

این پروژه با هدف آموزشی و دانشگاهی توسعه یافته است و تمرکز آن بر استفاده عملی از **بینایی ماشین** برای تحلیل وضعیت نشستن، ارتباط بلادرنگ با **WebSocket** و طراحی یک معماری جداشده بین **Frontend و Backend** است.
