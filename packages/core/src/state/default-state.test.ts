import { describe, expect, it } from "vitest";
import { appStateSchema } from "../schema/app-state";
import { createDefaultAppState } from "./default-state";

describe("createDefaultAppState", () => {
  it("produces a schema-valid state with a single active page", () => {
    const state = createDefaultAppState();
    const result = appStateSchema.safeParse(state);
    expect(result.success).toBe(true);
    expect(state.pages).toHaveLength(1);
    expect(state.activePageId).toBe(state.pages[0]!.id);
  });
});
