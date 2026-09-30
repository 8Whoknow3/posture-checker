import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { Services } from "../services";
import { toAnalysisFailure } from "../services/errors";
import {
  analysisReducer,
  initialAnalysisState,
  type AnalysisState,
  type InputSource,
} from "./analysisReducer";

interface AppContextValue {
  services: Services;
  analysis: AnalysisState;
  /** Resolves `true` when a result is available. Never throws. */
  analyze: (
    image: Blob,
    source: InputSource,
    preview: string | null,
  ) => Promise<boolean>;
  resetAnalysis: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  const [analysis, dispatch] = useReducer(analysisReducer, initialAnalysisState);
  const requestRef = useRef<{ id: number; controller: AbortController } | null>(
    null,
  );

  const cancelPending = useCallback(() => {
    requestRef.current?.controller.abort();
    requestRef.current = null;
  }, []);

  const analyze = useCallback<AppContextValue["analyze"]>(
    async (image, source, preview) => {
      cancelPending();
      const controller = new AbortController();
      const id = (requestRef.current?.id ?? 0) + 1;
      requestRef.current = { id, controller };
      dispatch({ type: "start", source, preview });

      try {
        const result = await services.posture.analyzeImage(
          image,
          controller.signal,
        );
        if (requestRef.current?.id !== id) return false;
        dispatch({ type: "success", result });
        return true;
      } catch (error) {
        if (requestRef.current?.id !== id) return false;
        const failure = toAnalysisFailure(error);
        dispatch({
          type: "failure",
          code: failure.code,
          detail: failure.message === failure.code ? undefined : failure.message,
        });
        return false;
      }
    },
    [services, cancelPending],
  );

  const resetAnalysis = useCallback(() => {
    cancelPending();
    dispatch({ type: "reset" });
  }, [cancelPending]);

  const value = useMemo(
    () => ({ services, analysis, analyze, resetAnalysis }),
    [services, analysis, analyze, resetAnalysis],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}
