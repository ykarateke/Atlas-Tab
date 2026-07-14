import { describe, expect, it } from "vitest";
import { weatherConfigSchema } from "./weather";

describe("weatherConfigSchema", () => {
  it("accepts a disabled config with a null cache", () => {
    const result = weatherConfigSchema.safeParse({
      enabled: false,
      city: "",
      units: "metric",
      lat: null,
      lon: null,
      cache: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a populated cache", () => {
    const result = weatherConfigSchema.safeParse({
      enabled: true,
      city: "Istanbul",
      units: "metric",
      lat: 41.0,
      lon: 28.9,
      cache: {
        temp: 22,
        feelsLike: 21,
        weatherCode: 1,
        windSpeed: 10,
        ts: Date.now(),
        resolvedName: "Istanbul",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid units value", () => {
    const result = weatherConfigSchema.safeParse({
      enabled: true,
      city: "Istanbul",
      units: "kelvin",
      lat: null,
      lon: null,
      cache: null,
    });
    expect(result.success).toBe(false);
  });
});
