import { describe, it, expect } from "vitest";
import { encodeSyncPayload, decodeSyncPayload } from "./chunking";

describe("encodeSyncPayload", () => {
  it("produces a single chunk for a small payload", () => {
    const payload = { hello: "world" };
    const result = encodeSyncPayload(payload, "test@example.com", 1000, 1);

    expect(result.meta.chunkCount).toBe(1);
    expect(result.meta.email).toBe("test@example.com");
    expect(result.meta.timestamp).toBe(1000);
    expect(result.meta.version).toBe(1);
    expect(Object.keys(result.chunks)).toHaveLength(1);
  });

  it("produces multiple chunks for a large payload", () => {
    // Create a payload large enough to exceed the per-item limit
    const largeString = "x".repeat(20000);
    const payload = { data: largeString };
    const result = encodeSyncPayload(payload, "test@example.com", 1000, 1);

    expect(result.meta.chunkCount).toBeGreaterThan(1);
    expect(Object.keys(result.chunks)).toHaveLength(result.meta.chunkCount);
  });

  it("round-trips correctly (encode → decode)", () => {
    const payload = {
      boards: [{ id: "b1", name: "Test", type: "bookmarks", pageId: "p1", col: 0, row: 0 }],
      bookmarks: [{ id: "bm1", boardId: "b1", url: "https://x.com", title: "X", order: 0 }],
      settings: { openInNewTab: true },
    };

    const encoded = encodeSyncPayload(payload, "user@example.com", 2000, 1);
    const chunks = Object.entries(encoded.chunks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
    const decoded = decodeSyncPayload(chunks, encoded.meta);

    expect(decoded).toEqual(payload);
  });

  it("handles unicode characters correctly", () => {
    const payload = { title: "Türkçe karakterler: üğışçöİ" };
    const encoded = encodeSyncPayload(payload, "test@example.com", 1000, 1);
    const chunks = Object.entries(encoded.chunks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
    const decoded = decodeSyncPayload(chunks, encoded.meta);

    expect(decoded).toEqual(payload);
  });
});
