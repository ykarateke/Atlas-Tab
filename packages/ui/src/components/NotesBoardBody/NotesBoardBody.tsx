import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./NotesBoardBody.module.css";

const AUTOSAVE_DEBOUNCE_MS = 600;
const MIN_HEIGHT_PX = 80;

export interface NotesBoardBodyProps {
  content: string;
  height: number;
  onSave: (updates: { content?: string; height?: number }) => void;
}

// Autosaves ~600ms after the user stops typing, and lets the board resize via
// a drag handle at the bottom (FEATURE_SPECS.md § Widgets / Notes).
export function NotesBoardBody({ content, height, onSave }: NotesBoardBodyProps) {
  const t = useTranslation();
  const [draft, setDraft] = useState(content);
  const [liveHeight, setLiveHeight] = useState(height);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

  // Re-sync local draft/height if the prop changes from outside this
  // component (e.g. a future cross-tab sync) — adjusted during render per
  // React's guidance (state, not a ref, tracks the previous prop), avoiding
  // an extra render pass through an effect.
  const [prevContentProp, setPrevContentProp] = useState(content);
  if (content !== prevContentProp) {
    setPrevContentProp(content);
    setDraft(content);
  }
  const [prevHeightProp, setPrevHeightProp] = useState(height);
  if (height !== prevHeightProp) {
    setPrevHeightProp(height);
    setLiveHeight(height);
  }

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setDraft(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave({ content: value }), AUTOSAVE_DEBOUNCE_MS);
  }

  function handleResizeStart(e: ReactPointerEvent<HTMLDivElement>) {
    dragState.current = { startY: e.clientY, startHeight: liveHeight };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handleResizeMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const next = Math.max(
      MIN_HEIGHT_PX,
      dragState.current.startHeight + (e.clientY - dragState.current.startY),
    );
    setLiveHeight(next);
  }

  function handleResizeEnd() {
    if (!dragState.current) return;
    dragState.current = null;
    onSave({ height: liveHeight });
  }

  return (
    <div className={styles.body}>
      <textarea
        className={styles.textarea}
        style={{ height: liveHeight }}
        value={draft}
        onChange={handleChange}
        placeholder={t("notes.placeholder")}
      />
      <div
        className={styles.resizeHandle}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
      />
    </div>
  );
}
