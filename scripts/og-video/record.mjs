// Records the OG/social preview video for DOMino from the real app.
//
// Drives the Engine preset with Playwright. requestAnimationFrame is stepped by hand
// (exactly 1/60 s per tick) and CSS animations are pinned to the same virtual clock, so
// the Matter.js simulation and every frame are deterministic. Each video frame is a 2x
// screenshot; ffmpeg downsamples them into the MP4 + poster. See README.md for usage.
//
// The loop runs from one click on the toolbar's Reset button to the next: Reset restores
// every body to its starting position and velocity, so the last frame wraps into the
// first exactly as it does in the app.

import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name, fallback) => {
	const i = args.indexOf(`--${name}`)
	return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const WIDTH = 1200
const HEIGHT = 630
const DPR = 2
const FPS = 30
const TICKS_PER_FRAME = 2 // two 60 Hz physics/RAF ticks per 30 fps video frame
const TICK_MS = 1000 / (FPS * TICKS_PER_FRAME)
const CRF = option("crf", "20")
const OUT_DIR = path.resolve(ROOT, option("out", "public/og"))
const NAME = option("name", "dom-ino")
const PORT = Number(option("port", "4791"))
/** Seconds into the loop to grab the poster frame from. */
const POSTER_AT = Number(option("poster-at", "2.4"))
/** Simulate and log orb positions without screenshots or encoding (fast iteration). */
const DRY = flag("dry")

const SWING_Y = Number(option("swing-y", "380"))
const SWING_TO_X = Number(option("swing-to", "820"))
const SWING_SECONDS = Number(option("swing-seconds", "0.7"))
const WATCH_SECONDS = Number(option("watch", "1.1"))

// ─── Easing + paths ───

const clamp01 = (t) => Math.min(1, Math.max(0, t))
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeInSine = (t) => 1 - Math.cos((t * Math.PI) / 2)
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** Catmull-Rom spline through points, re-parameterized by arc length. */
function spline(points) {
	const pts = [points[0], ...points, points[points.length - 1]]
	const raw = (u) => {
		const n = points.length - 1
		const seg = Math.min(n - 1, Math.floor(u * n))
		const t = u * n - seg
		const [p0, p1, p2, p3] = pts.slice(seg, seg + 4)
		const f = (a, b, c, d) =>
			0.5 *
			(2 * b +
				(-a + c) * t +
				(2 * a - 5 * b + 4 * c - d) * t * t +
				(-a + 3 * b - 3 * c + d) * t ** 3)
		return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) }
	}
	const SAMPLES = 400
	const lengths = [0]
	let prev = raw(0)
	for (let i = 1; i <= SAMPLES; i++) {
		const p = raw(i / SAMPLES)
		lengths.push(lengths[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y))
		prev = p
	}
	const total = lengths[SAMPLES]
	return (s) => {
		const target = clamp01(s) * total
		const i = lengths.findIndex((l) => l >= target)
		if (i <= 0) return raw(0)
		const span = lengths[i] - lengths[i - 1] || 1
		return raw((i - 1 + (target - lengths[i - 1]) / span) / SAMPLES)
	}
}

// ─── Preview server ───

async function startServer() {
	const url = option("url", null)
	if (url) return { url, stop: () => {} }
	if (!existsSync(path.join(ROOT, "dist/index.html"))) {
		throw new Error("dist/ not found — run `npm run build` in the repo root first")
	}
	const vite = path.join(ROOT, "node_modules/.bin/vite")
	const child = spawn(vite, ["preview", "--port", String(PORT), "--strictPort"], {
		cwd: ROOT,
		stdio: ["ignore", "ignore", "inherit"],
	})
	const base = `http://localhost:${PORT}`
	for (let i = 0; i < 100; i++) {
		try {
			if ((await fetch(base)).ok) return { url: base, stop: () => child.kill() }
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 100))
	}
	child.kill()
	throw new Error(`vite preview did not start on ${base}`)
}

// ─── In-page helpers ───

