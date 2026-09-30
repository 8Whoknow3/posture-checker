import { useCallback, useEffect, useReducer, useRef } from "react";
import type { LiveAnalysisService } from "../services/LiveAnalysisService";
import type { Services } from "../services";
import { initialLiveState, liveReducer } from "./liveReducer";

export function useLiveAnalysis(services: Services) {
  const [state, dispatch] = useReducer(liveReducer, initialLiveState);
  const serviceRef = useRef<LiveAnalysisService | null>(null);

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    serviceRef.current = null;
  }, []);

  const start = useCallback(
    (video: HTMLVideoElement) => {
      serviceRef.current?.stop();
      const service = services.createLive();
      serviceRef.current = service;
      dispatch({ type: "begin" });
      service.start(video, (event) => {
        if (serviceRef.current === service) dispatch({ type: "event", event });
      });
    },
    [services],
  );

  useEffect(() => () => serviceRef.current?.stop(), []);

  return { state, start, stop };
}
