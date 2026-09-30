import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PostureMetric } from "../types";
import { MetricCard, UNAVAILABLE_EXPLANATION } from "./MetricCard";

const base: PostureMetric = {
  key: "head_tilt",
  title: "کجی جانبی سر",
  tier: 2,
  value: null,
  unit: "درجه",
  status: "unavailable",
  statusLabel: "قابل سنجش نیست",
  reference: "",
  tip: null,
  note: null,
};

describe("MetricCard", () => {
  it("shows a dash, status and explanation for unavailable metrics", () => {
    const { container } = render(<MetricCard metric={base} />);
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("قابل سنجش نیست", { exact: false })).toBeTruthy();
    expect(screen.getByText(UNAVAILABLE_EXPLANATION)).toBeTruthy();
    expect(container.querySelector(".metric--unavailable")).not.toBeNull();
    expect(container.textContent).not.toContain("درجه");
  });

  it("shows value and unit for available metrics", () => {
    render(
      <MetricCard
        metric={{ ...base, value: 12.3, status: "good", statusLabel: "مطلوب" }}
      />,
    );
    expect(screen.getByText("12.3")).toBeTruthy();
    expect(screen.getByText("درجه")).toBeTruthy();
  });
});
