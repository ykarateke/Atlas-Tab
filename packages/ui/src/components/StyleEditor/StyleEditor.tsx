import type { ThemeStyle } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./StyleEditor.module.css";

export interface StyleEditorProps {
  themeStyle: ThemeStyle;
  onChange: (updates: Partial<ThemeStyle>) => void;
  onReset: () => void;
  onClose: () => void;
}

const TEXT_SCALES: ThemeStyle["textScale"][] = [0.9, 1, 1.15];

// Changes apply live as controls move (matching how the rest of Phase 1
// mutates state directly, e.g. Trash) rather than v1's staged
// cancel/save flow — Reset/Close are the only two actions needed here.
export function StyleEditor({ themeStyle, onChange, onReset, onClose }: StyleEditorProps) {
  const t = useTranslation();

  return (
    <div className={styles.body}>
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
