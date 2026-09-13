const BACKEND_URL = "http://127.0.0.1:8000";
const WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/posture";


// ------------------------------------------------------------------
// DOM Elements
// ------------------------------------------------------------------

const dropzone = document.getElementById("dropzone");
const dropzoneContent = document.getElementById("dropzoneContent");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const analyzeBtn = document.getElementById("analyzeBtn");

const tabUpload = document.getElementById("tabUpload");
const tabWebcam = document.getElementById("tabWebcam");
const modeUpload = document.getElementById("modeUpload");
const modeWebcam = document.getElementById("modeWebcam");

const webcamPlaceholder = document.getElementById("webcamPlaceholder");
const webcamVideo = document.getElementById("webcamVideo");
const webcamPreview = document.getElementById("webcamPreview");
const webcamCanvas = document.getElementById("webcamCanvas");

const startCameraBtn = document.getElementById("startCameraBtn");
const webcamControls = document.getElementById("webcamControls");
const webcamRetakeControls = document.getElementById(
  "webcamRetakeControls",
);

const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");
const webcamError = document.getElementById("webcamError");

const liveToggleBtn = document.getElementById("liveToggleBtn");
const liveIndicator = document.getElementById("liveIndicator");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const resultsContent = document.getElementById("resultsContent");

const annotatedImg = document.getElementById("annotatedImg");
const viewBadge = document.getElementById("viewBadge");

const overallLabel = document.getElementById("overallLabel");
const overallScore = document.getElementById("overallScore");
const overallMeterFill = document.getElementById(
  "overallMeterFill",
);

const tier1Grid = document.getElementById("tier1Grid");
const tier2Grid = document.getElementById("tier2Grid");

const correctionsCard = document.getElementById("correctionsCard");
const correctionsList = document.getElementById("correctionsList");


// ------------------------------------------------------------------
// State
// ------------------------------------------------------------------

let webcamStream = null;
let selectedFile = null;
let currentInputMode = "upload";

let liveMode = false;
let liveInFlight = false;
let liveTimeoutId = null;
let postureSocket = null;


// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------

const LIVE_MAX_DIM = 640;
const LIVE_JPEG_QUALITY = 0.7;
const LIVE_RETRY_DELAY_MS = 500;

const STATUS_COLOR_VAR = {
  good: "--good",
  caution: "--caution",
  poor: "--poor",
  unavailable: "--line",
};

const OVERALL_LEVEL_TEXT = {
  low: "ریسک پایین — وضعیت کلی مطلوب است",
  medium: "ریسک متوسط — نیازمند توجه در برخی موارد",
  high: "ریسک بالا — اصلاح وضعیت توصیه می‌شود",
};

const OVERALL_LEVEL_COLOR = {
  low: "var(--good)",
  medium: "var(--caution)",
  high: "var(--poor)",
};

const GAUGE_RANGES = {
  cva: {
    min: 30,
    max: 90,
    higherIsBetter: true,
  },
  trunk: {
    min: 0,
    max: 90,
    higherIsBetter: false,
  },
  spine_align: {
    min: 110,
    max: 180,
    higherIsBetter: true,
  },
  head_tilt: {
    min: 0,
    max: 30,
    higherIsBetter: false,
  },
  trunk_lateral: {
    min: 0,
    max: 30,
    higherIsBetter: false,
  },
};


// ------------------------------------------------------------------
// File Upload
// ------------------------------------------------------------------

dropzone.addEventListener(
  "click",
  () => fileInput.click(),
);

dropzone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  },
);

dropzone.addEventListener(
  "dragleave",
  () => {
    dropzone.classList.remove("dragover");
  },
);

dropzone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  },
);

fileInput.addEventListener(
  "change",
  () => {
    const file = fileInput.files?.[0];

    if (file) {
      handleFile(file);
    }
  },
);

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    return;
  }

  selectedFile = file;
  previewImg.src = URL.createObjectURL(file);
  previewImg.hidden = false;

  dropzoneContent.hidden = true;
  analyzeBtn.disabled = false;
}


// ------------------------------------------------------------------
// Input Mode
// ------------------------------------------------------------------

