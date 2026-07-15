import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Board as BoardData, NewBoard } from "@atlas-tab/core";
import { Board } from "../Board/Board";
import { NewBoardCell } from "./NewBoardCell";
import { clampColumn, computeLayoutParams, GRID_GAP_PX, MIN_BOARD_WIDTH_PX } from "./layout";
import styles from "./BoardGrid.module.css";

// Integer CSS Grid tracks (fixed board-width columns, integer gap) give
// pixel-exact column boundaries by construction — this is the ARCHITECTURE.md
// § 5 "integer pixel positioning" requirement, satisfied without manual
// position rounding. The actual column count/width come from ./layout
// (ported from Markmez v1's getLayoutParams()).

export interface BoardGridProps {
  pageId: string;
  boards: BoardData[]; // already filtered to the active page
  boardWidthPx: number;
  maxColumns: number | null; // null = auto-fit to viewport width
  renderBody: (board: BoardData) => ReactNode;
  onCreateBoard: (draft: NewBoard) => void;
  onRenameBoard: (boardId: string, name: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onMoveBoard: (boardId: string, targetCol: number, targetIndex: number) => void;
  onMoveBookmark: (bookmarkId: string, targetBoardId: string, targetIndex: number) => void;
}

function ColumnEndDroppable({ col, children }: { col: number; children: ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: `column-end-${col}`,
    data: { type: "board-column-end", col },
  });
  return (
    <div ref={setNodeRef} className={styles.columnEnd}>
      {children}
    </div>
  );
}

export function BoardGrid({
  pageId,
  boards,
  boardWidthPx,
  maxColumns,
  renderBody,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onMoveBoard,
  onMoveBookmark,
}: BoardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(() => ({
    numCols: 1,
    boardWidthPx: Math.max(MIN_BOARD_WIDTH_PX, boardWidthPx),
  }));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setLayout(computeLayoutParams(width, boardWidthPx, maxColumns));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxColumns, boardWidthPx]);

  const { numCols: columnCount, boardWidthPx: renderedBoardWidthPx } = layout;
  const columns = Array.from({ length: columnCount }, (_, col) =>
    boards
      .filter((b) => clampColumn(b.col, columnCount) === col)
      .sort((a, b) => a.row - b.row)
      .map((b) => (b.col === col ? b : { ...b, col })),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as Record<string, unknown> | undefined;
    const overData = over.data.current as Record<string, unknown> | undefined;
    if (!activeData || !overData) return;

    if (activeData.type === "board") {
      if (overData.type === "board") {
        onMoveBoard(active.id as string, overData.col as number, overData.row as number);
      } else if (overData.type === "board-column-end") {
        onMoveBoard(active.id as string, overData.col as number, Number.MAX_SAFE_INTEGER);
      }
    } else if (activeData.type === "bookmark") {
      if (overData.type === "bookmark") {
        onMoveBookmark(active.id as string, overData.boardId as string, overData.order as number);
      } else if (overData.type === "bookmark-board-end") {
        onMoveBookmark(active.id as string, overData.boardId as string, Number.MAX_SAFE_INTEGER);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, ${renderedBoardWidthPx}px)`,
        gap: GRID_GAP_PX,
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {columns.map((columnBoards, col) => (
          <div key={col} className={styles.column} style={{ gridColumn: col + 1 }}>
            {columnBoards.map((board) => (
              <Board
                key={board.id}
                board={board}
                onRename={(name) => onRenameBoard(board.id, name)}
                onDelete={() => onDeleteBoard(board.id)}
              >
                {renderBody(board)}
              </Board>
            ))}
            <ColumnEndDroppable col={col}>
              <NewBoardCell
                pageId={pageId}
                col={col}
                row={columnBoards.length}
                onCreate={onCreateBoard}
              />
            </ColumnEndDroppable>
          </div>
        ))}
      </DndContext>
    </div>
  );
}
