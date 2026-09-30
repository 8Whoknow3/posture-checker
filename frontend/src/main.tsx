import "@fontsource-variable/vazirmatn";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createServices } from "./services";
import { AppProvider } from "./state/AppContext";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";

const services = createServices();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider services={services}>
      <App />
    </AppProvider>
  </StrictMode>,
);
