import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PomodoroTimerState } from "@atlas-tab/core";
import { PomodoroBoardBody } from "./PomodoroBoardBody";

vi.mock("../../audio/playBeep", () => ({ playBeep: vi.fn() }));
import { playBeep } from "../../audio/playBeep";

const stoppedTimer: PomodoroTimerState = {
  phase: "focus",
  sessionsCompleted: 2,
  timeLeftSeconds: 125,
  running: false,
  startedAt: null,
  startedTimeLeftSeconds: 125,
};

describe("PomodoroBoardBody", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows the phase label, formatted time, and session count", () => {
    render(
      <PomodoroBoardBody timer={stoppedTimer} onStart={vi.fn()} onPause={vi.fn()} onReset={vi.fn()} onTick={vi.fn()} />,
    );
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();
    expect(screen.getByText("2 sessions")).toBeInTheDocument();
  });

  it("shows Start when stopped and calls onStart when clicked", async () => {
    const onStart = vi.fn();
    render(
      <PomodoroBoardBody timer={stoppedTimer} onStart={onStart} onPause={vi.fn()} onReset={vi.fn()} onTick={vi.fn()} />,
    );
    await userEvent.click(screen.getByLabelText("Start"));
    expect(onStart).toHaveBeenCalled();
  });

  it("shows Pause when running and calls onPause when clicked", async () => {
    vi.useFakeTimers();
    const runningTimer: PomodoroTimerState = { ...stoppedTimer, running: true, startedAt: Date.now() };
    const onPause = vi.fn();
    render(
      <PomodoroBoardBody timer={runningTimer} onStart={vi.fn()} onPause={onPause} onReset={vi.fn()} onTick={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Pause"));
    expect(onPause).toHaveBeenCalled();
  });

  it("calls onReset when the reset button is clicked", async () => {
    const onReset = vi.fn();
    render(
      <PomodoroBoardBody timer={stoppedTimer} onStart={vi.fn()} onPause={vi.fn()} onReset={onReset} onTick={vi.fn()} />,
    );
    await userEvent.click(screen.getByLabelText("Reset"));
    expect(onReset).toHaveBeenCalled();
  });

  it("calls onTick once per second while running", () => {
    vi.useFakeTimers();
    const runningTimer: PomodoroTimerState = { ...stoppedTimer, running: true, startedAt: Date.now() };
    const onTick = vi.fn();
    render(
      <PomodoroBoardBody timer={runningTimer} onStart={vi.fn()} onPause={vi.fn()} onReset={vi.fn()} onTick={onTick} />,
    );
    expect(onTick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it("does not call onTick when stopped", () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    render(
      <PomodoroBoardBody timer={stoppedTimer} onStart={vi.fn()} onPause={vi.fn()} onReset={vi.fn()} onTick={onTick} />,
    );
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it("plays a beep when the phase changes between renders", () => {
    const { rerender } = render(
      <PomodoroBoardBody timer={stoppedTimer} onStart={vi.fn()} onPause={vi.fn()} onReset={vi.fn()} onTick={vi.fn()} />,
    );
    expect(playBeep).not.toHaveBeenCalled();

    rerender(
      <PomodoroBoardBody
        timer={{ ...stoppedTimer, phase: "shortBreak" }}
        onStart={vi.fn()}
        onPause={vi.fn()}
        onReset={vi.fn()}
        onTick={vi.fn()}
      />,
    );
    expect(playBeep).toHaveBeenCalledTimes(1);
  });
});
