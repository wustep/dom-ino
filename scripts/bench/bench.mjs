#!/usr/bin/env node
/**
 * Website-mode performance benchmark for DOMino.
 *
 * Loads a fixture page into website mode (SnapshotPageView) through the real
 * client pipeline (`?fetch=` → prepareHtml → iframe → scanner → auto-select →
 * physics clones), throws the selected bodies around, and records frame
 * timings for a fixed window.
 *
 * `/api/fetch-page` is intercepted with Playwright routing so the bench never
 * touches the network for the page itself — runs are deterministic and
 * independent of the proxy implementation.
 *
 * Usage (Playwright is not a project dependency; point at any install):
 *
 *   npm run dev -- --port 5291 --strictPort &
 *   PLAYWRIGHT_MODULE=/abs/path/to/node_modules/playwright/index.mjs \
 *     node scripts/bench/bench.mjs --base http://localhost:5291 --label baseline
 *
 * Options:
 *   --base <url>        Dev/preview server origin (default http://localhost:5173)
 *   --label <name>      Results are written to scripts/bench/results/<label>.json
 *   --scenarios <list>  Comma list of: wiki, news, nyt (default wiki,news)
 *   --nyt <file>        Saved NYTimes homepage HTML (enables the `nyt` scenario)
 *   --runs <n>          Runs per scenario; the median of each metric is reported (default 3)
 *   --duration <ms>     Measurement window (default 10000)
 *   --bodies <n>        maxAutoSelectComponents setting (default 40)
 *   --cpu-throttle <n>  CDP CPU throttling rate during the measurement window (default 1)
 *   --headed            Run with a visible browser window
 */
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "../..")

function parseArgs(argv) {
	const args = {
		base: "http://localhost:5173",
		label: "run",
		scenarios: "wiki,news",
		nyt: null,
		runs: 3,
		duration: 10000,
		bodies: 40,
		"cpu-throttle": 1,
		headed: false,
	}
	for (let i = 0; i < argv.length; i++) {
		const key = argv[i].replace(/^--/, "")
		if (key === "headed") {
			args.headed = true
			continue
		}
		const value = argv[++i]
		if (key in args) args[key] = typeof args[key] === "number" ? Number(value) : value
	}
	if (args.nyt && !args.scenarios.includes("nyt")) args.scenarios += ",nyt"
	return args
}

const args = parseArgs(process.argv.slice(2))
const CACHE_DIR = join(tmpdir(), "domino-bench-cache")
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")

// ─── Fixtures ───

/**
 * Deterministic news-homepage-like fixture: a dense grid of story cards with
 * headlines, summaries, and inline SVG images. Approximates the density of a
 * site like nytimes.com without depending on the network.
 */
