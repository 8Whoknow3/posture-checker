import type {
  LiveAnalysisService,
  LiveListener,
} from "../../services/LiveAnalysisService";
import type { LiveAnalysisPhase } from "../../types";
import { mapWsMessage } from "../api/mappers";

export interface WebSocketLiveOptions {
  url: string;
  /** Longest frame side sent to the backend, in pixels. */
  maxDimension?: number;
  jpegQuality?: number;
  /** Delay between receiving a reply and sending the next frame. */
  frameIntervalMs?: number;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  /** The backend may stay silent for a frame; release the in-flight slot after this. */
  replyTimeoutMs?: number;
}

/**
 * Real WebSocket adapter → WS /ws/posture.
 *
 * Protocol: the client sends one binary JPEG frame and waits for one JSON
 * reply before sending the next (one frame in flight).
 */
export class WebSocketLiveAnalysisService implements LiveAnalysisService {
  private readonly options: Required<WebSocketLiveOptions>;
  private listener: LiveListener | null = null;
  private video: HTMLVideoElement | null = null;
  private socket: WebSocket | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private active = false;
  private inFlight = false;
  private attempt = 0;
  private phase: LiveAnalysisPhase = "idle";
  private frameTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private replyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WebSocketLiveOptions) {
    this.options = {
      maxDimension: 640,
      jpegQuality: 0.7,
      frameIntervalMs: 50,
      reconnectDelayMs: 500,
      maxReconnectDelayMs: 4000,
      replyTimeoutMs: 3000,
      ...options,
    };
  }

  start(source: HTMLVideoElement, listener: LiveListener): void {
    this.stop();
    this.video = source;
    this.listener = listener;
    this.active = true;
    this.attempt = 0;
    this.connect();
  }

  stop(): void {
    const wasActive = this.active;
    const listener = this.listener;
    this.active = false;
    this.inFlight = false;
    this.clearTimers();
    this.detachSocket();
    this.video = null;
    this.listener = null;
    this.phase = "idle";
    if (wasActive) listener?.({ type: "connection", state: "stopped" });
  }

  // -------------------------------------------------------------- internals

  private emitPhase(phase: LiveAnalysisPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.listener?.({ type: "phase", phase });
  }

  private connect(): void {
    if (!this.active) return;
    this.listener?.({ type: "connection", state: "connecting" });

    let socket: WebSocket;
    try {
      socket = new WebSocket(this.options.url);
    } catch {
      this.handleClosed();
      return;
    }
    socket.binaryType = "arraybuffer";
    this.socket = socket;

    socket.onopen = () => {
      if (!this.active) return;
      this.attempt = 0;
      this.listener?.({ type: "connection", state: "connected" });
      this.emitPhase("waiting");
      this.scheduleFrame(0);
    };
    socket.onmessage = (event) => this.handleMessage(event);
    socket.onerror = () => {
      /* `close` always follows; handled there. */
    };
    socket.onclose = () => this.handleClosed();
  }

  private handleMessage(event: MessageEvent): void {
    if (!this.active || typeof event.data !== "string") return;
    this.releaseInFlight();

    const mapped = mapWsMessage(event.data);
    if (mapped) this.listener?.(mapped);
    if (mapped?.type === "result") this.emitPhase("analyzing");
    else this.emitPhase("waiting");

    this.scheduleFrame(this.options.frameIntervalMs);
  }

  private handleClosed(): void {
    this.detachSocket();
    this.inFlight = false;
    this.clearTimers();
    if (!this.active) return;

    this.emitPhase("idle");
    this.listener?.({ type: "connection", state: "disconnected" });

    const delay = Math.min(
      this.options.reconnectDelayMs * 2 ** this.attempt,
      this.options.maxReconnectDelayMs,
    );
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private scheduleFrame(delayMs: number): void {
    if (!this.active) return;
    if (this.frameTimer !== null) clearTimeout(this.frameTimer);
    this.frameTimer = setTimeout(() => {
      this.frameTimer = null;
      this.sendFrame();
    }, delayMs);
  }

  private sendFrame(): void {
    const socket = this.socket;
    const video = this.video;
    if (
      !this.active ||
      this.inFlight ||
      !video ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const { videoWidth, videoHeight } = video;
    if (!videoWidth || !videoHeight) {
      this.scheduleFrame(100);
      return;
    }

    const scale = Math.min(
      1,
      this.options.maxDimension / Math.max(videoWidth, videoHeight),
    );
    const canvas = (this.canvas ??= document.createElement("canvas"));
    canvas.width = Math.max(1, Math.round(videoWidth * scale));
    canvas.height = Math.max(1, Math.round(videoHeight * scale));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.inFlight = true;
    canvas.toBlob(
      (blob) => {
        if (
          !blob ||
          !this.active ||
          !this.socket ||
          this.socket.readyState !== WebSocket.OPEN
        ) {
          this.inFlight = false;
          return;
        }
        this.socket.send(blob);
        this.armReplyTimeout();
      },
      "image/jpeg",
      this.options.jpegQuality,
    );
  }

  private armReplyTimeout(): void {
    if (this.replyTimer !== null) clearTimeout(this.replyTimer);
    this.replyTimer = setTimeout(() => {
      this.replyTimer = null;
      this.inFlight = false;
      this.scheduleFrame(0);
    }, this.options.replyTimeoutMs);
  }

  private releaseInFlight(): void {
    this.inFlight = false;
    if (this.replyTimer !== null) {
      clearTimeout(this.replyTimer);
      this.replyTimer = null;
    }
  }

  private clearTimers(): void {
    for (const timer of [this.frameTimer, this.reconnectTimer, this.replyTimer]) {
      if (timer !== null) clearTimeout(timer);
    }
    this.frameTimer = null;
    this.reconnectTimer = null;
    this.replyTimer = null;
  }

  private detachSocket(): void {
    const socket = this.socket;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
    this.socket = null;
  }
}
