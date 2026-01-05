/**
 * @vitest-environment jsdom
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameStats } from "./GameStats";

describe("GameStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("should render score and round", () => {
    render(<GameStats totalScore={42} round={3} onReset={() => {}} />);

    expect(screen.getByText("SCORE: 42")).toBeTruthy();
    expect(screen.getByText("Round 3")).toBeTruthy();
  });

  it("should render reset button", () => {
    render(<GameStats totalScore={0} round={1} onReset={() => {}} />);

    expect(screen.getByRole("button", { name: "RESET" })).toBeTruthy();
  });

  describe("mouse hold-to-reset", () => {
    it("should show HOLD... text while holding", async () => {
      render(<GameStats totalScore={0} round={1} onReset={() => {}} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      // Advance timers partially
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText("HOLD...")).toBeTruthy();

      fireEvent.mouseUp(button);
    });

    it("should call onReset after holding for 1 second", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      // Advance past the hold duration
      await act(async () => {
        vi.advanceTimersByTime(1100);
      });

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("should not call onReset if released early", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      fireEvent.mouseUp(button);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onReset).not.toHaveBeenCalled();
    });

    it("should cancel on mouse leave", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      fireEvent.mouseLeave(button);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onReset).not.toHaveBeenCalled();
      expect(screen.getByText("RESET")).toBeTruthy();
    });
  });

  describe("touch hold-to-reset (mobile)", () => {
    it("should trigger reset on touch hold", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.touchStart(button);

      await act(async () => {
        vi.advanceTimersByTime(1100);
      });

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("should cancel on touch end", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.touchStart(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      fireEvent.touchEnd(button);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onReset).not.toHaveBeenCalled();
    });

    it("should cancel on touch cancel", async () => {
      const onReset = vi.fn();
      render(<GameStats totalScore={0} round={1} onReset={onReset} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.touchStart(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      fireEvent.touchCancel(button);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onReset).not.toHaveBeenCalled();
    });
  });

  describe("progress indicator", () => {
    it("should show progress fill while holding", async () => {
      render(<GameStats totalScore={0} round={1} onReset={() => {}} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // The progress span should have width style set
      const progressSpan = button.querySelector("span.absolute");
      expect(progressSpan).toBeTruthy();

      fireEvent.mouseUp(button);
    });

    it("should reset progress after release", async () => {
      render(<GameStats totalScore={0} round={1} onReset={() => {}} />);

      const button = screen.getByRole("button", { name: "RESET" });

      fireEvent.mouseDown(button);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      fireEvent.mouseUp(button);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const progressSpan = button.querySelector("span.absolute") as HTMLElement;
      expect(progressSpan?.style.width).toBe("0%");
    });
  });
});
