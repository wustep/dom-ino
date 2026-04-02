import { describe, it, expect } from "vitest";
import { toAbsoluteUrl, toAbsoluteSrcset } from "./url";

const BASE = "https://example.com/page/article";

describe("toAbsoluteUrl", () => {
  it("returns empty string for empty input", () => {
    expect(toAbsoluteUrl("", BASE)).toBe("");
  });

  it("preserves fragment-only URLs", () => {
    expect(toAbsoluteUrl("#section", BASE)).toBe("#section");
  });

  it("preserves absolute URLs with scheme", () => {
    expect(toAbsoluteUrl("https://cdn.example.com/img.png", BASE)).toBe(
      "https://cdn.example.com/img.png"
    );
  });

  it("preserves data: URLs", () => {
    expect(toAbsoluteUrl("data:image/png;base64,abc", BASE)).toBe(
      "data:image/png;base64,abc"
    );
  });

  it("resolves relative paths against base URL", () => {
    expect(toAbsoluteUrl("../images/photo.jpg", BASE)).toBe(
      "https://example.com/images/photo.jpg"
    );
  });

  it("resolves root-relative paths", () => {
    expect(toAbsoluteUrl("/static/logo.svg", BASE)).toBe(
      "https://example.com/static/logo.svg"
    );
  });

  it("resolves same-directory paths", () => {
    expect(toAbsoluteUrl("thumb.png", BASE)).toBe(
      "https://example.com/page/thumb.png"
    );
  });

  it("trims whitespace", () => {
    expect(toAbsoluteUrl("  /img.png  ", BASE)).toBe(
      "https://example.com/img.png"
    );
  });

  it("handles mailto: scheme", () => {
    expect(toAbsoluteUrl("mailto:user@example.com", BASE)).toBe(
      "mailto:user@example.com"
    );
  });
});

describe("toAbsoluteSrcset", () => {
  it("returns empty/data srcsets unchanged", () => {
    expect(toAbsoluteSrcset("", BASE)).toBe("");
    expect(toAbsoluteSrcset("data:image/png;base64,abc 1x", BASE)).toBe(
      "data:image/png;base64,abc 1x"
    );
  });

  it("resolves relative URLs in srcset entries", () => {
    const result = toAbsoluteSrcset("/img-sm.jpg 320w, /img-lg.jpg 1024w", BASE);
    expect(result).toBe(
      "https://example.com/img-sm.jpg 320w, https://example.com/img-lg.jpg 1024w"
    );
  });

  it("handles srcset with density descriptors", () => {
    const result = toAbsoluteSrcset("photo.jpg 1x, photo@2x.jpg 2x", BASE);
    expect(result).toBe(
      "https://example.com/page/photo.jpg 1x, https://example.com/page/photo@2x.jpg 2x"
    );
  });

  it("preserves absolute URLs in srcset", () => {
    const result = toAbsoluteSrcset("https://cdn.com/a.jpg 1x, https://cdn.com/b.jpg 2x", BASE);
    expect(result).toBe("https://cdn.com/a.jpg 1x, https://cdn.com/b.jpg 2x");
  });

  it("handles srcset with no descriptor", () => {
    const result = toAbsoluteSrcset("/simple.jpg", BASE);
    expect(result).toBe("https://example.com/simple.jpg");
  });
});
