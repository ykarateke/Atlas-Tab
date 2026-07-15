import type { AppState } from "../schema/app-state";
import { deleteBoard } from "./boards";
import { createId } from "./id";

export function addPage(state: AppState, name: string): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;

  const nextOrder = state.pages.length
    ? Math.max(...state.pages.map((p) => p.order)) + 1
    : 0;
  const newPage = { id: createId(), name: trimmed, order: nextOrder };

  return {
    ...state,
    pages: [...state.pages, newPage],
    activePageId: newPage.id,
  };
}

export function renamePage(state: AppState, pageId: string, name: string): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;

  return {
    ...state,
    pages: state.pages.map((p) => (p.id === pageId ? { ...p, name: trimmed } : p)),
  };
}

export function reorderPages(state: AppState, orderedPageIds: string[]): AppState {
  const orderById = new Map(orderedPageIds.map((id, index) => [id, index]));
  return {
    ...state,
    pages: state.pages
      .map((p) => ({ ...p, order: orderById.get(p.id) ?? p.order }))
      .sort((a, b) => a.order - b.order),
  };
}

// The last remaining page can never be deleted (FEATURE_SPECS.md § Pages).
export function deletePage(state: AppState, pageId: string): AppState {
  if (state.pages.length <= 1) return state;
  if (!state.pages.some((p) => p.id === pageId)) return state;

  const boardsToDelete = state.boards.filter((b) => b.pageId === pageId);
  const stateAfterBoardDeletion = boardsToDelete.reduce(
    (acc, board) => deleteBoard(acc, board.id),
    state,
  );

  const remainingPages = stateAfterBoardDeletion.pages.filter((p) => p.id !== pageId);
  const nextActivePageId =
    stateAfterBoardDeletion.activePageId === pageId
      ? [...remainingPages].sort((a, b) => a.order - b.order)[0]!.id
      : stateAfterBoardDeletion.activePageId;

  return {
    ...stateAfterBoardDeletion,
    pages: remainingPages,
    activePageId: nextActivePageId,
  };
}
