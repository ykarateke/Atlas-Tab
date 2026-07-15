import type { BoardType, TranslationKey } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import {
  BoardIcon,
  CalendarIcon,
  CloudIcon,
  ClockIcon,
  EditIcon,
  SearchIcon,
  TimerIcon,
} from "../../icons/Icons";
import styles from "./WidgetGallery.module.css";

export interface WidgetGalleryProps {
  clockEnabled: boolean;
  weatherEnabled: boolean;
  navSearchEnabled: boolean;
  onToggleClock: (enabled: boolean) => void;
  onToggleWeather: (enabled: boolean) => void;
  onToggleNavSearch: (enabled: boolean) => void;
  onAddBoard: (type: BoardType) => void;
}

const BOARD_TYPES: Array<{ type: BoardType; labelKey: TranslationKey; icon: typeof BoardIcon }> = [
  { type: "bookmarks", labelKey: "board.type.bookmarks", icon: BoardIcon },
  { type: "notes", labelKey: "board.type.notes", icon: EditIcon },
  { type: "calendar", labelKey: "board.type.calendar", icon: CalendarIcon },
  { type: "pomodoro", labelKey: "board.type.pomodoro", icon: TimerIcon },
  { type: "search", labelKey: "board.type.search", icon: SearchIcon },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

// A dedicated, discoverable surface for adding widgets — the grid's own "+"
// cell (packages/ui/components/BoardGrid) supports the same board types but
// is easy to miss; this mirrors v1's sidebar widget gallery
// (FEATURE_SPECS.md § Widgets).
export function WidgetGallery({
  clockEnabled,
  weatherEnabled,
  navSearchEnabled,
  onToggleClock,
  onToggleWeather,
  onToggleNavSearch,
  onAddBoard,
}: WidgetGalleryProps) {
  const t = useTranslation();

  return (
    <div className={styles.grid}>
      {BOARD_TYPES.map(({ type, labelKey, icon: Icon }) => (
        <div key={type} className={styles.card}>
          <div className={styles.icon}>
            <Icon width={20} height={20} />
          </div>
          <span className={styles.name}>{t(labelKey)}</span>
          <button type="button" className={styles.addBtn} onClick={() => onAddBoard(type)}>
            {t("widget.add")}
          </button>
        </div>
      ))}

      <div className={styles.card}>
        <div className={styles.icon}>
          <ClockIcon width={20} height={20} />
        </div>
        <span className={styles.name}>{t("widget.clock")}</span>
        <Toggle checked={clockEnabled} onChange={onToggleClock} />
      </div>

      <div className={styles.card}>
        <div className={styles.icon}>
          <CloudIcon width={20} height={20} />
        </div>
        <span className={styles.name}>{t("widget.weather")}</span>
        <Toggle checked={weatherEnabled} onChange={onToggleWeather} />
      </div>

      <div className={styles.card}>
        <div className={styles.icon}>
          <SearchIcon width={20} height={20} />
        </div>
        <span className={styles.name}>{t("widget.navSearch")}</span>
        <Toggle checked={navSearchEnabled} onChange={onToggleNavSearch} />
      </div>
    </div>
  );
}
