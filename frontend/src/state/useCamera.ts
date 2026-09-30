import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraState } from "../types";

function classifyCameraError(error: unknown): CameraState {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  return "unavailable";
}

/**
 * Owns the MediaStream for one screen. The <video> element must always be
 * rendered so `videoRef` is available when the stream arrives.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        streamRef.current = null;
        setState("unavailable");
      });
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setState("active");
    } catch (error) {
      setState(classifyCameraError(error));
    }
  }, []);

  /** Grab the current frame as a full-resolution JPEG. */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92),
    );
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    [],
  );

  return { videoRef, state, start, stop, capture };
}
