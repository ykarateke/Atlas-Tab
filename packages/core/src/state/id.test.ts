import { describe, expect, it } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  it("generates unique string ids", () => {
    const a = createId();
    const b = createId();
    expect(typeof a).toBe("string");
    expect(a).not.toBe(b);
  });
});
