import { createContext, useContext, useMemo } from "react";
import { createTranslator, type Locale, type Translate } from "@atlas-tab/core";

const defaultTranslate = createTranslator("en");
const I18nContext = createContext<Translate>(defaultTranslate);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useTranslation(): Translate {
  return useContext(I18nContext);
}
