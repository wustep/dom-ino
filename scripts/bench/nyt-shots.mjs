#!/usr/bin/env node
/**
 * Captures website-mode screenshots of the NYTimes preset through the real
 * proxy (live fetch → Wayback fallback), at 1440×900:
 *   <out>/nyt-after.png          the page as rendered in website mode
 *   <out>/nyt-after-physics.png  mid-flight after throwing the picked elements
 *
 *   npm run dev -- --port 5291 --strictPort &
 *   PLAYWRIGHT_MODULE=/abs/path/node_modules/playwright/index.mjs \
 *     node scripts/bench/nyt-shots.mjs http://localhost:5291 /tmp/domino-shots
 */
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const [base = "http://localhost:5173", outDir = "/tmp/domino-shots"] = process.argv.slice(2)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
	if (sessionStorage.getItem("__domino_shots")) return
	sessionStorage.setItem("__domino_shots", "1")
	localStorage.clear()
	localStorage.setItem("domino-welcome-seen", "1")
	localStorage.setItem("domino-hint-seen", "1")
	localStorage.setItem("domino-settings", JSON.stringify({ maxAutoSelectComponents: 40 }))
})

await page.goto(`${base}/?fetch=${encodeURIComponent("https://www.nytimes.com")}`)
await page.waitForFunction(
	() => document.querySelector("iframe")?.contentDocument?.querySelector("[data-domino-id]"),
	null,
	{ timeout: 90_000 },
)
await page.waitForTimeout(4000)
const info = await page.evaluate(() => ({
	title: document.querySelector("iframe")?.contentDocument?.title,
	archiveNote: document.querySelector("[data-domino-archive-note]")?.textContent ?? null,
	clones: document.querySelectorAll("[data-domino-physics-clone]").length,
}))
console.log(JSON.stringify(info))
await page.screenshot({ path: join(outDir, "nyt-after.png") })

// Throw the auto-picked elements (zero gravity) so the text reflows around them.
await page.keyboard.press("e")
await page.waitForTimeout(900)
await page.screenshot({ path: join(outDir, "nyt-after-physics.png") })
await browser.close()
