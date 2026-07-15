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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Board as BoardData, NewBoard } from "@atlas-tab/core";
import { Board } from "../Board/Board";
import { NewBoardCell } from "./NewBoardCell";
import styles from "./BoardGrid.module.css";

// Integer CSS Grid tracks (fixed `boardWidthPx` columns, integer `gap`) give
// pixel-exact column boundaries by construction — this is the ARCHITECTURE.md
// § 5 "integer pixel positioning" requirement, satisfied without manual
// position rounding.
const GAP_PX = 16;
const MIN_COLUMNS = 1;

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
  const [autoColumns, setAutoColumns] = useState(MIN_COLUMNS);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (maxColumns !== null) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setAutoColumns(Math.max(MIN_COLUMNS, Math.floor((width + GAP_PX) / (boardWidthPx + GAP_PX))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxColumns, boardWidthPx]);

  const columnCount = maxColumns ?? autoColumns;
  const columns = Array.from({ length: columnCount }, (_, col) =>
    boards.filter((b) => b.col === col).sort((a, b) => a.row - b.row),
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
      style={{ gridTemplateColumns: `repeat(${columnCount}, ${boardWidthPx}px)`, gap: GAP_PX }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {columns.map((columnBoards, col) => (
          <SortableContext
            key={col}
            items={columnBoards.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.column} style={{ gridColumn: col + 1 }}>
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
          </SortableContext>
        ))}
      </DndContext>
    </div>
  );
}
