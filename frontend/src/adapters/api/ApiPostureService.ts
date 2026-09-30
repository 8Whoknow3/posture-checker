import type { PostureService } from "../../services/PostureService";
import { AnalysisFailure } from "../../services/errors";
import type { PostureAnalysisResult } from "../../types";
import type { AnalysisResponseDto } from "./dto";
import { classifyHttpError, mapAnalysisResponse } from "./mappers";

/** Real REST adapter → POST {apiBaseUrl}/api/analyze (multipart field `image`). */
export class ApiPostureService implements PostureService {
  constructor(private readonly apiBaseUrl: string) {}

  async analyzeImage(
    image: Blob,
    signal?: AbortSignal,
  ): Promise<PostureAnalysisResult> {
    const body = new FormData();
    body.append("image", image);

    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/api/analyze`, {
        method: "POST",
        body,
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      throw new AnalysisFailure("unreachable");
    }

    if (!response.ok) {
      let detail: string | undefined;
      try {
        detail = ((await response.json()) as { error?: string }).error;
      } catch {
        detail = undefined;
      }
      throw new AnalysisFailure(classifyHttpError(response.status), detail);
    }

    try {
      return mapAnalysisResponse((await response.json()) as AnalysisResponseDto);
    } catch {
      throw new AnalysisFailure("processing_failed");
    }
  }
}