function setInputMode(mode) {
  if (mode === currentInputMode) {
    return;
  }

  currentInputMode = mode;

  const isUpload = mode === "upload";

  tabUpload.classList.toggle("active", isUpload);
  tabWebcam.classList.toggle("active", !isUpload);

  tabUpload.setAttribute(
    "aria-selected",
    String(isUpload),
  );

  tabWebcam.setAttribute(
    "aria-selected",
    String(!isUpload),
  );

  modeUpload.hidden = !isUpload;
  modeWebcam.hidden = isUpload;

  selectedFile = null;
  analyzeBtn.disabled = true;

  if (isUpload) {
    stopLiveMode();
    stopWebcamStream();
    resetWebcamUI();
    analyzeBtn.hidden = false;
    return;
  }

  previewImg.hidden = true;
  dropzoneContent.hidden = false;
  fileInput.value = "";
  analyzeBtn.hidden = false;
}

tabUpload.addEventListener(
  "click",
  () => setInputMode("upload"),
);

tabWebcam.addEventListener(
  "click",
  () => setInputMode("webcam"),
);


// ------------------------------------------------------------------
// Webcam
// ------------------------------------------------------------------

function resetWebcamUI() {
  webcamPlaceholder.hidden = false;
  webcamVideo.hidden = true;
  webcamPreview.hidden = true;
  webcamControls.hidden = true;
  webcamRetakeControls.hidden = true;
  liveIndicator.hidden = true;

  liveToggleBtn.textContent = "شروع تحلیل زنده";
  liveToggleBtn.classList.remove("btn-live-active");

  clearWebcamError();
}

function showWebcamError(message) {
  webcamError.textContent = message;
  webcamError.hidden = false;
}

function clearWebcamError() {
  webcamError.hidden = true;
}

function stopWebcamStream() {
  stopLiveMode();

  if (!webcamStream) {
    return;
  }

  webcamStream
    .getTracks()
    .forEach((track) => track.stop());

  webcamStream = null;
}

async function startCamera() {
  clearWebcamError();

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    showWebcamError(
      "مرورگر شما از دسترسی به دوربین پشتیبانی نمی‌کند.",
    );
    return;
  }

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 1280,
        },
        height: {
          ideal: 960,
        },
      },
      audio: false,
    });

    webcamVideo.srcObject = webcamStream;

    webcamPlaceholder.hidden = true;
    webcamPreview.hidden = true;
    webcamVideo.hidden = false;

    webcamControls.hidden = false;
    webcamRetakeControls.hidden = true;
  } catch {
    showWebcamError(
      "دسترسی به دوربین ممکن نشد. مطمئن شوید مرورگر اجازه‌ی دسترسی به وبکم را دارد و دستگاهی متصل است.",
    );
  }
}

startCameraBtn.addEventListener(
  "click",
  startCamera,
);


// ------------------------------------------------------------------
// Webcam Capture
// ------------------------------------------------------------------

captureBtn.addEventListener(
  "click",
  () => {
    const width = webcamVideo.videoWidth;
    const height = webcamVideo.videoHeight;

    if (!width || !height) {
      return;
    }

    webcamCanvas.width = width;
    webcamCanvas.height = height;

    const context = webcamCanvas.getContext("2d");

    context.drawImage(
      webcamVideo,
      0,
      0,
      width,
      height,
    );

    webcamCanvas.toBlob(
      (blob) => {
        if (!blob) {
          showWebcamError(
            "خطا در ثبت عکس از دوربین. دوباره تلاش کنید.",
          );
          return;
        }

        selectedFile = new File(
          [blob],
          "webcam-capture.jpg",
          {
            type: "image/jpeg",
          },
        );

        webcamPreview.src = URL.createObjectURL(blob);
        webcamPreview.hidden = false;
        webcamVideo.hidden = true;

        webcamControls.hidden = true;
        webcamRetakeControls.hidden = false;

        analyzeBtn.disabled = false;
      },
      "image/jpeg",
      0.92,
    );
  },
);

function backToLiveChoice() {
  selectedFile = null;
  analyzeBtn.disabled = true;

  webcamPreview.hidden = true;
  webcamRetakeControls.hidden = true;

  clearWebcamError();

  if (webcamStream) {
    webcamVideo.hidden = false;
    webcamControls.hidden = false;
    return;
  }

  startCamera();
}

retakeBtn.addEventListener(
  "click",
  backToLiveChoice,
);


// ------------------------------------------------------------------
// Live Mode
// ------------------------------------------------------------------

function setLiveModeUI(active) {
  liveIndicator.hidden = !active;

  liveToggleBtn.textContent = active
    ? "توقف تحلیل زنده"
    : "شروع تحلیل زنده";

  liveToggleBtn.classList.toggle(
    "btn-live-active",
    active,
  );

  captureBtn.disabled = active;
  analyzeBtn.hidden = active;
}

