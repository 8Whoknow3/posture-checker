/**
 * DEVELOPMENT ONLY.
 * Tiny store that selects which simulated outcome the mock adapters produce.
 * Not used when real adapters are active.
 */

export type MockScenario =
  | "success"
  | "side_view"
  | "no_person"
  | "invalid_image"
  | "processing_error"
  | "connection_lost";

export const MOCK_SCENARIOS: ReadonlyArray<{
  id: MockScenario;
  label: string;
}> = [
  { id: "success", label: "نتیجه موفق (نمای روبه‌رو)" },
  { id: "side_view", label: "نیم‌رخ (معیارهای ناموجود)" },
  { id: "no_person", label: "فردی شناسایی نشد" },
  { id: "invalid_image", label: "تصویر نامعتبر" },
  { id: "processing_error", label: "خطای پردازش" },
  { id: "connection_lost", label: "قطع ارتباط" },
];

let current: MockScenario = "success";
const listeners = new Set<() => void>();

export function getMockScenario(): MockScenario {
  return current;
}

export function setMockScenario(next: MockScenario): void {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function subscribeMockScenario(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
