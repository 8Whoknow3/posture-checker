import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = "light";
});

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("switches to dark, persists the choice and switches back", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "حالت تاریک" });
    expect(button.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("paw-theme")).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("paw-theme")).toBe("light");
  });
});
