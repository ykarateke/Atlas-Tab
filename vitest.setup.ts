import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom has no real layout engine and doesn't implement ResizeObserver at
// all. Components (e.g. BoardGrid) that measure their container via
// ResizeObserver need at least one synchronous callback firing in tests —
// this stub reports a generous fixed width so tests can reason about column
// counts without needing per-test width mocking.
class ResizeObserverStub implements ResizeObserver {
  #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  observe(target: Element) {
    const rect: DOMRectReadOnly = {
      width: 2000,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 2000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
    this.#callback(
      [{ target, contentRect: rect } as ResizeObserverEntry],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
}
