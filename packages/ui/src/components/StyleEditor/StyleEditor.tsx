import { useEffect, useState } from "react";
import type { AppSettings, ThemeStyle } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { GRID_GAP_PX, MIN_BOARD_WIDTH_PX, SIDE_RESERVE_PX } from "../BoardGrid/layout";
import styles from "./StyleEditor.module.css";

export interface StyleEditorProps {
  themeStyle: ThemeStyle;
  onChange: (updates: Partial<ThemeStyle>) => void;
  onReset: () => void;
  onClose: () => void;
  maxColumns: AppSettings["maxBoardColumns"];
  boardWidthPx: AppSettings["boardWidthPx"];
  onLayoutChange: (updates: Pick<AppSettings, "maxBoardColumns" | "boardWidthPx">) => void;
  wallpaperCurrentId: string | null;
  onWallpaperChange: (id: string) => void;
  // While the opacity/blur sliders are being dragged, the parent fades the
  // opaque modal chrome down to near-invisible so the boards/wallpaper
  // underneath are visible as a live preview of the change.
  onPreviewChange?: (previewing: boolean) => void;
}

const TEXT_SCALES: ThemeStyle["textScale"][] = [0.9, 1, 1.15];
const COLUMN_OPTIONS = [4, 5, 6, 7, 8, 9] as const;
const MAX_BOARD_WIDTH_AUTO = 400;
// public/wallpapers/01.jpg .. 25.jpg — bundled presets (see
// public/wallpapers/ATTRIBUTIONS.md). Upload/history is a later phase.
const BUNDLED_WALLPAPERS = Array.from(
  { length: 25 },
  (_, i) => `${String(i + 1).padStart(2, "0")}.jpg`,
);

// FEATURE_SPECS.md § Settings: board width's max is "dynamically capped by
// what the current column count can actually fit" — approximated from the
// viewport width (same MIN_BOARD_WIDTH_PX/SIDE_RESERVE_PX BoardGrid's own
// layout math uses, see ../BoardGrid/layout) since this modal isn't inside
// the grid's own measured container.
function maxBoardWidthFor(columns: AppSettings["maxBoardColumns"]): number {
  if (columns === null) return MAX_BOARD_WIDTH_AUTO;
  const available = window.innerWidth - 2 * SIDE_RESERVE_PX - GRID_GAP_PX * (columns - 1);
  return Math.max(MIN_BOARD_WIDTH_PX, Math.floor(available / columns));
}

