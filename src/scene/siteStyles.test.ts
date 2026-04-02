import { describe, expect, it } from "vitest";
import { getSiteCSS, getSiteRemoveSelectors } from "./siteStyles";

describe("siteStyles", () => {
  it("adds Wikipedia cleanup rules for article imports", () => {
    const selectors = getSiteRemoveSelectors("https://en.wikipedia.org/wiki/Typography");
    expect(selectors).toEqual(expect.arrayContaining([
      ".navbox",
      "#catlinks",
      ".mw-footer-container",
      ".vector-sticky-header-container",
    ]));

    const css = getSiteCSS("https://en.wikipedia.org/wiki/Typography");
    expect(css).toContain("#toc");
    expect(css).toContain(".shortdescription");
    expect(css).toContain(".portal");
  });
});
