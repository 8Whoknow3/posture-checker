import { useId, useSyncExternalStore } from "react";
import {
  getMockScenario,
  MOCK_SCENARIOS,
  setMockScenario,
  subscribeMockScenario,
  type MockScenario,
} from "../adapters/mock/scenario";

/** DEVELOPMENT ONLY: lets you simulate backend outcomes. Rendered only in mock mode. */
export function DevMockPanel() {
  const scenario = useSyncExternalStore(subscribeMockScenario, getMockScenario);
  const id = useId();

  return (
    <div className="dev-panel">
      <span className="dev-panel__tag">حالت آزمایشی</span>
      <p className="dev-panel__text">
        داده‌ها شبیه‌سازی‌شده‌اند و نتیجهٔ تحلیل واقعی نیستند.
      </p>
      <label htmlFor={id} className="dev-panel__label">
        سناریو
      </label>
      <select
        id={id}
        className="input"
        value={scenario}
        onChange={(event) => setMockScenario(event.target.value as MockScenario)}
      >
        {MOCK_SCENARIOS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