/** Puts requestAnimationFrame and CSS animations on a virtual clock that only we advance. */
function installVirtualClock() {
	const nativeRaf = window.requestAnimationFrame.bind(window)
	const queue = new Map()
	let nextId = 1
	let now = 0
	window.requestAnimationFrame = (cb) => {
		const id = nextId++
		queue.set(id, cb)
		return id
	}
	window.cancelAnimationFrame = (id) => queue.delete(id)
	window.__ogTick = (ms) => {
		now += ms
		const callbacks = [...queue.values()]
		queue.clear()
		for (const cb of callbacks) cb(now)
	}
	// CSS transitions/animations (toolbar hover, tooltip, reset spin) would otherwise run on
	// wall-clock time, which has nothing to do with our frame rate. Pause each one as it
	// appears and scrub it to virtual time.
	const started = new WeakMap()
	window.__ogSyncAnimations = () => {
		for (const anim of document.getAnimations()) {
			if (!started.has(anim)) {
				started.set(anim, now)
				anim.pause()
			}
			anim.currentTime = now - started.get(anim)
		}
	}
	// Before each screenshot, let React's scheduler (MessageChannel) and effects catch up with
	// the last tick: wait for real paints until the DOM stops changing.
	const nextPaint = () =>
		new Promise((resolve) => {
			const channel = new MessageChannel()
			channel.port1.onmessage = () => nativeRaf(() => nativeRaf(resolve))
			channel.port2.postMessage(0)
		})
	window.__ogSettle = async () => {
		let last = null
		for (let i = 0; i < 20; i++) {
			await nextPaint()
			const root = document.getElementById("root")
			const signature = `${root.innerHTML.length}:${root.innerHTML}`
			if (signature === last) return i
			last = signature
		}
		return -1
	}
	// Count delivered mouse events so a tick never runs before the page has seen the input
	// that should precede it.
	const delivered = { mousemove: 0, mousedown: 0, mouseup: 0, click: 0 }
	for (const type of Object.keys(delivered)) {
		window.addEventListener(type, () => delivered[type]++, true)
	}
	window.__ogDeliveredCount = (type) => delivered[type]
	window.__ogDelivered = async (type, count) => {
		for (let i = 0; i < 200; i++) {
			if (delivered[type] >= count) return true
			await new Promise((resolve) => setTimeout(resolve, 1))
		}
		return false
	}
	try {
		localStorage.setItem("domino-welcome-seen", "1")
		localStorage.setItem("domino-hint-seen", "1")
	} catch {
		// storage unavailable — the onboarding dialogs would show up in the frames
	}
}

/** Headless screenshots have no pointer, so draw one (plus a press ring) in the page. */
function installCursor() {
	const cursor = document.createElement("div")
	cursor.id = "og-cursor"
	cursor.style.cssText =
		"position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none"
	cursor.innerHTML = `
		<div data-ring style="position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;
			box-sizing:border-box;border:2px solid rgba(255,255,255,0.8);background:rgba(255,255,255,0.1);
			box-shadow:0 0 22px rgba(255,255,255,0.22);opacity:0"></div>
		<svg data-arrow width="34" height="34" viewBox="0 0 24 24"
			style="position:absolute;left:-4.25px;top:-2.83px;overflow:visible;transform-origin:4.25px 2.83px;
			filter:drop-shadow(0 2px 3px rgba(0,0,0,0.55))">
			<path d="M3 2 L3 19.4 L7.4 15.3 L10.3 21.9 L13.3 20.6 L10.5 14.1 L16.5 14.1 Z"
				fill="#fff" stroke="#0b0b0f" stroke-width="1.4" stroke-linejoin="round" />
		</svg>`
	document.body.append(cursor)
}

function drawCursor({ x, y, ring, arrowScale }) {
	const cursor = document.getElementById("og-cursor")
	cursor.style.transform = `translate(${x}px, ${y}px)`
	const ringEl = cursor.querySelector("[data-ring]")
	ringEl.style.opacity = String(ring.opacity)
	ringEl.style.transform = `scale(${ring.scale})`
	cursor.querySelector("[data-arrow]").style.transform = `scale(${arrowScale})`
}

function readOrbs() {
	const colors = {
		gold: "196,163,90",
		blue: "100,140,255",
		pink: "232,100,130",
		green: "80,200,140",
		purple: "150,100,220",
	}
	const found = {}
	for (const el of document.querySelectorAll("div")) {
		const bg = (el.style.background || el.style.backgroundImage || "").replace(/\s/g, "")
		for (const [name, rgb] of Object.entries(colors)) {
			if (!found[name] && bg.includes(`rgba(${rgb},0.35)`)) {
				const r = el.getBoundingClientRect()
				found[name] = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
			}
		}
	}
	return found
}