function startLiveMode() {
  if (liveMode) {
    return;
  }

  if (!webcamStream) {
    showWebcamError(
      "ابتدا دوربین را روشن کنید.",
    );
    return;
  }

  liveMode = true;
  liveInFlight = false;

  clearWebcamError();
  setLiveModeUI(true);

  connectPostureWebSocket();
}

function stopLiveMode() {
  liveMode = false;
  liveInFlight = false;

  if (liveTimeoutId !== null) {
    clearTimeout(liveTimeoutId);
    liveTimeoutId = null;
  }

  closePostureWebSocket();
  setLiveModeUI(false);
}


// ------------------------------------------------------------------
// WebSocket Connection
// ------------------------------------------------------------------

function connectPostureWebSocket() {
  if (!liveMode) {
    return;
  }

  const isSocketActive =
    postureSocket &&
    (
      postureSocket.readyState === WebSocket.OPEN ||
      postureSocket.readyState === WebSocket.CONNECTING
    );

  if (isSocketActive) {
    return;
  }

  try {
    postureSocket = new WebSocket(
      WEBSOCKET_URL,
    );

    postureSocket.binaryType = "arraybuffer";

    postureSocket.addEventListener(
      "open",
      handleWebSocketOpen,
    );

    postureSocket.addEventListener(
      "message",
      handleWebSocketMessage,
    );

    postureSocket.addEventListener(
      "error",
      handleWebSocketError,
    );

    postureSocket.addEventListener(
      "close",
      handleWebSocketClose,
    );
  } catch {
    handleWebSocketError();
  }
}

function handleWebSocketOpen() {
  if (!liveMode) {
    return;
  }

  clearWebcamError();
  scheduleLiveFrame(true);
}

function handleWebSocketMessage(event) {
  if (!liveMode) {
    return;
  }

  let data;

  try {
    data = JSON.parse(event.data);
  } catch {
    liveInFlight = false;

    showWebcamError(
      "پاسخ نامعتبر از سرور دریافت شد.",
    );

    scheduleLiveFrame(false);
    return;
  }

  liveInFlight = false;

  if (data.type === "posture_result") {
    clearWebcamError();

    renderResults(data);
    setState("results");
  } else if (data.type === "error") {
    handleLiveError(
      data.error ||
        "خطایی در تحلیل فریم رخ داد.",
    );
  }

  scheduleLiveFrame(false);
}

function handleLiveError(message) {
  if (resultsContent.hidden) {
    showError(message);
    return;
  }

  showWebcamError(message);
}

function handleWebSocketError() {
  if (!liveMode) {
    return;
  }

  showWebcamError(
    "ارتباط بلادرنگ با سرور برقرار نشد.",
  );
}

function handleWebSocketClose() {
  postureSocket = null;
  liveInFlight = false;

  if (!liveMode) {
    return;
  }

  showWebcamError(
    "ارتباط با سرور قطع شد. در حال تلاش مجدد...",
  );

  scheduleWebSocketReconnect();
}

function scheduleWebSocketReconnect() {
  if (!liveMode) {
    return;
  }

  if (liveTimeoutId !== null) {
    clearTimeout(liveTimeoutId);
  }

  liveTimeoutId = setTimeout(
    () => {
      liveTimeoutId = null;

      if (!liveMode) {
        return;
      }

      connectPostureWebSocket();
    },
    LIVE_RETRY_DELAY_MS,
  );
}

function closePostureWebSocket() {
  if (!postureSocket) {
    return;
  }

  postureSocket.onopen = null;
  postureSocket.onmessage = null;
  postureSocket.onerror = null;
  postureSocket.onclose = null;

  if (
    postureSocket.readyState === WebSocket.OPEN ||
    postureSocket.readyState === WebSocket.CONNECTING
  ) {
    postureSocket.close();
  }

  postureSocket = null;
}


// ------------------------------------------------------------------
// Live Frame Sending
// ------------------------------------------------------------------

function scheduleLiveFrame(immediate) {
  if (!liveMode) {
    return;
  }

  if (liveTimeoutId !== null) {
    clearTimeout(liveTimeoutId);
    liveTimeoutId = null;
  }

  liveTimeoutId = setTimeout(
    sendLiveFrame,
    immediate ? 0 : 50,
  );
}

