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
}

export const SITE_RULES: SiteRule[] = [
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
