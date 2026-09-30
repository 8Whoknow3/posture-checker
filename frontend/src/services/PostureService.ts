import type { PostureAnalysisResult } from "../types";

/**
 * Single-image analysis boundary.
 *
 * Implementations: `MockPostureService` (development) and
 * `ApiPostureService` (REST → POST /api/analyze).
 * Must reject with `AnalysisFailure`.
 */
export interface PostureService {
  analyzeImage(image: Blob, signal?: AbortSignal): Promise<PostureAnalysisResult>;
}
