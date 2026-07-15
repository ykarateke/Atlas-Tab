import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { combineRefs } from "./combineRefs";

describe("combineRefs", () => {
  it("calls every function ref with the node", () => {
    const a = vi.fn();
    const b = vi.fn();
    const node = {} as HTMLDivElement;
    combineRefs(a, b)(node);
    expect(a).toHaveBeenCalledWith(node);
    expect(b).toHaveBeenCalledWith(node);
  });

  it("sets .current on every object ref", () => {
    const refA = createRef<HTMLDivElement>();
    const refB = createRef<HTMLDivElement>();
    const node = {} as HTMLDivElement;
    combineRefs(refA, refB)(node);
    expect(refA.current).toBe(node);
    expect(refB.current).toBe(node);
  });

  it("skips undefined refs without throwing", () => {
    const node = {} as HTMLDivElement;
    expect(() => combineRefs(undefined, vi.fn())(node)).not.toThrow();
  });
});
