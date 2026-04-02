import { describe, expect, it } from "vitest";
import type { SceneElement } from "./types";
import {
  getSiteCSS,
  getSiteRemoveSelectors,
  isPretextBlockEligible,
} from "./siteStyles";

function makeTextElement(type: SceneElement["type"] = "paragraph"): SceneElement {
  return {
    id: "text-1",
    type,
    rect: { x: 0, y: 0, width: 300, height: 40 },
    throwable: false,
    pinned: true,
    text: "Example text",
  };
}

describe("siteStyles", () => {
  it("adds Wikipedia cleanup rules for article imports", () => {
    const selectors = getSiteRemoveSelectors("https://en.wikipedia.org/wiki/Typography");
    expect(selectors).toEqual(expect.arrayContaining([
      ".vector-column-start",
      ".navbox",
      "#catlinks",
      ".mw-footer-container",
      ".vector-sticky-header-container",
    ]));

    const css = getSiteCSS("https://en.wikipedia.org/wiki/Typography");
    expect(css).toContain("#toc");
    expect(css).toContain(".shortdescription");
    expect(css).toContain(".portal");
    expect(css).toContain(".mw-content-container");
    expect(css).toContain(".mw-body-header");
  });

  it("keeps normal Wikipedia paragraphs eligible for imported text flow", () => {
    const node = document.createElement("p");
    node.textContent = "The history of art focuses on objects made by humans.";

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(true);
  });

  it("excludes Wikipedia hatnotes from imported text flow", () => {
    const node = document.createElement("div");
    node.className = "hatnote";
    node.textContent = "For the academic discipline, see Art history.";

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(false);
  });

  it("excludes Wikipedia infobox text from imported text flow", () => {
    const table = document.createElement("table");
    table.className = "infobox";
    const cell = document.createElement("td");
    const node = document.createElement("p");
    node.textContent = "Periods and movements";
    cell.appendChild(node);
    table.appendChild(cell);

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(false);
  });

  it("keeps Wikipedia article warning-box text out of imported text flow", () => {
    const box = document.createElement("table");
    box.className = "ambox";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const node = document.createElement("div");
    node.textContent = "This article may be too long to read and navigate comfortably.";
    cell.appendChild(node);
    row.appendChild(cell);
    box.appendChild(row);

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(false);
  });

  it("preserves generic non-Wikipedia text blocks", () => {
    const node = document.createElement("div");
    node.textContent = "A generic imported site may use divs for article copy.";

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://example.com/article"
      )
    ).toBe(true);
  });
});
