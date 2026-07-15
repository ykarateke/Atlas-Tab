import { describe, expect, it } from "vitest";
import { createTranslator, resolveLocale } from "./translator";

describe("createTranslator", () => {
  it("returns the English string for the en locale", () => {
    const t = createTranslator("en");
    expect(t("common.save")).toBe("Save");
  });

  it("returns the Turkish string for the tr locale", () => {
    const t = createTranslator("tr");
    expect(t("common.save")).toBe("Kaydet");
  });

  it("interpolates {var} placeholders", () => {
    const t = createTranslator("en");
    expect(t("board.dragAria", { name: "Reading list" })).toBe("Drag Reading list");
  });

  it("interpolates the same placeholder used more than once", () => {
    const t = createTranslator("en");
    expect(t("bookmark.showMoreOther", { count: 3 })).toBe("Show 3 more");
  });
});

describe("resolveLocale", () => {
  it("uses the explicit uiLanguage when it's en or tr", () => {
    expect(resolveLocale("en", "tr-TR")).toBe("en");
    expect(resolveLocale("tr", "en-US")).toBe("tr");
  });

  it("detects Turkish from the browser language when uiLanguage is auto", () => {
    expect(resolveLocale("auto", "tr-TR")).toBe("tr");
  });

  it("falls back to English for auto with a non-Turkish browser language", () => {
    expect(resolveLocale("auto", "de-DE")).toBe("en");
  });

  it("falls back to English for an unsupported explicit uiLanguage (ru)", () => {
    expect(resolveLocale("ru", "ru-RU")).toBe("en");
  });
});