function sendLiveFrame() {
  liveTimeoutId = null;

  const socketReady =
    postureSocket &&
    postureSocket.readyState === WebSocket.OPEN;

  if (
    !liveMode ||
    !socketReady ||
    liveInFlight ||
    !webcamStream ||
    webcamVideo.hidden
  ) {
    return;
  }

  const nativeWidth = webcamVideo.videoWidth;
  const nativeHeight = webcamVideo.videoHeight;

  if (!nativeWidth || !nativeHeight) {
    scheduleLiveFrame(false);
    return;
  }

  const scale = Math.min(
    1,
    LIVE_MAX_DIM / Math.max(
      nativeWidth,
      nativeHeight,
    ),
  );

  const width = Math.max(
    1,
    Math.round(nativeWidth * scale),
  );

  const height = Math.max(
    1,
    Math.round(nativeHeight * scale),
  );

  webcamCanvas.width = width;
  webcamCanvas.height = height;

  const context = webcamCanvas.getContext("2d");

  context.drawImage(
    webcamVideo,
    0,
    0,
    width,
    height,
  );

  liveInFlight = true;

  webcamCanvas.toBlob(
    (blob) => {
      const canSend =
        blob &&
        liveMode &&
        postureSocket &&
        postureSocket.readyState === WebSocket.OPEN;

      if (!canSend) {
        liveInFlight = false;
        return;
      }

      postureSocket.send(blob);
    },
    "image/jpeg",
    LIVE_JPEG_QUALITY,
  );
}

liveToggleBtn.addEventListener(
  "click",
  () => {
    if (liveMode) {
      stopLiveMode();
      return;
    }

    startLiveMode();
  },
);


// ------------------------------------------------------------------
// Single Image Analysis — REST
// ------------------------------------------------------------------

