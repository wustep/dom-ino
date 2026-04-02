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

export const SITE_RULES: SiteRule[] = [];

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
