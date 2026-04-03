import { describe, expect, it } from "vitest";
import type { SceneElement } from "./types";
import {
  getSiteCSS,
  getSiteRemoveSelectors,
  isAutoSelectEligible,
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

  it("forces the Wikipedia welcome heading into imported text flow", () => {
    const wrapper = document.createElement("div");
    wrapper.id = "mp-welcome";
    const heading = document.createElement("h1");
    heading.textContent = "Welcome to Wikipedia";
    wrapper.appendChild(heading);

    expect(
      isPretextBlockEligible(
        heading,
        makeTextElement("heading"),
        "https://en.wikipedia.org/wiki/Main_Page"
      )
    ).toBe(true);
  });

  it("forces the Wikipedia featured article summary container into imported text flow", () => {
    const node = document.createElement("div");
    node.id = "mp-tfa";
    node.textContent = "Three Studies for Figures at the Base of a Crucifixion is a 1944 triptych...";

    expect(
      isPretextBlockEligible(
        node,
        makeTextElement(),
        "https://en.wikipedia.org/wiki/Main_Page"
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

  it("keeps Wikipedia page chrome out of automatic throwable selection", () => {
    const header = document.createElement("header");
    header.className = "vector-header-container";
    const link = document.createElement("a");
    link.textContent = "View history";
    header.appendChild(link);

    expect(
      isAutoSelectEligible(
        link,
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(false);
  });

  it("still auto-selects normal Wikipedia article media", () => {
    const figure = document.createElement("figure");
    figure.className = "thumb";
    const image = document.createElement("img");
    figure.appendChild(image);

    expect(
      isAutoSelectEligible(
        image,
        "https://en.wikipedia.org/wiki/History_of_art"
      )
    ).toBe(true);
  });

  it("force-selects the Wikipedia logo and search box", () => {
    const header = document.createElement("header");
    header.className = "vector-header-container";

    const logo = document.createElement("a");
    logo.className = "mw-logo";
    header.appendChild(logo);

    const search = document.createElement("div");
    search.id = "p-search";
    header.appendChild(search);

    expect(
      isAutoSelectEligible(logo, "https://en.wikipedia.org/wiki/Main_Page")
    ).toBe(true);
    expect(
      isAutoSelectEligible(search, "https://en.wikipedia.org/wiki/Main_Page")
    ).toBe(true);
  });

  it("force-selects descendants inside the Wikipedia search and page tool areas", () => {
    const search = document.createElement("div");
    search.id = "p-search";
    const input = document.createElement("input");
    search.appendChild(input);

    const tools = document.createElement("div");
    tools.id = "vector-page-tools-dropdown";
    const link = document.createElement("a");
    link.textContent = "Tools";
    tools.appendChild(link);

    expect(
      isAutoSelectEligible(input, "https://en.wikipedia.org/wiki/Main_Page")
    ).toBe(true);
    expect(
      isAutoSelectEligible(link, "https://en.wikipedia.org/wiki/Main_Page")
    ).toBe(true);
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
