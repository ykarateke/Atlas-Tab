// Ported from Markmez v1's getLayoutParams() (newtab.js). Column count and
// actual rendered board width are computed together, not independently:
// - Board width never drops below MIN_BOARD_WIDTH_PX, however many columns
//   are requested — it shrinks below the requested width only as far as
//   needed to keep that many columns from overlapping the reserved side
//   space, and never grows past the requested width even if more room is
//   left over (fewer columns just raises the ceiling, it doesn't force-fill
//   it).
// - SIDE_RESERVE_PX is reserved symmetrically on both sides so the grid is
//   never covered by the floating fab stack, and stays visually centered.
export const MIN_BOARD_WIDTH_PX = 190;
export const GRID_GAP_PX = 14;
export const SIDE_RESERVE_PX = 76;

export interface LayoutParams {
  boardWidthPx: number;
  numCols: number;
}

export function computeLayoutParams(
  containerWidth: number,
  requestedWidthPx: number,
  manualColumns: number | null,
): LayoutParams {
  const usable = Math.max(MIN_BOARD_WIDTH_PX, containerWidth - 2 * SIDE_RESERVE_PX);
  const maxCols = Math.max(
    1,
    Math.floor((usable + GRID_GAP_PX) / (MIN_BOARD_WIDTH_PX + GRID_GAP_PX)),
  );

  const numCols =
    manualColumns && manualColumns > 0
      ? Math.min(manualColumns, maxCols)
      : Math.min(
          maxCols,
          Math.max(1, Math.floor((usable + GRID_GAP_PX) / (requestedWidthPx + GRID_GAP_PX))),
        );

  const fitW = Math.floor((usable - (numCols - 1) * GRID_GAP_PX) / numCols);
  const boardWidthPx = Math.max(MIN_BOARD_WIDTH_PX, Math.min(requestedWidthPx, fitW));

  return { boardWidthPx, numCols };
}

// A board whose stored column no longer fits the current layout (e.g. the
// window narrowed, or the column count was lowered below where it already
// lived) is clamped into the last visible column rather than becoming
// invisible — matches v1's `b.col >= numCols ? numCols - 1 : b.col`.
export function clampColumn(col: number, numCols: number): number {
  return col >= numCols ? numCols - 1 : col;
}