function resetButtonCenter() {
	const r = document.querySelector('button[aria-label="Reset scene (R)"]').getBoundingClientRect()
	return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

// ─── Recording ───

async function record(baseUrl, framesDir) {
	const browser = await chromium.launch()
	const context = await browser.newContext({
		viewport: { width: WIDTH, height: HEIGHT },
		deviceScaleFactor: DPR,
	})
	await context.addInitScript(installVirtualClock)
	const page = await context.newPage()
	page.on("pageerror", (err) => console.error("[page error]", err.message))

	await page.goto(`${baseUrl}/?preset=engine`, { waitUntil: "networkidle" })
	await page.evaluate(() => document.fonts.ready)
	await page.evaluate(installCursor)
	const resetButton = await page.evaluate(resetButtonCenter)

	// Cursor state, all advanced on the virtual timeline. It rests with its tip on Reset.
	const onReset = { x: resetButton.x - 3, y: resetButton.y + 2 }
	let pos = { ...onReset }
	let pressedAt = null
	let releasedAt = null
	let time = 0
	let frame = 0
	let mouseAt = null
	const orbLog = []
	let unsettledFrames = 0

	const cursorVisual = () => {
		if (pressedAt !== null && releasedAt === null) {
			const t = easeOutCubic(clamp01((time - pressedAt) / 0.16))
			return { ring: { opacity: t, scale: 0.55 + 0.45 * t }, arrowScale: 1 - 0.1 * t }
		}
		if (releasedAt !== null) {
			const t = easeOutCubic(clamp01((time - releasedAt) / 0.3))
			return { ring: { opacity: 1 - t, scale: 1 + 0.5 * t }, arrowScale: 0.9 + 0.1 * t }
		}
		return { ring: { opacity: 0, scale: 0.55 }, arrowScale: 1 }
	}

	let lostEvents = 0
	/** Runs a Playwright mouse action, then waits until the page has received `type`. */
	const dispatch = async (type, action) => {
		const before = await page.evaluate((t) => window.__ogDeliveredCount(t), type)
		await action()
		const ok = await page.evaluate(([t, n]) => window.__ogDelivered(t, n), [type, before + 1])
		if (!ok) lostEvents++
	}

	const moveMouse = async (p) => {
		// Chrome truncates mouse coordinates to whole pixels; send rounded ones instead so the
		// physics target stays centered on the drawn cursor.
		const px = { x: Math.round(p.x), y: Math.round(p.y) }
		if (mouseAt && mouseAt.x === px.x && mouseAt.y === px.y) return
		await dispatch("mousemove", () => page.mouse.move(px.x, px.y))
		mouseAt = px
	}

	const capture = async () => {
		await page.evaluate(drawCursor, { ...pos, ...cursorVisual() })
		await page.evaluate(() => window.__ogSyncAnimations())
		if ((await page.evaluate(() => window.__ogSettle())) < 0) unsettledFrames++
		const file = path.join(framesDir, `${String(frame).padStart(4, "0")}.png`)
		if (!DRY) await page.screenshot({ path: file, type: "png", caret: "hide" })
		orbLog[frame] = { ...(await page.evaluate(readOrbs)), cursor: { ...pos } }
		frame++
	}

	/** Advances `seconds` of video; `pathAt(u)` (u in 0..1) gives the cursor position. */
	const play = async (seconds, pathAt = () => pos) => {
		const frames = Math.round(seconds * FPS)
		for (let i = 0; i < frames; i++) {
			for (let k = 1; k <= TICKS_PER_FRAME; k++) {
				pos = pathAt((i + k / TICKS_PER_FRAME) / frames)
				await moveMouse(pos)
				await page.evaluate((ms) => window.__ogTick(ms), TICK_MS)
				time += TICK_MS / 1000
			}
			await capture()
		}
	}

	const orb = async (name) => (await page.evaluate(readOrbs))[name]

	/** Glides to a (possibly moving) orb, re-reading its position every frame. */
	const glideToOrb = async (name, seconds) => {
		const from = { ...pos }
		const frames = Math.round(seconds * FPS)
		for (let i = 0; i < frames; i++) {
			const target = await orb(name)
			await play(1 / FPS, (s) => lerp(from, target, easeInOutCubic((i + s) / frames)))
		}
	}

	const press = async () => {
		await dispatch("mousedown", () => page.mouse.down())
		pressedAt = time
		releasedAt = null
	}
	// Toolbar buttons act on `click`, so a button press waits for that rather than `mouseup`.
	const release = async (event = "mouseup") => {
		await dispatch(event, () => page.mouse.up())
		releasedAt = time
	}
	const click = async () => {
		await press()
		await play(2 / FPS)
		await release("click")
	}

	// Pre-roll (not in the video): settle with the cursor resting on Reset, then click it.
	await moveMouse(pos)
	await capture()
	await play(0.3)
	await click()
	const loopStart = frame

	// 1. A beat of calm: the orbs drift and the text already flows around them.
	await play(0.5)

	// 2. Reach for the big gold orb and grab it dead center (no torque, so it won't spin).
	await glideToOrb("gold", 0.8)
	await press()
	await play(0.12)

	// 3. Drag it up through the headline, down the first column, and wind up. The path keeps
	//    clear of the drop cap and pull quote: they're static bodies, and grinding the orb
	//    against them sets it spinning.
	const sweep = spline([
		{ ...pos },
		{ x: 540, y: 140 },
		{ x: 360, y: 116 },
		{ x: 240, y: 185 },
		{ x: 265, y: 340 },
		{ x: 410, y: SWING_Y },
	])
	await play(2.2, (u) => sweep(easeInOutCubic(u)))

	// 4. Swing right through the second column, into the pink orb, and let go.
	const swingFrom = { ...pos }
	const swingTo = { x: SWING_TO_X, y: SWING_Y }
	await play(SWING_SECONDS, (u) => lerp(swingFrom, swingTo, easeInSine(u)))
	await release()
	const followFrom = { ...pos }
	const followTo = { x: pos.x + 70, y: pos.y + 10 }
	await play(0.35, (u) => lerp(followFrom, followTo, easeOutCubic(u)))

	// 5. Let the orbs ricochet through the text, then head for Reset and click it.
	await play(WATCH_SECONDS)
	const toResetFrom = { ...pos }
	const toReset = spline([
		toResetFrom,
		{ x: (toResetFrom.x + resetButton.x) / 2 + 30, y: (toResetFrom.y + resetButton.y) / 2 - 10 },
		onReset,
	])
	await play(0.9, (u) => toReset(easeInOutCubic(u)))
	await play(0.25)
	await click()
	const loopEnd = frame
	await play(1 / FPS) // one frame past the loop, to check it matches the first

	await browser.close()
	await writeFile(path.join(framesDir, "orbs.json"), JSON.stringify(orbLog))

	const drift = Object.keys(orbLog[loopStart])
		.filter((name) => name !== "cursor")
		.map((name) => {
			const a = orbLog[loopStart][name]
			const b = orbLog[loopEnd][name]
			return `${name} ${Math.hypot(a.x - b.x, a.y - b.y).toFixed(2)}px`
		})
	console.log(`Loop seam (first frame vs. frame after last): ${drift.join(", ")}`)
	if (unsettledFrames) console.warn(`${unsettledFrames} frames never settled before capture`)
	if (lostEvents) console.warn(`${lostEvents} mouse events never reached the page`)
	return { loopStart, loopEnd }
}

// ─── Encoding ───

function ffmpeg(ffArgs) {
	const res = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...ffArgs], {
		stdio: "inherit",
	})
	if (res.status !== 0) throw new Error(`ffmpeg failed (${res.status})`)
}