analyzeBtn.addEventListener(
  "click",
  async () => {
    if (!selectedFile) {
      return;
    }

    setState("loading");

    const formData = new FormData();

    formData.append(
      "image",
      selectedFile,
    );

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/analyze`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showError(
          data.error ||
            "خطای ناشناخته در تحلیل تصویر رخ داد.",
        );
        return;
      }

      renderResults(data);
      setState("results");
    } catch {
      showError(
        "ارتباط با سرور برقرار نشد. مطمئن شوید سرور FastAPI در حال اجراست.",
      );
    }
  },
);


// ------------------------------------------------------------------
// UI State
// ------------------------------------------------------------------

function setState(state) {
  emptyState.hidden = state !== "empty";
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  resultsContent.hidden = state !== "results";
}

function showError(message) {
  errorState.textContent = message;
  setState("error");
}


// ------------------------------------------------------------------
// Result Rendering
// ------------------------------------------------------------------

function renderResults(data) {
  annotatedImg.src = data.annotated_image;

  viewBadge.textContent =
    `زاویه دوربین: ${data.view_label}`;

  const overall = data.overall;

  overallLabel.textContent =
    OVERALL_LEVEL_TEXT[overall.level] ||
    overall.level_label;

  overallScore.textContent =
    `${overall.score} / ${overall.max_score}`;

  const percentage = Math.min(
    100,
    Math.round(
      (
        overall.score /
        overall.max_score
      ) * 100,
    ),
  );

  overallMeterFill.style.width =
    `${percentage}%`;

  overallMeterFill.style.background =
    OVERALL_LEVEL_COLOR[overall.level] ||
    "var(--caution)";

  const tier1 = data.metrics.filter(
    (metric) => metric.tier === 1,
  );

  const tier2 = data.metrics.filter(
    (metric) => metric.tier === 2,
  );

  tier1Grid.innerHTML =
    tier1.map(renderMetricCard).join("");

  tier2Grid.innerHTML =
    tier2.map(renderMetricCard).join("");

  const needsCorrection =
    data.metrics.filter(
      (metric) =>
        metric.status === "caution" ||
        metric.status === "poor",
    );

  if (needsCorrection.length > 0) {
    correctionsList.innerHTML =
      needsCorrection
        .map(
          (metric) =>
            `<li><strong>${escapeHtml(
              metric.title,
            )}:</strong> ${escapeHtml(
              metric.tip,
            )}</li>`,
        )
        .join("");

    correctionsCard.hidden = false;
  } else {
    correctionsCard.hidden = true;
  }
}


// ------------------------------------------------------------------
// Metric Cards
// ------------------------------------------------------------------

function renderMetricCard(metric) {
  const gauge = buildGaugeSvg(metric);

  const noteHtml =
    metric.convention_note
      ? `<div class="metric-note">${escapeHtml(
          metric.convention_note,
        )}</div>`
      : "";

  const valueHtml =
    metric.value === null
      ? "—"
      : metric.value;

  return `
    <div class="metric-card status-${metric.status}">
      <div class="gauge-wrap">
        ${gauge}
      </div>

      <div class="metric-body">
        <p class="metric-title">
          ${escapeHtml(metric.title)}
        </p>

        <div class="metric-value-row">
          <span class="metric-value">
            ${valueHtml}
          </span>

          <span class="metric-unit">
            ${escapeHtml(metric.unit)}
          </span>

          <span class="metric-status-pill">
            ${escapeHtml(metric.status_label)}
          </span>
        </div>

        <div class="metric-ref">
          ${escapeHtml(metric.reference)}
        </div>

        ${noteHtml}
      </div>
    </div>
  `;
}


// ------------------------------------------------------------------
// Gauge
// ------------------------------------------------------------------

function buildGaugeSvg(metric) {
  if (metric.status === "unavailable") {
    return `
      <svg
        width="72"
        height="40"
        viewBox="0 0 72 40"
        aria-label="قابل سنجش نیست"
      >
        <path
          d="M 8 32 A 26 26 0 0 1 64 32"
          fill="none"
          stroke="var(--line)"
          stroke-width="4"
          stroke-linecap="round"
        />

        <text
          x="36"
          y="29"
          text-anchor="middle"
          fill="var(--text-faint)"
          font-size="8"
          font-family="sans-serif"
        >
          N/A
        </text>
      </svg>
    `;
  }

  const range =
    GAUGE_RANGES[metric.key] || {
      min: 0,
      max: 100,
      higherIsBetter: true,
    };

  const value = Number(metric.value);

  if (!Number.isFinite(value)) {
    return "";
  }

  let fraction =
    clamp(
      (value - range.min) /
        (range.max - range.min),
      0,
      1,
    );

  if (!range.higherIsBetter) {
    fraction = 1 - fraction;
  }

  const centerX = 36;
  const centerY = 32;
  const radius = 24;
  const tickCount = 13;

  const colorVar =
    `var(${STATUS_COLOR_VAR[metric.status]})`;

  let ticks = "";

  for (
    let index = 0;
    index < tickCount;
    index++
  ) {
    const tickFraction =
      index / (tickCount - 1);

    const angleDeg =
      180 - tickFraction * 180;

    const angleRad =
      (angleDeg * Math.PI) / 180;

    const innerRadius = radius - 6;

    const outerRadius = radius;

    const x1 =
      centerX +
      innerRadius *
        Math.cos(angleRad);

    const y1 =
      centerY -
      innerRadius *
        Math.sin(angleRad);

    const x2 =
      centerX +
      outerRadius *
        Math.cos(angleRad);

    const y2 =
      centerY -
      outerRadius *
        Math.sin(angleRad);

    ticks += `
      <line
        x1="${x1.toFixed(2)}"
        y1="${y1.toFixed(2)}"
        x2="${x2.toFixed(2)}"
        y2="${y2.toFixed(2)}"
        stroke="var(--line)"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    `;
  }

  const needleAngleDeg =
    180 - fraction * 180;

  const needleAngleRad =
    (needleAngleDeg * Math.PI) / 180;

  const needleLength =
    radius - 5;

  const needleX =
    centerX +
    needleLength *
      Math.cos(needleAngleRad);

  const needleY =
    centerY -
    needleLength *
      Math.sin(needleAngleRad);

  return `
    <svg
      width="72"
      height="48"
      viewBox="0 0 72 48"
      aria-label="${escapeHtml(metric.title)}"
    >
      <path
        d="M 11 38 A 25 25 0 0 1 61 38"
        fill="none"
        stroke="var(--line)"
        stroke-width="4"
        stroke-linecap="round"
      />

      ${ticks}

      <line
        x1="${centerX}"
        y1="${centerY}"
        x2="${needleX.toFixed(2)}"
        y2="${needleY.toFixed(2)}"
        stroke="${colorVar}"
        stroke-width="2.4"
        stroke-linecap="round"
      />

      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="3.2"
        fill="${colorVar}"
      />

      <text
        x="${centerX}"
        y="29"
        text-anchor="middle"
        fill="var(--text)"
        font-size="8"
        font-family="var(--font-mono)"
        font-weight="600"
      >
        ${escapeHtml(String(value))}
      </text>
    </svg>
  `;
}


// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function clamp(
  value,
  min,
  max,
) {
  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  );
}

function escapeHtml(value) {
  const element =
    document.createElement("div");

  element.textContent =
    value ?? "";

  return element.innerHTML;
}
