/**
 * Site-specific rules applied when fetching pages.
 * Each entry maps a URL pattern (matched against the hostname) to:
 * - `removeSelectors`: DOM elements to completely remove (ads, banners, overlays)
 * - `css`: additional CSS to inject for layout fixes
 */

import type { SceneElement } from "./types";

interface SnapshotPretextRule {
  /** Restrict Pretext text blocks to these tag names when provided. */
  pretextTags?: string[];
  /** Keep nodes inside these ancestors out of Pretext flow. */
  neverPretextWithin?: string;
}

interface SnapshotSolidRule {
  /** Nodes matching these selectors stay native and act as walls. */
  solidSelectors?: string[];
}

interface SiteRule {
  /** Substring matched against the page URL's hostname */
  match: string;
  /** CSS selectors for elements to remove from the DOM entirely */
  removeSelectors?: string[];
  /** CSS to inject into the page */
  css?: string;
  /** CSS file paths to fetch and inline (for sites that load CSS via JS) */
  cssLinks?: string[];
  /** Snapshot-view behavior overrides for imported-page Pretext flow. */
  snapshotPretext?: SnapshotPretextRule;
  /** Snapshot-view behavior overrides for native solid components. */
  snapshotSolid?: SnapshotSolidRule;
}

export const SITE_RULES: SiteRule[] = [
  {
    match: "wikipedia.org",
    removeSelectors: [
      ".vector-column-start",
      ".vector-column-end",
      ".vector-sticky-pinned-container",
      ".vector-sitenotice-container",
      ".navbox",
      ".vertical-navbox",
      "#catlinks",
      ".mw-footer-container",
      ".vector-sticky-header-container",
      ".mw-editsection",
      ".mw-jump-link",
      ".mw-portlet-dock-bottom",
      ".authority-control",
    ],
    css: `
      /* Keep imported Wikipedia pages focused on article content. */
      #toc,
      .toc,
      .vector-toc,
      .shortdescription,
      .mw-indicators,
      .sistersitebox,
      .portal,
      #siteNotice,
      #vector-page-titlebar-toc,
      #p-lang-btn,
      .mw-aria-live-region {
        display: none !important;
      }

      .mw-page-container {
        padding-top: 0 !important;
      }

      .mw-page-container-inner {
        display: block !important;
      }

      .mw-content-container {
        margin: 0 auto !important;
        max-width: 980px !important;
        padding: 0 24px 40px !important;
      }

      .vector-header-container,
      .vector-page-toolbar {
        margin: 0 auto !important;
        max-width: 1120px !important;
      }

      .mw-body,
      .vector-body {
        margin: 0 !important;
      }

      .mw-body-header {
        padding-top: 24px !important;
      }
    `,
    snapshotPretext: {
      pretextTags: [
        "DIV",
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "BLOCKQUOTE",
        "LI",
        "DD",
        "DT",
        "TD",
        "TH",
      ],
      neverPretextWithin: [
        "table",
        "figure",
        "figcaption",
        "aside",
        "nav",
        "header",
        "footer",
        "form",
        "button",
        "[role='navigation']",
        "[role='banner']",
        "[role='complementary']",
        ".ambox",
        ".dablink",
        ".gallery",
        ".gallerybox",
        ".hatnote",
        ".infobox",
        ".metadata",
        ".navbox",
        ".portal",
        ".reference",
        ".references",
        ".reflist",
        ".rellink",
        ".sidebar",
        ".shortdescription",
        ".thumb",
        ".thumbcaption",
        ".thumbinner",
        ".ombox",
        ".tmbox",
        ".trow",
        ".vector-column-end",
        ".vector-column-start",
        ".vector-header-container",
        ".vector-page-toolbar",
        ".vector-page-titlebar",
        ".vector-sticky-header-container",
        ".vector-toc",
        ".mw-table-of-contents-container",
        ".mw-footer-container",
        "#mw-navigation",
        "#mw-panel",
        "#p-lang-btn",
        "#vector-page-titlebar-toc",
      ].join(", "),
    },
    snapshotSolid: {
      solidSelectors: [".ambox", ".tmbox", ".ombox", ".infobox", "table.sidebar"],
    },
  },
  {
    match: "craigslist.org",
    cssLinks: ["/styles/cl.css", "/styles/homepage.css"],
    removeSelectors: ["#no-js", "#curtain"],
    css: `
      .no-js header, .no-js form, .no-js .tsb { display: block !important; }
    `,
  },
  {
    match: "nytimes.com",
    removeSelectors: [
      '[data-testid="StandardAd"]',
      '[data-testid="site-index"]',
      '#gateway-content',
      '.ad',
      '[class*="expanded-dock"]',
    ],
    css: `
      /* Collapse ad wrapper parent containers (they retain fixed height even when ad is hidden) */
      div:has(> div > [data-testid="StandardAd"]) { display: none !important; }
      /* Collapse empty JS-dependent nav containers and spacer divs in the masthead */
      [data-testid="floating-desktop-nested-nav"],
      [data-testid="masthead-nested-nav"],
      [data-testid="desktop-nested-nav"],
      [data-testid="masthead-container"] header > div:empty { display: none !important; }
      /* Remove empty source elements (JS fills srcset at runtime) */
      source:not([srcset]) { display: none !important; }
    `,
  },
];

