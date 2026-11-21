/**
 * Detection of bot-challenge / interstitial pages (DataDome, Cloudflare,
 * PerimeterX, Imperva, Akamai, AWS WAF). Shared by the fetch proxy
 * (`api/_lib/fetchProxy.ts`) and the client (`scene/snapshot/fetchPage.ts`) so
 * neither ever renders a challenge page as if it were the requested site.
 *
 * Pure string matching — no DOM or Node APIs — so it runs in both runtimes.
 */

/**
 * Real pages can legitimately reference a bot-protection vendor (e.g. a
 * DataDome tag script on a 300 KB homepage). Body-level markers only count
 * on small documents; challenge interstitials are a few KB at most.
 */
export const CHALLENGE_MAX_BYTES = 64 * 1024

/** Markers that are conclusive anywhere in the document (interstitial titles). */
const TITLE_MARKERS: Array<[name: string, pattern: RegExp]> = [
	["cloudflare", /<title>\s*Just a moment\.\.\.\s*<\/title>/i],
	["cloudflare", /<title>\s*Attention Required!\s*\|\s*Cloudflare\s*<\/title>/i],
	["perimeterx", /<title>\s*Access to this page has been denied\.?\s*<\/title>/i],
]

/** Markers that only count on small documents. */
const BODY_MARKERS: Array<[name: string, pattern: RegExp]> = [
	["datadome", /captcha-delivery\.com/i],
	["datadome", /Please enable JS and disable any ad blocker/i],
	["cloudflare", /challenge-platform|cf_chl_opt|__cf_chl_|cf-browser-verification/i],
	["cloudflare", /Enable JavaScript and cookies to continue/i],
	["perimeterx", /px-captcha|_pxCaptcha/i],
	["imperva", /_Incapsula_Resource|Incapsula incident ID/i],
	["akamai", /errors\.edgesuite\.net|Reference&#32;&#35;\d/i],
	["aws-waf", /captcha\.awswaf\.com|awsWafCookieDomainList/i],
	["generic", /<title>\s*(?:Access Denied|Bot Verification|Are you a robot\??)\s*<\/title>/i],
]

/**
 * Returns the vendor name of a recognised bot challenge / block page, or null
 * if the HTML looks like real content.
 */
export function detectBotChallenge(html: string): string | null {
	if (!html) return null
	for (const [name, pattern] of TITLE_MARKERS) {
		if (pattern.test(html)) return name
	}
	if (html.length > CHALLENGE_MAX_BYTES) return null
	for (const [name, pattern] of BODY_MARKERS) {
		if (pattern.test(html)) return name
	}
	return null
}

/** Message shown to users when a site refuses automated fetches. */
export const BLOCKED_SITE_MESSAGE =
	"This site blocks automated fetching, and no archived copy is available. Try another URL, or paste the page's HTML instead."
