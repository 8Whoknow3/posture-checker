import { AppShell } from "./components/AppShell";
import { AnalyzePage } from "./pages/AnalyzePage";
import { CapturePage } from "./pages/CapturePage";
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { LivePage } from "./pages/LivePage";
import { ResultPage } from "./pages/ResultPage";
import { useHashRoute } from "./state/useHashRoute";

export function App() {
  const [route, navigate] = useHashRoute();

  return (
    <AppShell route={route}>
      {route === "/" && <HomePage />}
      {route === "/analyze" && <AnalyzePage navigate={navigate} />}
      {route === "/capture" && <CapturePage navigate={navigate} />}
      {route === "/live" && <LivePage />}
      {route === "/result" && <ResultPage navigate={navigate} />}
      {route === "/help" && <HelpPage />}
    </AppShell>
  );
}
