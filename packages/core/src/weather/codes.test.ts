import { describe, expect, it } from "vitest";
import { weatherCodeToCategory } from "./codes";

describe("weatherCodeToCategory", () => {
  it.each([
    [0, "clear"],
    [2, "cloudy"],
    [45, "fog"],
    [61, "rain"],
    [73, "snow"],
    [95, "storm"],
  ] as const)("maps code %i to %s", (code, expected) => {
    expect(weatherCodeToCategory(code)).toBe(expected);
  });
});
