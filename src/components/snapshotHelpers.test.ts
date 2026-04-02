import { describe, it, expect } from "vitest";
import {
  isTextSceneElement,
  getStableNodeId,
  textOf,
  inferSnapshotElementType,
  pickContentRoot,
  syncHiddenNodes,
  restoreHiddenNodes,
  INLINE_TAGS,
} from "./snapshotHelpers";
import type { SceneElement } from "../scene/types";

function makeElement(tag: string, attrs?: Record<string, string>): HTMLElement {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function mockComputedStyle(overrides: Partial<CSSStyleDeclaration> = {}): CSSStyleDeclaration {
  return {
    display: "block",
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderWidth: "0",
    boxShadow: "none",
    fontSize: "16px",
    fontWeight: "400",
    fontFamily: "serif",
    lineHeight: "24px",
    color: "rgb(0, 0, 0)",
    borderRadius: "0",
    paddingLeft: "0",
    border: "",
    float: "none",
    ...overrides,
  } as unknown as CSSStyleDeclaration;
}

// ── isTextSceneElement ──

describe("isTextSceneElement", () => {
  it("returns true for paragraph elements", () => {
    expect(isTextSceneElement({ type: "paragraph" } as SceneElement)).toBe(true);
  });

  it("returns true for heading elements", () => {
    expect(isTextSceneElement({ type: "heading" } as SceneElement)).toBe(true);
  });

  it("returns false for button elements", () => {
    expect(isTextSceneElement({ type: "button" } as SceneElement)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTextSceneElement(null)).toBe(false);
  });
});

// ── textOf ──

describe("textOf", () => {
  it("extracts and normalizes text content", () => {
    const el = document.createElement("p");
    el.textContent = "  Hello   world\n  ";
    expect(textOf(el)).toBe("Hello world");
  });

  it("returns empty string for empty elements", () => {
    const el = document.createElement("div");
    expect(textOf(el)).toBe("");
  });
});

// ── getStableNodeId ──

describe("getStableNodeId", () => {
  it("returns existing domino id if set", () => {
    const root = document.createElement("div");
    const child = document.createElement("p");
    child.dataset.dominoId = "my-id";
    root.appendChild(child);
    expect(getStableNodeId(root, child)).toBe("my-id");
  });

  it("returns id-based path when element has id", () => {
    const root = document.createElement("div");
    const child = document.createElement("p");
    child.id = "intro";
    root.appendChild(child);
    expect(getStableNodeId(root, child)).toBe("id:intro");
  });

  it("builds a structural path for elements without id", () => {
    const root = document.createElement("div");
    const section = document.createElement("section");
    const p = document.createElement("p");
    root.appendChild(section);
    section.appendChild(p);
    const result = getStableNodeId(root, p);
    expect(result).toMatch(/^path:/);
    expect(result).toContain("section");
    expect(result).toContain("p");
  });
});

// ── inferSnapshotElementType ──

describe("inferSnapshotElementType", () => {
  const defaultRect = new DOMRect(0, 0, 200, 100);

  it("returns heading for H1-H6 tags", () => {
    for (const tag of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      const el = makeElement(tag);
      expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("heading");
    }
  });

  it("returns paragraph for P tags", () => {
    const el = makeElement("P");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "Some text", defaultRect)).toBe("paragraph");
  });

  it("returns paragraph for BLOCKQUOTE tags", () => {
    const el = makeElement("BLOCKQUOTE");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("paragraph");
  });

  it("returns button for BUTTON tags", () => {
    const el = makeElement("BUTTON");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("button");
  });

  it("returns link for inline A tags", () => {
    const el = makeElement("A");
    expect(inferSnapshotElementType(el, mockComputedStyle({ display: "inline" }), "", defaultRect)).toBe("link");
  });

  it("returns button for block A tags", () => {
    const el = makeElement("A");
    expect(inferSnapshotElementType(el, mockComputedStyle({ display: "block" }), "", defaultRect)).toBe("button");
  });

  it("returns image for IMG tags", () => {
    const el = makeElement("IMG");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("image");
  });

  it("returns input for INPUT tags", () => {
    const el = makeElement("INPUT");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("input");
  });

  it("returns paragraph for generic div with long text and inline children", () => {
    const el = makeElement("DIV");
    const span = document.createElement("SPAN");
    span.textContent = "Some long paragraph text content here";
    el.appendChild(span);
    expect(
      inferSnapshotElementType(el, mockComputedStyle(), "Some long paragraph text content here", defaultRect)
    ).toBe("paragraph");
  });

  it("returns card for elements with background color", () => {
    const el = makeElement("DIV");
    expect(
      inferSnapshotElementType(el, mockComputedStyle({ backgroundColor: "rgb(255, 255, 255)" }), "", defaultRect)
    ).toBe("card");
  });

  it("returns badge for small elements with short text and background", () => {
    const el = makeElement("DIV");
    Object.defineProperty(el, "offsetWidth", { value: 80 });
    Object.defineProperty(el, "offsetHeight", { value: 24 });
    expect(
      inferSnapshotElementType(el, mockComputedStyle({ backgroundColor: "rgb(0, 123, 255)" }), "New", defaultRect)
    ).toBe("badge");
  });

  it("returns container as fallback", () => {
    const el = makeElement("DIV");
    expect(inferSnapshotElementType(el, mockComputedStyle(), "", defaultRect)).toBe("container");
  });
});

