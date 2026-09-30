import { ApiPostureService } from "../adapters/api/ApiPostureService";
import { MockLiveAnalysisService } from "../adapters/mock/MockLiveAnalysisService";
import { MockPostureService } from "../adapters/mock/MockPostureService";
import { WebSocketLiveAnalysisService } from "../adapters/ws/WebSocketLiveAnalysisService";
import { env, type AppEnv } from "../config/env";
import type { LiveAnalysisService } from "./LiveAnalysisService";
import type { PostureService } from "./PostureService";

export interface Services {
  posture: PostureService;
  /** Factory: each live session gets a fresh service instance. */
  createLive: () => LiveAnalysisService;
  /** true when development adapters are active. */
  isMock: boolean;
}

/**
 * The ONLY place that chooses between development and real adapters.
 */
export function createServices(config: AppEnv = env): Services {
  if (config.useMock) {
    return {
      posture: new MockPostureService(),
      createLive: () => new MockLiveAnalysisService(),
      isMock: true,
    };
  }
  return {
    posture: new ApiPostureService(config.apiBaseUrl),
    createLive: () => new WebSocketLiveAnalysisService({ url: config.wsUrl }),
    isMock: false,
  };
}
