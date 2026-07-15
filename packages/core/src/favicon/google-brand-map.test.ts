import { describe, expect, it } from "vitest";
import { lookupGoogleBrandIcon, requiresPathSegmentDisambiguation } from "./google-brand-map";

describe("lookupGoogleBrandIcon", () => {
  it("returns an icon data url for a plain-hostname Google product", () => {
    const icon = lookupGoogleBrandIcon("mail.google.com", null);
    expect(icon).toMatch(/^data:image\/svg\+xml,/);
  });

  it("disambiguates docs.google.com by first path segment", () => {
    const docs = lookupGoogleBrandIcon("docs.google.com", "document");
    const sheets = lookupGoogleBrandIcon("docs.google.com", "spreadsheets");
    expect(docs).not.toBeNull();
    expect(sheets).not.toBeNull();
    expect(docs).not.toBe(sheets);
  });

  it("returns null for a docs.google.com path segment it doesn't recognize", () => {
    expect(lookupGoogleBrandIcon("docs.google.com", "forms")).toBeNull();
  });

  it("returns null for a non-Google hostname", () => {
    expect(lookupGoogleBrandIcon("example.com", null)).toBeNull();
  });
});

describe("requiresPathSegmentDisambiguation", () => {
  it("is true for docs.google.com", () => {
    expect(requiresPathSegmentDisambiguation("docs.google.com")).toBe(true);
  });

  it("is false for a single-product hostname like mail.google.com", () => {
    expect(requiresPathSegmentDisambiguation("mail.google.com")).toBe(false);
  });
});
