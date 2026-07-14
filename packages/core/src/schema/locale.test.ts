import { describe, expect, it } from "vitest";
import { localeSettingsSchema } from "./locale";

describe("localeSettingsSchema", () => {
  it("accepts a valid locale config", () => {
    const result = localeSettingsSchema.safeParse({
      schemaVersion: 1,
      timeFormat: "24h",
      dateFormat: "DMY",
      weekStart: 1,
      tempUnit: "metric",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a weekStart outside 0|1", () => {
    const result = localeSettingsSchema.safeParse({
      schemaVersion: 1,
      timeFormat: "24h",
      dateFormat: "DMY",
      weekStart: 2,
      tempUnit: "metric",
    });
    expect(result.success).toBe(false);
  });
});
