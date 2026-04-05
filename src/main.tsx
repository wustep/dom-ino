import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import { isPresetKey, type PresetKey } from "./scene/presets"

function getResetRedirectPath(pathname: string) {
	if (pathname === "/reset" || pathname === "/reset/") {
		return "/"
	}

	if (pathname.endsWith("/reset/")) {
		return pathname.slice(0, -"/reset/".length) || "/"
	}

	if (pathname.endsWith("/reset")) {
		return pathname.slice(0, -"/reset".length) || "/"
	}

	return null
}

function decodeQueryValue(raw: string) {
	try {
		return decodeURIComponent(raw.replace(/\+/g, "%20"))
	} catch {
		return raw
	}
}

function getBootstrapFetchUrl(search: string) {
	if (search.startsWith("?fetch=")) {
		const rawFetchUrl = search.slice("?fetch=".length).trim()
		return rawFetchUrl ? decodeQueryValue(rawFetchUrl) : null
	}

	const fetchUrl = new URLSearchParams(search).get("fetch")?.trim()
	return fetchUrl || null
}

function getBootstrapPreset(search: string): PresetKey | null {
	const raw = new URLSearchParams(search).get("preset")?.trim().toLowerCase()
	return raw && isPresetKey(raw) ? raw : null
}

const resetRedirectPath = getResetRedirectPath(window.location.pathname)
const bootstrapFetchUrl = getBootstrapFetchUrl(window.location.search)
const bootstrapPreset = getBootstrapPreset(window.location.search)

if (resetRedirectPath) {
	try {
		window.localStorage.clear()
	} catch {
		// Ignore storage access failures and still navigate home.
	}
}

if (resetRedirectPath || bootstrapFetchUrl) {
	const nextPathname = resetRedirectPath ?? window.location.pathname
	window.history.replaceState(null, "", `${nextPathname}${window.location.hash}`)
}

// Debug helpers for console
Object.assign(window, {
	domino: {
		resetHint() {
			localStorage.removeItem("domino-hint-seen")
			console.log("[DOMino] Hint reset — reload to see it again")
		},
		resetAll() {
			localStorage.clear()
			console.log("[DOMino] All state cleared — reloading...")
			location.reload()
		},
	},
})

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App initialFetchUrl={bootstrapFetchUrl} initialPreset={bootstrapPreset} />
	</StrictMode>,
)
