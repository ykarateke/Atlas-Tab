import { describe, expect, it } from "vitest";
import { clampColumn, computeLayoutParams, GRID_GAP_PX, MIN_BOARD_WIDTH_PX } from "./layout";

describe("computeLayoutParams", () => {
  it("auto mode: fits as many requested-width columns as the container allows", () => {
    // usable = 1200 - 152 = 1048; requested 220 -> floor((1048+14)/(220+14)) = 4
    const result = computeLayoutParams(1200, 220, null);
    expect(result.numCols).toBe(4);
    expect(result.boardWidthPx).toBeGreaterThanOrEqual(220);
  });

  it("never renders a board narrower than MIN_BOARD_WIDTH_PX, even in a tiny container", () => {
    const result = computeLayoutParams(300, 220, null);
    expect(result.boardWidthPx).toBeGreaterThanOrEqual(MIN_BOARD_WIDTH_PX);
    expect(result.numCols).toBeGreaterThanOrEqual(1);
  });

  it("caps a manual column count at how many MIN_BOARD_WIDTH_PX columns can physically fit", () => {
    // usable = 300 - 152 = 148, which can't even fit 1 column at MIN_BOARD_WIDTH_PX,
    // so usable is floored to MIN_BOARD_WIDTH_PX itself -> maxCols = 1.
    const result = computeLayoutParams(300, 220, 9);
    expect(result.numCols).toBe(1);
  });

  it("does not grow the board width past the requested width even with room to spare", () => {
    // usable = 1200 - 152 = 1048; 3 fixed columns -> fitW = floor((1048 - 2*14)/3) = 340,
    // but the requested width (220) is smaller, so it wins — extra space is left as slack,
    // matching v1: fewer columns raises the *cap*, it doesn't force-fill it.
    const result = computeLayoutParams(1200, 220, 3);
    expect(result.numCols).toBe(3);
    expect(result.boardWidthPx).toBe(220);
  });

  it("never exceeds the requested width even if more room is available", () => {
    // usable = 3000 - 152 = 2848; 2 fixed columns -> fitW would be huge, clamped to requested (220)
    const result = computeLayoutParams(3000, 220, 2);
    expect(result.numCols).toBe(2);
    expect(result.boardWidthPx).toBe(220);
  });

  it("shrinks the board width below the requested width to fit a high manual column count", () => {
    const result = computeLayoutParams(1200, 260, 5);
    const usable = 1200 - 2 * 76;
    const expectedFitW = Math.floor((usable - 4 * GRID_GAP_PX) / 5);
    expect(result.numCols).toBe(5);
    expect(result.boardWidthPx).toBe(Math.max(MIN_BOARD_WIDTH_PX, expectedFitW));
  });
});

describe("clampColumn", () => {
  it("passes through a column that already fits", () => {
    expect(clampColumn(1, 4)).toBe(1);
  });

  it("clamps an out-of-range column into the last visible column", () => {
    expect(clampColumn(7, 4)).toBe(3);
  });
});
