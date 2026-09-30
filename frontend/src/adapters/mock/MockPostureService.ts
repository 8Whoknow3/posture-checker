/**
 * DEVELOPMENT ADAPTER — simulates POST /api/analyze. Not a real analysis.
 */
import type { PostureService } from "../../services/PostureService";
import { AnalysisFailure } from "../../services/errors";
import type { PostureAnalysisResult } from "../../types";
import { buildMockResult } from "./fixtures";
import { getMockScenario } from "./scenario";

function readAsDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export class MockPostureService implements PostureService {
  constructor(private readonly latencyMs = 1400) {}

  async analyzeImage(
    image: Blob,
    signal?: AbortSignal,
  ): Promise<PostureAnalysisResult> {
    await delay(this.latencyMs, signal);

    switch (getMockScenario()) {
      case "no_person":
        throw new AnalysisFailure("no_person");
      case "invalid_image":
        throw new AnalysisFailure("invalid_image");
      case "processing_error":
        throw new AnalysisFailure("processing_failed");
      case "connection_lost":
        throw new AnalysisFailure("unreachable");
      case "side_view":
        return buildMockResult({
          view: "side",
          annotatedImage: await readAsDataUrl(image),
        });
      default:
        return buildMockResult({
          view: "frontal",
          annotatedImage: await readAsDataUrl(image),
        });
    }
  }
}