function buildNewsFixture() {
	const palette = ["#d8e2dc", "#ffe5d9", "#ffcad4", "#f4acb7", "#9d8189", "#b8c0ff", "#c8b6ff"]
	const words =
		"lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim minim veniam quis nostrud exercitation ullamco laboris nisi aliquip commodo consequat".split(
			" ",
		)
	let seed = 42
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff
		return seed / 0x7fffffff
	}
	const sentence = (n) =>
		Array.from({ length: n }, () => words[Math.floor(rand() * words.length)]).join(" ")
	const svg = (w, h, i) =>
		`data:image/svg+xml;utf8,${encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${palette[i % palette.length]}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 4}" fill="#fff8"/></svg>`,
		)}`
	const stories = Array.from({ length: 48 }, (_, i) => {
		const hasImage = i % 3 !== 2
		return `<article class="story">
			${hasImage ? `<figure><img src="${svg(320, 200, i)}" width="320" height="200" alt="Story ${i}"></figure>` : ""}
			<h3>${sentence(6)}</h3>
			<p>${sentence(28)}.</p>
			<p class="byline"><span class="tag">Section ${i % 7}</span> By ${sentence(2)}</p>
		</article>`
	}).join("\n")
	return `<!doctype html><html><head><title>Synthetic News</title><style>
		body { margin: 0; font-family: Georgia, serif; color: #121212; background: #fff; }
		header.masthead { text-align: center; padding: 24px 0; border-bottom: 1px solid #ddd; font-size: 42px; font-weight: 700; }
		main { max-width: 1200px; margin: 0 auto; padding: 24px; }
		.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
		.story { border-top: 1px solid #e2e2e2; padding-top: 12px; }
		.story figure { margin: 0 0 8px; }
		.story img { width: 100%; height: auto; display: block; }
		.story h3 { font-size: 21px; line-height: 1.2; margin: 6px 0; }
		.story p { font-size: 15px; line-height: 1.45; margin: 4px 0; }
		.tag { display: inline-block; background: #f3f3f3; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px; font: 12px sans-serif; }
	</style></head><body><header class="masthead">The Synthetic Times</header>
	<main><div class="grid">${stories}</div></main></body></html>`
}

async function loadScenario(name) {
	switch (name) {
		case "wiki":
			return {
				name,
				url: "https://en.wikipedia.org/wiki/Typography",
				html: await readFile(resolve(repoRoot, "public/test-wiki-rendered.html"), "utf8"),
			}
		case "news":
			return { name, url: "https://news.example.test/", html: buildNewsFixture() }
		case "nyt":
			if (!args.nyt) throw new Error("--nyt <file> is required for the nyt scenario")
			return { name, url: "https://www.nytimes.com", html: await readFile(args.nyt, "utf8") }
		default:
			throw new Error(`Unknown scenario ${name}`)
	}
}

// ─── Measurement ───

const DEFAULT_SETTINGS = {
	physicsEnabled: true,
	showObstacleBounds: false,
	showLineBounds: false,
	gravityX: 0,
	gravityY: 1,
	pretextEnabled: true,
	textBodiesEnabled: false,
	allowWordBreaks: true,
	restitution: 0.3,
	allowRotation: true,
}

function stats(values) {
	if (values.length === 0) return { mean: 0, p95: 0, max: 0 }
	const sorted = [...values].sort((a, b) => a - b)
	const mean = values.reduce((a, b) => a + b, 0) / values.length
	const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
	return { mean, p95, max: sorted[sorted.length - 1] }
}

function median(values) {
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const cloneCount = (page) =>
	page.evaluate(() => document.querySelectorAll("[data-domino-physics-clone]").length)

async function waitForStableClones(page) {
	await page.waitForFunction(
		() => {
			const w = window
			const n = document.querySelectorAll("[data-domino-physics-clone]").length
			const now = performance.now()
			if (n === 0 || n !== w.__benchLastCount) {
				w.__benchLastCount = n
				w.__benchStableSince = now
				return false
			}
			return now - w.__benchStableSince > 750
		},
		null,
		{ timeout: 60000, polling: 50 },
	)
}

/**
 * Auto-selection on some pages picks fewer bodies than requested. Top up via
 * the component picker: toggle physics on non-overlapping, reasonably sized
 * candidates until the target is reached.
 */
async function topUpSelection(page, target) {
	const current = await cloneCount(page)
	if (current >= target) return
	await page.keyboard.press("c")
	await page.waitForSelector("[data-picker-candidate]", { timeout: 10000 })
	const ids = await page.evaluate((need) => {
		const items = Array.from(document.querySelectorAll("[data-picker-candidate]"))
		// The first child is the outline box (the item itself is padded by a halo).
		const rectOf = (el) => (el.firstElementChild ?? el).getBoundingClientRect()
		const taken = items.filter((el) => el.querySelector('[data-pill="physics"]')).map(rectOf)
		const inside = (a, b) =>
			a.left >= b.left - 4 &&
			a.right <= b.right + 4 &&
			a.top >= b.top - 4 &&
			a.bottom <= b.bottom + 4
		// Nested candidates collapse into one body, so skip ancestors/descendants.
		const overlaps = (a, b) => inside(a, b) || inside(b, a)
		const picked = []
		for (const el of items) {
			if (picked.length >= need) break
			if (el.querySelector('[data-pill="physics"]')) continue
			const r = rectOf(el)
			if (r.width < 60 || r.height < 36 || r.width > 520 || r.height > 420) continue
			if (taken.some((t) => overlaps(t, r))) continue
			taken.push(r)
			picked.push(el.getAttribute("data-picker-candidate"))
		}
		return picked
	}, target - current)
	console.error(`[bench] top-up: ${current} bodies, toggling ${ids.length} more`)
	for (const id of ids) {
		const item = page.locator(`[data-picker-candidate=${JSON.stringify(id)}]`)
		await item.dispatchEvent("mouseover")
		await item.locator('[data-pill="physics"]').dispatchEvent("click")
		await item.dispatchEvent("mouseout")
	}
	await page.keyboard.press("c")
	await waitForStableClones(page)
}

async function cdpMetrics(client) {
	const { metrics } = await client.send("Performance.getMetrics")
	return Object.fromEntries(metrics.map((m) => [m.name, m.value]))
}

async function runOnce(browser, scenario) {
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
	const page = await context.newPage()
	const settings = { ...DEFAULT_SETTINGS, maxAutoSelectComponents: args.bodies }

	await page.addInitScript((s) => {
		localStorage.clear()
		localStorage.setItem("domino-welcome-seen", "1")
		localStorage.setItem("domino-hint-seen", "1")
		localStorage.setItem("domino-settings", JSON.stringify(s))
	}, settings)

	// External sub-resources (Wikipedia images) are served from a disk cache
	// after the first fetch so network jitter doesn't leak into the timings.
	await page.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, async (route) => {
		const request = route.request()
		if (request.method() !== "GET") return route.continue()
		const key = createHash("sha1").update(request.url()).digest("hex")
		const file = join(CACHE_DIR, key)
		try {
			const cached = JSON.parse(await readFile(`${file}.json`, "utf8"))
			return route.fulfill({
				status: cached.status,
				headers: cached.headers,
				body: await readFile(file),
			})
		} catch {
			/* not cached yet */
		}
		try {
			const response = await route.fetch()
			const body = await response.body()
			const headers = { "content-type": response.headers()["content-type"] ?? "" }
			await mkdir(CACHE_DIR, { recursive: true })
			await writeFile(file, body)
			await writeFile(`${file}.json`, JSON.stringify({ status: response.status(), headers }))
			return route.fulfill({ status: response.status(), headers, body })
		} catch {
			return route.abort()
		}
	})

	await page.route("**/api/fetch-page?**", async (route) => {
		const target = new URL(route.request().url()).searchParams.get("url")
		if (target === scenario.url) {
			await route.fulfill({
				status: 200,
				contentType: "text/html; charset=utf-8",
				body: scenario.html,
			})
			return
		}
		// Sub-resources (stylesheets) — keep the run deterministic.
		await route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"bench"}' })
	})

	const t0 = Date.now()
	await page.goto(`${args.base}/?fetch=${encodeURIComponent(scenario.url)}`)

	// Scan complete: candidates tagged inside the iframe.
	await page.waitForFunction(
		() => {
			const doc = document.querySelector("iframe")?.contentDocument
			return Boolean(doc?.querySelector("[data-domino-id]"))
		},
		null,
		{ timeout: 60000, polling: 16 },
	)
	const timeToScan = Date.now() - t0

	// Interactive: physics clones mounted and the count stable for 750ms.
	await waitForStableClones(page)
	const timeToInteractive = Date.now() - t0 - 750
	// Scanner pass duration, when the build records it (performance.measure("domino:scan")).
	// The largest entry is the full post-load scan (earlier ones see about:blank).
	const scanPass = await page.evaluate(() => {
		const scans = performance.getEntriesByName("domino:scan").map((e) => e.duration)
		return scans.length ? Math.max(...scans) : null
	})

	await topUpSelection(page, args.bodies)
	const bodyCount = await cloneCount(page)

	const client = await context.newCDPSession(page)
	await client.send("Performance.enable")
	if (args["cpu-throttle"] > 1) {
		await client.send("Emulation.setCPUThrottlingRate", { rate: args["cpu-throttle"] })
	}
	const before = await cdpMetrics(client)

	await page.evaluate(() => {
		const w = window
		w.__benchFrames = []
		w.__benchLongTasks = []
		w.__benchRunning = true
		let last = performance.now()
		const tick = (now) => {
			w.__benchFrames.push(now - last)
			last = now
			if (w.__benchRunning) requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
		const obs = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) w.__benchLongTasks.push(entry.duration)
		})
		obs.observe({ type: "longtask", buffered: false })
		w.__benchObserver = obs
	})

	const start = Date.now()
	const at = async (ms) => {
		const wait = start + ms - Date.now()
		if (wait > 0) await page.waitForTimeout(wait)
	}

	// Scripted interaction: explode, drag-throw a couple of bodies, explode again.
	await at(500)
	await page.keyboard.press("e")
	for (const t of [2500, 4500]) {
		await at(t)
		const box = await page.evaluate(() => {
			const clones = Array.from(document.querySelectorAll("[data-domino-physics-clone]"))
			for (const el of clones) {
				const r = el.getBoundingClientRect()
				if (r.top > 40 && r.bottom < innerHeight - 40 && r.left > 0 && r.right < innerWidth) {
					return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
				}
			}
			return null
		})
		if (box) {
			await page.mouse.move(box.x, box.y)
			await page.mouse.down()
			for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + i * 40, box.y - i * 25)
			await page.mouse.up()
		}
	}
	await at(6000)
	await page.keyboard.press("e")
	await at(args.duration)

	const after = await cdpMetrics(client)
	const raw = await page.evaluate(() => {
		const w = window
		w.__benchRunning = false
		w.__benchObserver.disconnect()
		return { frames: w.__benchFrames.slice(1), longTasks: w.__benchLongTasks }
	})

	// Rescan cost: fire a resize (the scanner and engine both listen) and record
	// the worst frame in the following second.
	const rescanFrameMax = await page.evaluate(
		() =>
			new Promise((resolveFrame) => {
				const frames = []
				let last = performance.now()
				const begin = last
				const tick = (now) => {
					frames.push(now - last)
					last = now
					if (now - begin < 1000) requestAnimationFrame(tick)
					else resolveFrame(Math.max(...frames))
				}
				requestAnimationFrame(tick)
				window.dispatchEvent(new Event("resize"))
			}),
	)

	await context.close()

	const frame = stats(raw.frames)
	const seconds = raw.frames.reduce((a, b) => a + b, 0) / 1000
	const delta = (key) => (after[key] ?? 0) - (before[key] ?? 0)
	return {
		timeToScan,
		timeToInteractive,
		scanPass,
		bodyCount,
		frameMean: frame.mean,
		frameP95: frame.p95,
		frameMax: frame.max,
		fps: raw.frames.length / seconds,
		longTasks: raw.longTasks.length,
		longTaskTotal: raw.longTasks.reduce((a, b) => a + b, 0),
		scriptMs: delta("ScriptDuration") * 1000,
		layoutMs: delta("LayoutDuration") * 1000,
		styleMs: delta("RecalcStyleDuration") * 1000,
		layoutCount: delta("LayoutCount"),
		styleCount: delta("RecalcStyleCount"),
		rescanFrameMax,
	}
}

const METRICS = [
	["timeToScan", "time to scan (ms)", 0],
	["timeToInteractive", "time to interactive (ms)", 0],
	["scanPass", "scanner pass (ms)", 1],
	["bodyCount", "bodies", 0],
	["frameMean", "frame mean (ms)", 2],
	["frameP95", "frame p95 (ms)", 2],
	["frameMax", "frame max (ms)", 1],
	["fps", "FPS", 1],
	["longTasks", "long tasks", 0],
	["longTaskTotal", "long task total (ms)", 0],
	["scriptMs", "script (ms / window)", 0],
	["layoutMs", "layout (ms / window)", 0],
	["styleMs", "style recalc (ms / window)", 0],
	["layoutCount", "layouts / window", 0],
	["styleCount", "style recalcs / window", 0],
	["rescanFrameMax", "resize→rescan worst frame (ms)", 1],
]

const browser = await chromium.launch({ headless: !args.headed })
const results = { label: args.label, date: new Date().toISOString(), args, scenarios: {} }
try {
	for (const name of args.scenarios.split(",").filter(Boolean)) {
		const scenario = await loadScenario(name)
		const runs = []
		for (let i = 0; i < args.runs; i++) {
			const r = await runOnce(browser, scenario)
			runs.push(r)
			console.error(
				`[bench] ${name} run ${i + 1}/${args.runs}: fps=${r.fps.toFixed(1)} mean=${r.frameMean.toFixed(2)}ms p95=${r.frameP95.toFixed(2)}ms bodies=${r.bodyCount} tti=${r.timeToInteractive}ms`,
			)
		}
		const summary = Object.fromEntries(
			METRICS.map(([key]) => {
				const values = runs.map((r) => r[key]).filter((v) => v !== null)
				return [key, values.length ? median(values) : null]
			}),
		)
		results.scenarios[name] = { summary, runs }
	}
} finally {
	await browser.close()
}

await mkdir(resolve(here, "results"), { recursive: true })
const outPath = resolve(here, "results", `${args.label}.json`)
await writeFile(outPath, `${JSON.stringify(results, null, "\t")}\n`)

const names = Object.keys(results.scenarios)
console.log(`\n| metric (median of ${args.runs}) | ${names.join(" | ")} |`)
console.log(`|---|${names.map(() => "---:").join("|")}|`)
for (const [key, label, digits] of METRICS) {
	const cells = names.map((n) => results.scenarios[n].summary[key]?.toFixed(digits) ?? "n/a")
	console.log(`| ${label} | ${cells.join(" | ")} |`)
}
console.log(`\nWrote ${outPath}`)
