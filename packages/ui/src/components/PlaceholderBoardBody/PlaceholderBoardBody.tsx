import type { BoardType, TranslationKey } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./PlaceholderBoardBody.module.css";

const TYPE_LABEL_KEYS: Record<Exclude<BoardType, "bookmarks">, TranslationKey> = {
  notes: "board.type.notes",
  calendar: "board.type.calendar",
  pomodoro: "board.type.pomodoro",
  search: "board.type.search",
};

export interface PlaceholderBoardBodyProps {
  type: Exclude<BoardType, "bookmarks">;
}

// Structural placeholder for board types whose interactive content (notes
// autosave, calendar month view, pomodoro timer, search mini-input) ships in
// a later phase — see ROADMAP.md Phase 2. The board itself is fully
// creatable/draggable/deletable in Phase 1, only the body is inert.
export function PlaceholderBoardBody({ type }: PlaceholderBoardBodyProps) {
  const t = useTranslation();
  return (
    <p className={styles.placeholder}>
      {t("placeholder.comingSoon", { type: t(TYPE_LABEL_KEYS[type]) })}
    </p>
  );
}
