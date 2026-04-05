/**
 * Site-specific rules applied when fetching pages.
 * Each entry maps a URL pattern (matched against the hostname) to:
 * - `removeSelectors`: DOM elements to completely remove (ads, banners, overlays)
 * - `css`: additional CSS to inject for layout fixes
 */

export interface SnapshotPretextRule {
	/** Restrict Pretext text blocks to these tag names when provided. */
	pretextTags?: string[]
	/** Keep nodes inside these ancestors out of Pretext flow. */
	neverPretextWithin?: string
	/** Force matching nodes to stay eligible for Pretext flow. */
	forceSelectors?: string[]
}

export interface SnapshotSolidRule {
	/** Nodes matching these selectors stay native and act as walls. */
	solidSelectors?: string[]
}

export interface SnapshotAutoSelectRule {
	/** Keep matching imported nodes out of automatic throwable selection. */
	neverAutoSelectWithin?: string
	/** Force matching imported nodes into automatic throwable selection. */
	forceSelectors?: string[]
}

/** Per-site configuration for CSS overrides, element removal, and auto-selection rules. */
export interface SiteRule {
	/** Substring matched against the page URL's hostname */
	match: string
	/** CSS selectors for elements to remove from the DOM entirely */
	removeSelectors?: string[]
	/** CSS to inject into the page */
	css?: string
	/** CSS file paths to fetch and inline (for sites that load CSS via JS) */
	cssLinks?: string[]
	/** Snapshot-view behavior overrides for imported-page Pretext flow. */
	snapshotPretext?: SnapshotPretextRule
	/** Snapshot-view behavior overrides for native solid components. */
	snapshotSolid?: SnapshotSolidRule
	/** Snapshot-view behavior overrides for automatic throwable selection. */
	snapshotAutoSelect?: SnapshotAutoSelectRule
}

/** Site-specific rules for known websites (NYTimes, Wikipedia, Craigslist, etc.). */
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

      .vector-header-container {
        margin: 0 auto !important;
        max-width: 1120px !important;
      }

      .vector-page-toolbar {
        margin: 0 auto !important;
        width: 100% !important;
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
			forceSelectors: [
				"#mp-welcome",
				"#mp-welcome h1",
				"#mp-welcome .mw-heading1",
				"#mp-tfa",
				"#mp-itn > div",
				"#mp-itn > ul",
				"#mp-otd > div",
				"#mp-otd > p",
				".tfa-recent",
				".tfa-footer",
				".potd-recent",
				".potd-footer",
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
		snapshotAutoSelect: {
			forceSelectors: [
				".mw-logo",
				"#p-search",
				"#vector-main-menu-dropdown",
				"#p-associated-pages",
				"#p-views",
				"#vector-page-tools-dropdown",
				".itn-img",
				"#mp-otd-img",
				"#mp-tfa-img",
			],
			neverAutoSelectWithin: [
				"header",
				"nav",
				"[role='navigation']",
				"[role='banner']",
				".vector-header-container",
				".vector-sticky-header-container",
				".vector-page-titlebar",
				".vector-page-toolbar",
				".vector-search-box",
				".vector-user-links",
				".mw-article-toolbar-container",
				".page-actions",
				".mw-portlet",
				".vector-menu",
				".vector-pinnable-element",
				"#p-views",
				"#p-cactions",
			].join(", "),
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
		match: "notion.so",
		removeSelectors: ['[class*="globalNavigation_links"]'],
		css: `
      /* Hide the hero CTA fallback text that leaks through visibility:hidden */
      [class*="HeroCTA_nav"] { display: none !important; }
      /* Remove invisible cookie/overlay containers */
      [class*="CookieBanner_"], [class*="modal"] { display: none !important; }
    `,
	},
	{
		match: "nytimes.com",
		removeSelectors: [
			'[data-testid="StandardAd"]',
			'[data-testid="site-index"]',
			"#gateway-content",
			".ad",
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
]
