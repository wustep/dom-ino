/**
 * Utility helpers that query site rules to provide
 * CSS, selectors, and Pretext/solid eligibility checks.
 */

import type { SceneElement } from "./types"
import type {
	SnapshotAutoSelectRule,
	SnapshotPretextRule,
	SiteRule,
} from "./siteRules"
import { SITE_RULES } from "./siteRules"

function getMatchingSiteRules(url?: string): SiteRule[] {
	if (!url) return []

	let hostname: string
	try {
		hostname = new URL(url).hostname
	} catch {
		return []
	}

	return SITE_RULES.filter((r) => hostname.includes(r.match))
}

function isTextSceneElement(
	sceneElement: SceneElement | null
): sceneElement is SceneElement & { type: "paragraph" | "heading" } {
	return sceneElement?.type === "paragraph" || sceneElement?.type === "heading"
}

function getSnapshotPretextRule(url?: string): {
	pretextTags: Set<string> | null
	neverPretextWithin: string
	forceSelectors: string
} | null {
	const rules = getMatchingSiteRules(url)
		.map((rule) => rule.snapshotPretext)
		.filter((rule): rule is SnapshotPretextRule => Boolean(rule))

	if (rules.length === 0) return null

	const pretextTags = rules.some((rule) => rule.pretextTags?.length)
		? new Set(rules.flatMap((rule) => rule.pretextTags ?? []))
		: null

	return {
		pretextTags,
		forceSelectors: rules
			.flatMap((rule) => rule.forceSelectors ?? [])
			.join(", "),
		neverPretextWithin: rules
			.map((rule) => rule.neverPretextWithin)
			.filter((selector): selector is string => Boolean(selector))
			.join(", "),
	}
}

function getSnapshotSolidSelectors(url?: string): string {
	return getMatchingSiteRules(url)
		.map((rule) => rule.snapshotSolid?.solidSelectors ?? [])
		.flat()
		.join(", ")
}

function getSnapshotAutoSelectRule(url?: string): {
	neverAutoSelectWithin: string
	forceSelectors: string
} | null {
	const rules = getMatchingSiteRules(url)
		.map((rule) => rule.snapshotAutoSelect)
		.filter((rule): rule is SnapshotAutoSelectRule => Boolean(rule))

	if (rules.length === 0) return null

	return {
		forceSelectors: rules
			.flatMap((rule) => rule.forceSelectors ?? [])
			.join(", "),
		neverAutoSelectWithin: rules
			.map((rule) => rule.neverAutoSelectWithin)
			.filter((selector): selector is string => Boolean(selector))
			.join(", "),
	}
}

/**
 * Returns selectors for elements to remove from the DOM for the given URL.
 */
export function getSiteRemoveSelectors(url: string): string[] {
	return getMatchingSiteRules(url).flatMap((r) => r.removeSelectors ?? [])
}

/**
 * Returns CSS file paths to fetch and inline for the given URL.
 * These are for sites that load CSS via JavaScript (e.g., craigslist).
 */
export function getSiteCssLinks(url: string): string[] {
	return getMatchingSiteRules(url).flatMap((r) => r.cssLinks ?? [])
}

/**
 * Returns combined CSS for all matching site rules, or empty string if none match.
 */
export function getSiteCSS(url: string): string {
	const matches = getMatchingSiteRules(url).filter((r) => r.css)
	if (matches.length === 0) return ""
	return matches.map((r) => r.css).join("\n")
}

export function isPretextBlockEligible(
	node: HTMLElement,
	sceneElement: SceneElement | null,
	sourceUrl?: string
): boolean {
	if (!isTextSceneElement(sceneElement)) return false

	const rule = getSnapshotPretextRule(sourceUrl)
	if (!rule) return true

	if (rule.forceSelectors && node.matches(rule.forceSelectors)) {
		return true
	}

	if (rule.pretextTags && !rule.pretextTags.has(node.tagName)) {
		return false
	}

	if (rule.neverPretextWithin && node.closest(rule.neverPretextWithin)) {
		return false
	}

	return true
}

export function isForcePretextNode(
	node: HTMLElement,
	sourceUrl?: string
): boolean {
	const rule = getSnapshotPretextRule(sourceUrl)
	if (!rule?.forceSelectors) return false
	return node.matches(rule.forceSelectors)
}

export function isSolidBlock(node: HTMLElement, sourceUrl?: string): boolean {
	const solidSelectors = getSnapshotSolidSelectors(sourceUrl)
	if (!solidSelectors) return false
	return node.matches(solidSelectors)
}

export function isAutoSelectEligible(
	node: HTMLElement,
	sourceUrl?: string
): boolean {
	const rule = getSnapshotAutoSelectRule(sourceUrl)
	if (!rule) return true
	if (
		rule.forceSelectors &&
		(node.matches(rule.forceSelectors) || node.closest(rule.forceSelectors))
	) {
		return true
	}
	if (rule.neverAutoSelectWithin && node.closest(rule.neverAutoSelectWithin)) {
		return false
	}
	return true
}

export function isForceAutoSelectNode(
	node: HTMLElement,
	sourceUrl?: string
): boolean {
	const rule = getSnapshotAutoSelectRule(sourceUrl)
	if (!rule?.forceSelectors) return false
	return Boolean(
		node.matches(rule.forceSelectors) || node.closest(rule.forceSelectors)
	)
}

export function getForceAutoSelectSelectors(url?: string): string[] {
	const rule = getSnapshotAutoSelectRule(url)
	if (!rule?.forceSelectors) return []
	return rule.forceSelectors
		.split(",")
		.map((selector) => selector.trim())
		.filter(Boolean)
}