// Changes apply live as controls move (matching how the rest of Phase 1
// mutates state directly, e.g. Trash) rather than v1's staged
// cancel/save flow — Reset/Close are the only two actions needed here.
export function StyleEditor({
  themeStyle,
  onChange,
  onReset,
  onClose,
  maxColumns,
  boardWidthPx,
  onLayoutChange,
  wallpaperCurrentId,
  onWallpaperChange,
  onPreviewChange,
}: StyleEditorProps) {
  const t = useTranslation();
  const widthCap = maxBoardWidthFor(maxColumns);
  const clampedWidth = Math.min(boardWidthPx, widthCap);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!previewing) return;
    function stopPreview() {
      setPreviewing(false);
    }
    window.addEventListener("pointerup", stopPreview);
    window.addEventListener("pointercancel", stopPreview);
    return () => {
      window.removeEventListener("pointerup", stopPreview);
      window.removeEventListener("pointercancel", stopPreview);
    };
  }, [previewing]);

  useEffect(() => {
    onPreviewChange?.(previewing);
  }, [previewing, onPreviewChange]);

  return (
    <div className={styles.body}>
      <div className={styles.sectionTitle} data-first>
        {t("style.wallpaperTitle")}
      </div>
      <div className={styles.wallpaperGrid}>
        {BUNDLED_WALLPAPERS.map((file) => (
          <button
            key={file}
            type="button"
            className={`${styles.wallpaperThumb} ${file === wallpaperCurrentId ? styles.wallpaperThumbActive : ""}`}
            style={{ backgroundImage: `url("/wallpapers/${file}")` }}
            onClick={() => onWallpaperChange(file)}
          />
        ))}
      </div>

      <div className={styles.colorRow}>
        <label className={styles.field}>
          <span className={styles.label}>{t("style.accentColor")}</span>
          <span className={styles.colorWrap}>
            <span className={styles.swatch} style={{ background: themeStyle.accentHex }} />
            <input
              type="color"
              value={themeStyle.accentHex}
              onChange={(e) => onChange({ accentHex: e.target.value })}
            />
          </span>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("style.boardColor")}</span>
          <span className={styles.colorWrap}>
            <span className={styles.swatch} style={{ background: themeStyle.boardColorHex }} />
            <input
              type="color"
              value={themeStyle.boardColorHex}
              onChange={(e) => onChange({ boardColorHex: e.target.value })}
            />
          </span>
        </label>
      </div>

      <label className={styles.sliderField}>
        <span className={styles.label}>
          {t("style.boardOpacity")} <span>{themeStyle.boardOpacity}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={themeStyle.boardOpacity}
          onChange={(e) => onChange({ boardOpacity: Number(e.target.value) })}
          onPointerDown={() => setPreviewing(true)}
        />
      </label>

      <label className={styles.sliderField}>
        <span className={styles.label}>
          {t("style.boardBlur")} <span>{themeStyle.boardBlur}px</span>
        </span>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={themeStyle.boardBlur}
          onChange={(e) => onChange({ boardBlur: Number(e.target.value) })}
          onPointerDown={() => setPreviewing(true)}
        />
      </label>

      <div className={styles.sliderField}>
        <span className={styles.label}>{t("style.textSize")}</span>
        <div className={styles.seg}>
          {TEXT_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              className={themeStyle.textScale === scale ? styles.segActive : ""}
              onClick={() => onChange({ textScale: scale })}
            >
              {scale === 0.9 ? "S" : scale === 1 ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sliderField}>
        <span className={styles.label}>{t("style.textWeight")}</span>
        <div className={styles.seg}>
          <button
            type="button"
            className={!themeStyle.textBold ? styles.segActive : ""}
            onClick={() => onChange({ textBold: false })}
          >
            {t("style.normal")}
          </button>
          <button
            type="button"
            className={themeStyle.textBold ? styles.segActive : ""}
            onClick={() => onChange({ textBold: true })}
          >
            {t("style.bold")}
          </button>
        </div>
      </div>

      <div className={styles.sectionTitle}>{t("style.layoutTitle")}</div>

      <label className={styles.sliderField}>
        <span className={styles.label}>{t("style.maxColumns")}</span>
        <select
          className={styles.select}
          value={maxColumns ?? "auto"}
          onChange={(e) => {
            const value = e.target.value;
            const nextColumns = value === "auto" ? null : Number(value);
            onLayoutChange({
              maxBoardColumns: nextColumns,
              boardWidthPx: Math.min(boardWidthPx, maxBoardWidthFor(nextColumns)),
            });
          }}
        >
          <option value="auto">{t("style.columnsAuto")}</option>
          {COLUMN_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.sliderField}>
        <span className={styles.label}>
          {t("style.boardWidth")} <span>{clampedWidth}px</span>
        </span>
        <input
          type="range"
          min={MIN_BOARD_WIDTH_PX}
          max={widthCap}
          step={10}
          value={clampedWidth}
          onChange={(e) =>
            onLayoutChange({ maxBoardColumns: maxColumns, boardWidthPx: Number(e.target.value) })
          }
        />
      </label>

      <div className={styles.footer}>
        <button type="button" onClick={onReset}>
          {t("style.reset")}
        </button>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          {t("style.close")}
        </button>
      </div>
    </div>
  );
}
