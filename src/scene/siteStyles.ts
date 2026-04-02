/**
 * Site-specific rules applied when fetching pages.
 * Each entry maps a URL pattern (matched against the hostname) to:
 * - `removeSelectors`: DOM elements to completely remove (ads, banners, overlays)
 * - `css`: additional CSS to inject for layout fixes
 */

interface SiteRule {
  /** Substring matched against the page URL's hostname */
  match: string;
  /** CSS selectors for elements to remove from the DOM entirely */
  removeSelectors?: string[];
  /** CSS to inject into the page */
  css?: string;
  /** CSS file paths to fetch and inline (for sites that load CSS via JS) */
  cssLinks?: string[];
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

/**
 * Returns selectors for elements to remove from the DOM for the given URL.
 */
export function getSiteRemoveSelectors(url: string): string[] {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }
  return SITE_RULES
    .filter((r) => hostname.includes(r.match))
    .flatMap((r) => r.removeSelectors ?? []);
}

/**
 * Returns CSS file paths to fetch and inline for the given URL.
 * These are for sites that load CSS via JavaScript (e.g., craigslist).
 */
export function getSiteCssLinks(url: string): string[] {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }
  return SITE_RULES
    .filter((r) => hostname.includes(r.match))
    .flatMap((r) => r.cssLinks ?? []);
}

/**
 * Returns combined CSS for all matching site rules, or empty string if none match.
 */
export function getSiteCSS(url: string): string {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "";
  }
  const matches = SITE_RULES.filter((r) => hostname.includes(r.match) && r.css);
  if (matches.length === 0) return "";
  return matches.map((r) => r.css).join("\n");
}
