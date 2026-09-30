import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { MockLiveAnalysisService } from "./adapters/mock/MockLiveAnalysisService";
import { MockPostureService } from "./adapters/mock/MockPostureService";
import { setMockScenario } from "./adapters/mock/scenario";
import type { Services } from "./services";
import { AppProvider } from "./state/AppContext";

const services: Services = {
  posture: new MockPostureService(0),
  createLive: () => new MockLiveAnalysisService(50),
  isMock: true,
};

function renderApp(hash: string) {
  window.location.hash = hash;
  return render(
    <AppProvider services={services}>
      <App />
    </AppProvider>,
  );
}

function upload(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["x"], "sit.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => undefined;
  window.scrollTo = () => undefined;
});

afterEach(() => {
  cleanup();
  setMockScenario("success");
  window.location.hash = "";
});

describe("PAW flows (mock adapters)", () => {
  it("renders the home page with the three input paths", () => {
    renderApp("#/");
    expect(screen.getByText("آپلود تصویر")).toBeTruthy();
    expect(screen.getByText("استفاده از وبکم")).toBeTruthy();
    expect(screen.getByText("شروع تحلیل زنده")).toBeTruthy();
  });

  it("upload → analyze → result with project risk score", async () => {
    const { container } = renderApp("#/analyze");
    upload(container);
    fireEvent.click(screen.getByRole("button", { name: "تحلیل وضعیت نشستن" }));

    await waitFor(() => expect(screen.getByText("نتیجهٔ تحلیل")).toBeTruthy());
    expect(screen.getByText("امتیاز ریسک پروژه")).toBeTruthy();
    expect(container.querySelectorAll(".metric").length).toBe(5);
  });

  it("shows unavailable metrics for the side view", async () => {
    setMockScenario("side_view");
    const { container } = renderApp("#/analyze");
    upload(container);
    fireEvent.click(screen.getByRole("button", { name: "تحلیل وضعیت نشستن" }));

    await waitFor(() => expect(screen.getByText("نتیجهٔ تحلیل")).toBeTruthy());
    expect(container.querySelectorAll(".metric--unavailable").length).toBe(2);
  });

  it("shows a what/why/next error for no person detected", async () => {
    setMockScenario("no_person");
    const { container } = renderApp("#/analyze");
    upload(container);
    fireEvent.click(screen.getByRole("button", { name: "تحلیل وضعیت نشستن" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("فردی در تصویر شناسایی نشد");
    expect(alert.textContent).toContain("چرا");
    expect(alert.textContent).toContain("قدم بعدی");
  });

  it("rejects unsupported file types locally", () => {
    const { container } = renderApp("#/analyze");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "a.gif", { type: "image/gif" })] },
    });
    expect(screen.getByRole("alert").textContent).toContain("تصویر خوانده نشد");
  });

  it("shows the camera setup state on the live page", () => {
    renderApp("#/live");
    expect(screen.getByText("آماده‌سازی دوربین")).toBeTruthy();
    expect(screen.getByText("در انتظار نتیجه")).toBeTruthy();
  });

  it("renders the help page", () => {
    renderApp("#/help");
    expect(screen.getByText("پنج معیار")).toBeTruthy();
  });
});