// ── pickContentRoot ──

describe("pickContentRoot", () => {
  it("picks <main> when present", () => {
    const doc = document.implementation.createHTMLDocument("test");
    const main = doc.createElement("main");
    doc.body.appendChild(main);
    expect(pickContentRoot(doc)).toBe(main);
  });

  it("picks <article> when present", () => {
    const doc = document.implementation.createHTMLDocument("test");
    const article = doc.createElement("article");
    doc.body.appendChild(article);
    expect(pickContentRoot(doc)).toBe(article);
  });

  it("falls back to body when no semantic elements exist", () => {
    const doc = document.implementation.createHTMLDocument("test");
    expect(pickContentRoot(doc)).toBe(doc.body);
  });

  it("prefers main > article over standalone article", () => {
    const doc = document.implementation.createHTMLDocument("test");
    const main = doc.createElement("main");
    const article = doc.createElement("article");
    main.appendChild(article);
    doc.body.appendChild(main);
    expect(pickContentRoot(doc)).toBe(article); // "main article" matches first
  });
});

// ── syncHiddenNodes / restoreHiddenNodes ──

describe("syncHiddenNodes", () => {
  it("hides desired nodes", () => {
    const map = new Map<HTMLElement, string>();
    const node = document.createElement("div");
    syncHiddenNodes(map, [node]);
    expect(node.style.visibility).toBe("hidden");
    expect(map.size).toBe(1);
  });

  it("restores nodes no longer desired", () => {
    const map = new Map<HTMLElement, string>();
    const node = document.createElement("div");
    node.style.visibility = "visible";
    syncHiddenNodes(map, [node]); // hide
    syncHiddenNodes(map, []);     // no longer desired
    expect(node.style.visibility).toBe("visible");
    expect(map.size).toBe(0);
  });

  it("preserves original visibility on restore", () => {
    const map = new Map<HTMLElement, string>();
    const node = document.createElement("div");
    node.style.visibility = "collapse";
    syncHiddenNodes(map, [node]);
    expect(node.style.visibility).toBe("hidden");
    syncHiddenNodes(map, []);
    expect(node.style.visibility).toBe("collapse");
  });
});

describe("restoreHiddenNodes", () => {
  it("restores all nodes and clears the map", () => {
    const map = new Map<HTMLElement, string>();
    const a = document.createElement("div");
    const b = document.createElement("span");
    syncHiddenNodes(map, [a, b]);
    expect(a.style.visibility).toBe("hidden");
    expect(b.style.visibility).toBe("hidden");
    restoreHiddenNodes(map);
    expect(map.size).toBe(0);
  });
});

// ── INLINE_TAGS ──

describe("INLINE_TAGS", () => {
  it("contains common inline elements", () => {
    for (const tag of ["SPAN", "EM", "STRONG", "A", "CODE"]) {
      expect(INLINE_TAGS.has(tag)).toBe(true);
    }
  });

  it("does not contain block elements", () => {
    for (const tag of ["DIV", "P", "SECTION", "H1"]) {
      expect(INLINE_TAGS.has(tag)).toBe(false);
    }
  });
});
