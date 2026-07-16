import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";

export type Locale = "en" | "ru" | "tr";
export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, ru, tr };

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translate {
  const dict = dictionaries[locale];

  return function t(key, vars) {
    const template = dict[key] ?? en[key] ?? key;
    if (!vars) return template;

    return Object.entries(vars).reduce(
      (result, [varKey, value]) => result.replaceAll(`{${varKey}}`, String(value)),
      template,
    );
  };
}

// "auto" and any not-yet-supported locale (currently just "ru") resolve via
// browser-language detection, then fall back to English silently — same
// graceful-degradation policy as missing individual keys
// (FEATURE_SPECS.md § i18n / Localization).
export function resolveLocale(
  uiLanguage: "auto" | "en" | "ru" | "tr",
  browserLanguage: string,
): Locale {
  if (uiLanguage === "en" || uiLanguage === "ru" || uiLanguage === "tr") return uiLanguage;
  const lang = browserLanguage.toLowerCase();
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("ru")) return "ru";
  return "en";
}