function getMatchingSiteRules(url?: string): SiteRule[] {
  if (!url) return [];

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }

  return SITE_RULES.filter((r) => hostname.includes(r.match));
}

function isTextSceneElement(
  sceneElement: SceneElement | null
): sceneElement is SceneElement & { type: "paragraph" | "heading" } {
  return (
    sceneElement?.type === "paragraph" || sceneElement?.type === "heading"
  );
}

function getSnapshotPretextRule(url?: string): {
  pretextTags: Set<string> | null;
  neverPretextWithin: string;
} | null {
  const rules = getMatchingSiteRules(url)
    .map((rule) => rule.snapshotPretext)
    .filter((rule): rule is SnapshotPretextRule => Boolean(rule));

  if (rules.length === 0) return null;

  const pretextTags = rules.some((rule) => rule.pretextTags?.length)
    ? new Set(rules.flatMap((rule) => rule.pretextTags ?? []))
    : null;

  return {
    pretextTags,
    neverPretextWithin: rules
      .map((rule) => rule.neverPretextWithin)
      .filter((selector): selector is string => Boolean(selector))
      .join(", "),
  };
}

function getSnapshotSolidSelectors(url?: string): string {
  return getMatchingSiteRules(url)
    .map((rule) => rule.snapshotSolid?.solidSelectors ?? [])
    .flat()
    .join(", ");
}

/**
 * Returns selectors for elements to remove from the DOM for the given URL.
 */
export function getSiteRemoveSelectors(url: string): string[] {
  return getMatchingSiteRules(url)
    .flatMap((r) => r.removeSelectors ?? []);
}

/**
 * Returns CSS file paths to fetch and inline for the given URL.
 * These are for sites that load CSS via JavaScript (e.g., craigslist).
 */
export function getSiteCssLinks(url: string): string[] {
  return getMatchingSiteRules(url)
    .flatMap((r) => r.cssLinks ?? []);
}

/**
 * Returns combined CSS for all matching site rules, or empty string if none match.
 */
export function getSiteCSS(url: string): string {
  const matches = getMatchingSiteRules(url).filter((r) => r.css);
  if (matches.length === 0) return "";
  return matches.map((r) => r.css).join("\n");
}

export function isPretextBlockEligible(
  node: HTMLElement,
  sceneElement: SceneElement | null,
  sourceUrl?: string
): boolean {
  if (!isTextSceneElement(sceneElement)) return false;

  const rule = getSnapshotPretextRule(sourceUrl);
  if (!rule) return true;

  if (rule.pretextTags && !rule.pretextTags.has(node.tagName)) {
    return false;
  }

  if (rule.neverPretextWithin && node.closest(rule.neverPretextWithin)) {
    return false;
  }

  return true;
}

export function isSolidBlock(node: HTMLElement, sourceUrl?: string): boolean {
  const solidSelectors = getSnapshotSolidSelectors(sourceUrl);
  if (!solidSelectors) return false;
  return node.matches(solidSelectors);
}
