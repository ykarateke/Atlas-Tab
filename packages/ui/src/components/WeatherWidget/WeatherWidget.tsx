import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { GeocodeResult, WeatherConfig } from "@atlas-tab/core";
import { useTranslation } from "../../i18n/I18nContext";
import { CloudIcon } from "../../icons/Icons";
import styles from "./WeatherWidget.module.css";

const SEARCH_DEBOUNCE_MS = 350;

export interface WeatherWidgetProps {
  config: WeatherConfig;
  onConfigChange: (updates: Partial<WeatherConfig>) => void;
  onSearchCity: (query: string) => Promise<GeocodeResult[]>;
  onRefresh: () => Promise<void>;
}

// Three independent concerns per FEATURE_SPECS.md § Widgets / Weather:
// city search with debounced autocomplete + arrow-key navigation, a compact
// topbar pill, and a popup with current conditions + manual refresh.
export function WeatherWidget({ config, onConfigChange, onSearchCity, onRefresh }: WeatherWidgetProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasCity = config.lat !== null && config.lon !== null;
  const windUnit = config.units === "imperial" ? "mph" : "km/h";

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void onSearchCity(value).then(setResults);
    }, SEARCH_DEBOUNCE_MS);
  }

  function selectCity(result: GeocodeResult) {
    onConfigChange({
      enabled: true,
      city: result.name,
      lat: result.latitude,
      lon: result.longitude,
      cache: null,
    });
    setQuery("");
    setResults([]);
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      selectCity(results[activeIndex]);
    }
  }

  function handleRefreshClick() {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.pill}
        aria-label={hasCity ? config.city : t("weather.setCity")}
        onClick={() => setOpen((o) => !o)}
      >
        <CloudIcon width={14} height={14} />
        {hasCity && config.cache && <span>{Math.round(config.cache.temp)}°</span>}
      </button>

      {open && (
        <div className={styles.popup}>
          <input
            autoFocus
            className={styles.input}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("weather.cityPlaceholder")}
          />

          {query.trim() && (
            <ul className={styles.suggestions}>
              {results.length === 0 && <li className={styles.empty}>{t("weather.noResults")}</li>}
              {results.map((r, i) => (
                <li key={`${r.latitude},${r.longitude}`}>
                  <button
                    type="button"
                    className={i === activeIndex ? styles.active : ""}
                    onClick={() => selectCity(r)}
                  >
                    {[r.name, r.admin1, r.country].filter(Boolean).join(", ")}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasCity && config.cache && (
            <div className={styles.details}>
              <div className={styles.cityName}>{config.city}</div>
              <div className={styles.temp}>{Math.round(config.cache.temp)}°</div>
              <div className={styles.meta}>{t("weather.feelsLike", { temp: Math.round(config.cache.feelsLike) })}</div>
              <div className={styles.meta}>
                {t("weather.wind", { speed: `${Math.round(config.cache.windSpeed)} ${windUnit}` })}
              </div>
              <button type="button" onClick={handleRefreshClick} disabled={refreshing}>
                {t("weather.refresh")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
