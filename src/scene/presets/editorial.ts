import type { SceneDescription } from "../types"
import { SERIF, SANS, MONO } from "./fonts"

const svgUri = (svg: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const LEAD_L = `In 1945, Vannevar Bush imagined the Memex: a desk that let a researcher trace associative trails through a vast archive. The vision was prescient but the medium was wrong. It took forty-five years and a physicist at CERN before the idea found its true form. In 1990, Tim Berners-Lee wrote the first browser on a NeXT cube, defining the pillars still holding the web today: URLs to name things, HTTP to fetch them, HTML to describe them. For its first decade the document behaved exactly as designed — inert, self-contained, perfectly still.`

const LEAD_R = `What Berners-Lee built was deliberately simple. An HTML page was headings, paragraphs, and links rendered top to bottom by a browser that acted more like an obedient librarian than a platform. There were no layers, no animation, no notion that an element might move. The Document Object Model — the tree that browsers build to represent a page — was not standardized until 1998, when the W3C published DOM Level 1. Before that, Netscape and Internet Explorer maintained incompatible interfaces, and rearranging a page after it loaded was considered exotic. The document was meant to be read, not touched.`

const SEC2_1 = `Cascading Style Sheets arrived in 1996, proposed by Håkon Wium Lie at CERN. The insight was separation: structure in HTML, presentation in CSS. Early adoption was glacial — browsers implemented the spec unevenly, and developers resorted to table layouts and spacer GIFs. It was not until CSS Zen Garden in 2003 that the community saw a single document styled into radically different forms. Today CSS handles grids, animations, container queries, and responsive typography — a language born to change font colors now drives the web's entire visual layer.`

const SEC2_2 = `Brendan Eich wrote JavaScript in ten days in May 1995, a language that looked like Java but behaved like Scheme. It was dismissed as a toy for form validation. That changed slowly, then all at once. Crockford's "The Good Parts" argued a real language hid inside the mess. Node.js proved it ran on servers. React reimagined the DOM as a function of state. TypeScript added types. Today JavaScript is the most widely deployed platform in history, running in every browser and on every server.`

const SEC2_3 = `Pretext, by Cheng Lou, measures and lays out text without triggering browser reflows. It reads glyph widths via Canvas, then performs layout in pure arithmetic — no DOM reads, no jank. Matter.js, by Liam Brummitt, is a rigid-body physics engine running entirely in the browser at sixty frames per second. DOMino combines these two into something neither was built for: a page where thrown objects displace text in real time, and the words reflow around them as naturally as water around a stone.`

const DISPATCH = `The path from Bush's Memex to a page that reflows around thrown objects spans eighty years. HTML provides structure. CSS provides the visual language. JavaScript provides behavior. The DOM bridges document and program. Pretext provides measurement fast enough for a physics loop. Matter.js provides the simulation. DOMino is a proof of concept: the web's document model, so often treated as a constraint, can become a medium for motion, play, and surprise. Pick something up and throw it.`

const EDITORIAL_PLATE = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="340" viewBox="0 0 300 340" fill="none">
  <rect width="300" height="340" rx="14" fill="#F7F1E7"/>
  <rect x="16" y="16" width="268" height="308" rx="10" fill="#FFFDF9" stroke="#D8CFC0" stroke-width="0.75"/>

  <!-- Plate label -->
  <rect x="32" y="28" width="72" height="20" rx="10" fill="#EDE7DA"/>
  <text x="48" y="42" fill="#8A7A5E" font-size="10" font-family="Georgia, serif" font-weight="700" letter-spacing="0.5">Plate I</text>
  <text x="112" y="42" fill="#8F8578" font-size="10" font-family="Georgia, serif" font-style="italic">The Document Object Model</text>

  <!-- Diagram area -->
  <rect x="32" y="58" width="236" height="156" rx="8" fill="#1A1612"/>

  <!-- Tree: document root -->
  <text x="134" y="82" fill="#D4A373" font-size="8" font-family="monospace" opacity="0.5">document</text>
  <circle cx="150" cy="92" r="7" fill="none" stroke="#7C3AED" stroke-width="1.5"/>
  <circle cx="150" cy="92" r="3" fill="#7C3AED" opacity="0.6"/>

  <!-- Branches to head/body -->
  <line x1="150" y1="99" x2="100" y2="127" stroke="#D4A373" stroke-width="1" stroke-dasharray="3 2" opacity="0.7"/>
  <line x1="150" y1="99" x2="200" y2="127" stroke="#D4A373" stroke-width="1" stroke-dasharray="3 2" opacity="0.7"/>

  <!-- head node -->
  <rect x="82" y="124" width="36" height="14" rx="3" fill="none" stroke="#B45309" stroke-width="1" opacity="0.8"/>
  <text x="88" y="134" fill="#D4A373" font-size="7" font-family="monospace">&lt;head&gt;</text>

  <!-- body node -->
  <rect x="182" y="124" width="36" height="14" rx="3" fill="none" stroke="#B45309" stroke-width="1" opacity="0.8"/>
  <text x="188" y="134" fill="#D4A373" font-size="7" font-family="monospace">&lt;body&gt;</text>

  <!-- Leaf branches from head -->
  <line x1="100" y1="138" x2="72" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="100" y1="138" x2="128" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>

  <!-- Leaf branches from body -->
  <line x1="200" y1="138" x2="172" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="200" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="228" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>

  <!-- Leaf nodes from head -->
  <rect x="58" y="160" width="28" height="12" rx="2" fill="#0F766E" opacity="0.7"/>
  <text x="62" y="169" fill="#fff" font-size="6" font-family="monospace">&lt;meta&gt;</text>
  <rect x="114" y="160" width="28" height="12" rx="2" fill="#0F766E" opacity="0.7"/>
  <text x="118" y="169" fill="#fff" font-size="6" font-family="monospace">&lt;title&gt;</text>

  <!-- Leaf nodes from body -->
  <rect x="158" y="160" width="28" height="12" rx="2" fill="#0F766E" opacity="0.7"/>
  <text x="164" y="169" fill="#fff" font-size="6" font-family="monospace">&lt;h1&gt;</text>
  <rect x="191" y="160" width="18" height="12" rx="2" fill="#0F766E" opacity="0.7"/>
  <text x="195" y="169" fill="#fff" font-size="6" font-family="monospace">&lt;p&gt;</text>
  <rect x="214" y="160" width="28" height="12" rx="2" fill="#0F766E" opacity="0.7"/>
  <text x="218" y="169" fill="#fff" font-size="6" font-family="monospace">&lt;div&gt;</text>

  <!-- Sub-branches from div -->
  <line x1="228" y1="172" x2="218" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <line x1="228" y1="172" x2="238" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <circle cx="218" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>
  <circle cx="238" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>

  <!-- Decorative dots -->
  <circle cx="72" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="78" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="84" cy="196" r="1" fill="#8F8578" opacity="0.2"/>

  <!-- Caption area -->
  <text x="32" y="234" fill="#2C241F" font-size="11" font-family="Georgia, serif" font-weight="700">The DOM tree</text>
  <line x1="32" y1="242" x2="160" y2="242" stroke="#D8CFC0" stroke-width="0.5"/>
  <text x="32" y="256" fill="#8F8578" font-size="9" font-family="Georgia, serif">A browser parses HTML into a tree of</text>
  <text x="32" y="268" fill="#8F8578" font-size="9" font-family="Georgia, serif">nodes. Each node is an object with</text>
  <text x="32" y="280" fill="#8F8578" font-size="9" font-family="Georgia, serif">properties, children, and methods.</text>

  <!-- Legend -->
  <circle cx="40" cy="302" r="4" fill="none" stroke="#7C3AED" stroke-width="1"/>
  <text x="50" y="305" fill="#8F8578" font-size="8" font-family="Georgia, serif">Root</text>
  <rect x="76" y="298" width="8" height="8" rx="1.5" fill="none" stroke="#B45309" stroke-width="0.75"/>
  <text x="90" y="305" fill="#8F8578" font-size="8" font-family="Georgia, serif">Branch</text>
  <rect x="128" y="298" width="8" height="8" rx="1.5" fill="#0F766E" opacity="0.7"/>
  <text x="142" y="305" fill="#8F8578" font-size="8" font-family="Georgia, serif">Leaf</text>
</svg>
`)

export function createEditorialScene(vw: number, vh: number): SceneDescription {
	const w = Math.min(vw - 40, 940)
	const mx = Math.max(20, (vw - w) / 2)
	const H = Math.max(vh, 1710)
	const col2W = (w - 28) / 2
	const col3W = (w - 48) / 3

	return {
		id: "editorial",
		name: "Editorial",
		width: vw,
		height: H,
		backgroundColor: "#F4F0E8",
		elements: [
			// ── Masthead ──────────────────────────────────────────
			{
				id: "e-r1",
				type: "divider",
				rect: { x: mx, y: 20, width: w, height: 3 },
				throwable: false,
				pinned: true,
				backgroundColor: "#1A1612",
			},
			{
				id: "e-mast",
				type: "heading",
				rect: { x: mx, y: 28, width: w, height: 50 },
				throwable: false,
				pinned: true,
				text: "The Living Document",
				fontSize: 42,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 48,
				color: "#1A1612",
			},
			{
				id: "e-vol",
				type: "heading",
				rect: { x: mx, y: 80, width: w / 2, height: 16 },
				throwable: false,
				pinned: true,
				text: "Vol. I  |  First edition  |  April 2026",
				fontSize: 10,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#8F8578",
			},
			{
				id: "e-weather",
				type: "heading",
				rect: { x: mx + w - 238, y: 80, width: 138, height: 16 },
				throwable: false,
				pinned: true,
				text: "W3C  ·  ECMA  ·  IETF",
				fontSize: 10,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#8F8578",
			},
			{
				id: "e-price",
				type: "badge",
				rect: { x: mx + w - 72, y: 74, width: 72, height: 22 },
				throwable: true,
				pinned: false,
				text: "v1.0",
				fontSize: 10,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#1A1612",
				backgroundColor: "#FBF7F1",
				borderRadius: 0,
				border: "1px solid #C9BFAF",
				mass: 0.08,
			},
			{
				id: "e-r2",
				type: "divider",
				rect: { x: mx, y: 102, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#B9AFA1",
			},
			{
				id: "e-r2b",
				type: "divider",
				rect: { x: mx, y: 105, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#B9AFA1",
			},

			// ── Section tags ──────────────────────────────────────
			{
				id: "e-sec-1",
				type: "badge",
				rect: { x: mx, y: 112, width: 76, height: 20 },
				throwable: true,
				pinned: false,
				text: "HISTORY",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#B45309",
				backgroundColor: "transparent",
				borderRadius: 0,
				mass: 0.04,
			},
			{
				id: "e-sec-2",
				type: "badge",
				rect: { x: mx + 84, y: 112, width: 84, height: 20 },
				throwable: true,
				pinned: false,
				text: "SYSTEMS",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#7C3AED",
				backgroundColor: "transparent",
				borderRadius: 0,
				mass: 0.04,
			},
			{
				id: "e-sec-3",
				type: "badge",
				rect: { x: mx + 176, y: 112, width: 64, height: 20 },
				throwable: true,
				pinned: false,
				text: "CRAFT",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#0F766E",
				backgroundColor: "transparent",
				borderRadius: 0,
				mass: 0.04,
			},

			// ── Headline + deck ───────────────────────────────────
			{
				id: "e-hl",
				type: "heading",
				rect: { x: mx, y: 142, width: w, height: 42 },
				throwable: false,
				pinned: true,
				text: "How The Web Learned To Breathe",
				fontSize: 32,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 38,
				color: "#1A1612",
			},
			{
				id: "e-deck",
				type: "paragraph",
				rect: { x: mx, y: 194, width: w, height: 80 },
				throwable: false,
				pinned: true,
				text: "From Vannevar Bush's Memex to a page whose text reflows around thrown objects in real time, the story of the web is a story of documents learning to move. This is how HTML, CSS, JavaScript, the DOM, and two small libraries called Pretext and Matter.js made it possible.",
				fontSize: 16,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 24,
				color: "#5E574F",
			},
			{
				id: "e-by",
				type: "heading",
				rect: { x: mx, y: 282, width: w, height: 16 },
				throwable: false,
				pinned: true,
				text: "By the DOMino editorial desk  |  From vacuum tubes to physics engines  |  Text reflows in real time",
				fontSize: 11,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 16,
				color: "#8F8578",
			},
			{
				id: "e-r3",
				type: "divider",
				rect: { x: mx, y: 310, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},

			// ── Two-column lead ───────────────────────────────────
			{
				id: "e-c1",
				type: "paragraph",
				rect: { x: mx, y: 330, width: col2W, height: 440 },
				throwable: false,
				pinned: true,
				text: LEAD_L,
				fontSize: 15,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 24,
				color: "#2D2925",
			},
			{
				id: "e-c2",
				type: "paragraph",
				rect: { x: mx + col2W + 28, y: 330, width: col2W, height: 440 },
				throwable: false,
				pinned: true,
				text: LEAD_R,
				fontSize: 15,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 24,
				color: "#2D2925",
			},
			{
				id: "e-plate",
				type: "image",
				rect: { x: mx + col2W - 78, y: 426, width: 184, height: 208 },
				throwable: true,
				pinned: false,
				backgroundColor: "#ECE5D8",
				borderRadius: 10,
				imageAlt: "DOM tree diagram",
				imageSrc: EDITORIAL_PLATE,
				boxShadow: "0 14px 32px rgba(26,22,18,0.08)",
				mass: 1.6,
			},
			{
				id: "e-note",
				type: "card",
				rect: { x: mx + w - 148, y: 586, width: 148, height: 110 },
				throwable: true,
				pinned: false,
				text: "Technical note",
				fontSize: 12,
				fontWeight: 700,
				fontFamily: SANS,
				color: "#1A1612",
				backgroundColor: "#FFFDF8",
				borderRadius: 10,
				padding: 14,
				border: "1px solid #D9D0C2",
				boxShadow: "0 6px 16px rgba(26,22,18,0.05)",
				mass: 0.7,
				children: [
					{
						id: "e-note-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Pretext measures 500 texts in ~0.09ms — fast enough for a 60fps physics loop.",
						fontSize: 11,
						fontWeight: 400,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#6A625A",
					},
				],
			},

			// ── Section 2 header ──────────────────────────────────
			{
				id: "e-r4",
				type: "divider",
				rect: { x: mx, y: 800, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-mid-h",
				type: "heading",
				rect: { x: mx, y: 818, width: w, height: 24 },
				throwable: false,
				pinned: true,
				text: "The languages that shaped the page",
				fontSize: 22,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 24,
				color: "#1A1612",
			},
			{
				id: "e-r5",
				type: "divider",
				rect: { x: mx, y: 852, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},

			// ── Three columns ─────────────────────────────────────
			{
				id: "e-t1",
				type: "paragraph",
				rect: { x: mx, y: 870, width: col3W, height: 350 },
				throwable: false,
				pinned: true,
				text: SEC2_1,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 21,
				color: "#3A352F",
			},
			{
				id: "e-t2",
				type: "paragraph",
				rect: { x: mx + col3W + 24, y: 870, width: col3W, height: 350 },
				throwable: false,
				pinned: true,
				text: SEC2_2,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 21,
				color: "#3A352F",
			},
			{
				id: "e-t3",
				type: "paragraph",
				rect: { x: mx + (col3W + 24) * 2, y: 870, width: col3W, height: 350 },
				throwable: false,
				pinned: true,
				text: SEC2_3,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 21,
				color: "#3A352F",
			},

			// ── Gap throwables ────────────────────────────────────
			{
				id: "e-seal",
				type: "badge",
				rect: { x: mx + 24, y: 1228, width: 54, height: 54 },
				throwable: true,
				pinned: false,
				text: "DOM",
				fontSize: 11,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#fff",
				backgroundColor: "#B45309",
				borderRadius: 27,
				mass: 0.72,
			},
			{
				id: "e-pq",
				type: "card",
				rect: { x: mx + col3W + 48, y: 1224, width: 210, height: 128 },
				throwable: true,
				pinned: false,
				text: '"The document was meant to be read, not touched."',
				fontSize: 15,
				fontWeight: 500,
				fontFamily: SERIF,
				color: "#7C3AED",
				backgroundColor: "#FFFDF8",
				borderRadius: 10,
				padding: 14,
				border: "1px solid #D9D0C2",
				boxShadow: "0 6px 20px rgba(26,22,18,0.05)",
				mass: 0.85,
				children: [
					{
						id: "e-pq-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Until JavaScript, CSS, and the DOM turned it into something alive.",
						fontSize: 11,
						fontWeight: 400,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#6A625A",
					},
				],
			},

			// ── Dispatch section ──────────────────────────────────
			{
				id: "e-r6",
				type: "divider",
				rect: { x: mx, y: 1340, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-disp-h",
				type: "heading",
				rect: { x: mx, y: 1358, width: w, height: 24 },
				throwable: false,
				pinned: true,
				text: "The physics of reading",
				fontSize: 22,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 24,
				color: "#1A1612",
			},
			{
				id: "e-r7",
				type: "divider",
				rect: { x: mx, y: 1392, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},
			{
				id: "e-dispatch",
				type: "paragraph",
				rect: { x: mx, y: 1410, width: w, height: 200 },
				throwable: false,
				pinned: true,
				text: DISPATCH,
				fontSize: 16,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 26,
				color: "#2D2925",
			},
			{
				id: "e-briefs",
				type: "card",
				rect: { x: mx + w - 196, y: 1444, width: 196, height: 180 },
				throwable: true,
				pinned: false,
				text: "Also in this issue",
				fontSize: 13,
				fontWeight: 700,
				fontFamily: SANS,
				color: "#1A1612",
				backgroundColor: "#FFFDF8",
				borderRadius: 10,
				padding: 14,
				border: "1px solid #D9D0C2",
				boxShadow: "0 6px 20px rgba(26,22,18,0.05)",
				mass: 0.9,
				children: [
					{
						id: "briefs-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Timeline: from ARPANET to container queries",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#1A1612",
					},
					{
						id: "briefs-b",
						type: "paragraph",
						rect: { x: 0, y: 6, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Profile: Cheng Lou on measuring text without the DOM",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#1A1612",
					},
					{
						id: "briefs-c",
						type: "paragraph",
						rect: { x: 0, y: 6, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Lab notes: rigid-body physics meets editorial layout",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#1A1612",
					},
				],
			},

			// ── Footer ────────────────────────────────────────────
			{
				id: "e-r8",
				type: "divider",
				rect: { x: mx, y: 1650, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-foot",
				type: "heading",
				rect: { x: mx, y: 1664, width: w, height: 14 },
				throwable: false,
				pinned: true,
				text: "Typeset in code  |  Measured by Pretext  |  Moved by Matter.js  |  Built with React + TypeScript",
				fontSize: 9,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#A19486",
			},
		],
	}
}