function encode(framesDir, { loopStart, loopEnd }) {
	const mp4 = path.join(OUT_DIR, `${NAME}.mp4`)
	ffmpeg([
		"-framerate",
		String(FPS),
		"-start_number",
		String(loopStart),
		"-i",
		path.join(framesDir, "%04d.png"),
		"-frames:v",
		String(loopEnd - loopStart),
		"-vf",
		[
			`scale=${WIDTH}:${HEIGHT}:flags=lanczos:out_color_matrix=bt709:out_range=tv`,
			"format=yuv420p",
			"setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
		].join(","),
		"-an",
		"-c:v",
		"libx264",
		"-preset",
		"veryslow",
		"-crf",
		CRF,
		// Level 4.0 caps reference frames so older mobile decoders can play it.
		"-profile:v",
		"high",
		"-level:v",
		"4.0",
		"-movflags",
		"+faststart",
		mp4,
	])
	return mp4
}

function poster(framesDir, frameIndex) {
	const png = path.join(OUT_DIR, `${NAME}.png`)
	ffmpeg([
		"-i",
		path.join(framesDir, `${String(frameIndex).padStart(4, "0")}.png`),
		"-vf",
		`scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
		"-frames:v",
		"1",
		png,
	])
	return png
}

// ─── Main ───

const framesDir = option("frames", null) ?? (await mkdtemp(path.join(tmpdir(), "dom-ino-og-")))
await mkdir(framesDir, { recursive: true })

const server = await startServer()
let loop
try {
	console.log(`Recording ${server.url} → ${framesDir}`)
	loop = await record(server.url, framesDir)
} finally {
	server.stop()
}

const seconds = (loop.loopEnd - loop.loopStart) / FPS
console.log(`Loop: frames ${loop.loopStart}–${loop.loopEnd - 1} (${seconds.toFixed(2)}s)`)
if (!DRY) {
	await mkdir(OUT_DIR, { recursive: true })
	const mp4 = encode(framesDir, loop)
	const png = poster(framesDir, loop.loopStart + Math.round(POSTER_AT * FPS))
	for (const file of [mp4, png]) {
		console.log(`${path.relative(ROOT, file)}  ${((await stat(file)).size / 1024).toFixed(0)} KB`)
	}
	if (!flag("keep-frames") && !option("frames", null)) await rm(framesDir, { recursive: true })
}
