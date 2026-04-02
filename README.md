# DOMino

A physics-driven text layout experiment that combines DOM element physics with real-time text reflow. Grab any element on the page — cards, badges, buttons — and throw it through the text. Watch as paragraphs reflow around the moving obstacles in real time using Pretext's line-by-line layout engine.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 to see the demo.

## Features

### Scene Modes
- **Article** — A typographic article layout with sidebar cards and badges
- **Dashboard** — An analytics dashboard with KPI cards, charts, and action buttons
- **Landing Page** — A dark-themed product landing page with feature cards and CTAs
- **Editorial** — A magazine-style editorial layout with pull quotes
- **Engine** — A minimal physics sandbox for experimentation
- **Alice** — Alice in Wonderland Chapter I with themed illustrations and interactive elements

### Fetch URL
Fetch any public webpage by URL and interact with it as a physics scene. The fetched page is rendered in a sandboxed iframe with external CSS inlined for fidelity. Images, badges, and other visual elements are auto-selected as throwable physics bodies. Enter component mode to customize which elements participate in physics.

### Import HTML
Paste any HTML snippet to create a custom scene. The snapshot engine analyzes the markup, infers element types, and builds a physics-ready layout.

### Component Mode
Click the component mode button (grid icon) in the toolbar to enter picker mode. Click any element to toggle it as throwable. Save elements to the stash for reuse across scenes. The engine auto-detects good throwable candidates (images, badges) when fetching URLs.

### Saved Components (Stash)
Save elements from any scene to a persistent stash. Drag saved components onto any page — preset or fetched — to drop them as new throwable bodies. The stash persists across page switches via localStorage.

### Controls
The toolbar (bottom-right) provides:
- **Pages** — Switch presets, fetch URLs, or paste HTML
- **Pause/Resume** — Freeze or resume physics simulation
- **Explode** — Apply random velocity to all throwable bodies
- **Reset** — Return all bodies to original positions
- **Component mode** — Toggle element selection for physics
- **Saved components** — Access the stash, pick from page, drop onto scene
- **Settings** — Physics, Pretext reflow, gravity, debug bounds, reset all

## Architecture

### Fetch & Import Pipeline (`src/scene/domSnapshot.ts`)

1. **Fetch** — `fetchPageHtml(url)` proxies the request through a Vite dev middleware (`/api/fetch-page`) to bypass CORS, falling back to direct fetch
2. **Prepare** — `prepareHtmlForViewer(html, sourceUrl)` inlines external CSS via the proxy, rewrites relative URLs to absolute, strips scripts, fixes JS-dependent visibility classes, and injects a `<base>` tag
3. **Persist** — The prepared HTML is stored as a `SnapshotCustomPage` in localStorage alongside the source URL

### Snapshot Page Viewer (`src/components/SnapshotPageView.tsx`)

Renders fetched/imported pages in a sandboxed `<iframe srcDoc>` with physics overlays:

1. **Scan** — Walks the iframe DOM to find selectable candidates and text blocks
2. **Auto-select** — Picks images and badges as initial throwable elements
3. **Clone** — Selected elements are hidden in the iframe and replaced with `ImportedPhysicsClone` overlays that clone the original DOM with inline styles
4. **Physics** — Matter.js bodies drive clone positions via RAF loop
5. **Pretext** — When enabled, text blocks are replaced with `TextFlowRegion` overlays that reflow around moved obstacles

### DOM Snapshotting (preset scenes)

The snapshot engine takes an HTML string and converts it to a `SceneDescription`:

1. Renders the HTML in a hidden offscreen container
2. Walks the DOM tree recursively (up to 20 levels deep)
3. For each element, reads computed styles and bounding rect
4. Maps HTML tags to scene element types using heuristics:
   - `<h1>`-`<h6>` → heading
   - `<p>`, `<span>`, `<blockquote>` → paragraph
   - `<button>`, styled `<a>` → button
   - `<img>` → image
   - Styled `<div>` with short text → badge
   - `<div>` with background/shadow/border → card
   - Other containers → recurse into children
5. Auto-selects throwable candidates (buttons, badges, cards, images under 500×400px)

### Physics (`src/physics/engine.ts`)

Matter.js world management:
- Fixed timestep runner with configurable gravity
- Rectangular, circular, and polygon bodies
- Boundary walls (floor, ceiling, left, right) to contain bodies
- `MouseConstraint` for drag interaction with tuned stiffness/damping
- Mouse offset synced with scroll and resize
- Body clamping to prevent wall escape
- Explode, reset, pin/unpin, pause, gravity adjustment

### Text Reflow (`src/textflow/useTextFlow.ts`)

The core algorithm using Pretext's `layoutNextLine`:

1. **Prepare** — `prepareWithSegments(text, font)` does one-time text analysis. Cached by text+font key.
2. **Row iteration** — Walk downward in `lineHeight` increments from container top.
3. **Obstacle projection** — For each row, `getBlockedIntervalsForRow()` finds overlapping obstacle AABBs and projects their horizontal extents.
4. **Available segments** — `getAvailableSegments()` subtracts merged blocked intervals from row width, with padding around obstacles.
5. **Best segment** — `pickBestSegment()` chooses the widest span (leftmost on ties) for readability.
6. **Line layout** — `layoutNextLine(prepared, cursor, width)` fits text into the chosen segment.
7. **Positioning** — Line placed at `(segment.left, rowY)`.

For snapshot pages, obstacles only include elements that have moved from their original position, preventing false text displacement.

### Rendering Layer

- **`TextFlowRegion`** — Absolutely positioned line divs from `computeTextFlow()`
- **`PhysicsDomItem`** — Throwable DOM elements driven by Matter.js body positions (preset scenes)
- **`ImportedPhysicsClone`** — Cloned live DOM nodes from iframe for fetched pages
- **`DominoScene`** — Orchestrator for preset scenes: physics init, RAF sync, obstacle building
- **`SnapshotPageView`** — Orchestrator for fetched/imported pages: iframe, scanning, physics overlay
- **`ThrowablePicker`** / **`QuickSavePicker`** — Overlays for toggling elements and saving to stash
- **`Toolbar`** — Compact pill toolbar with flyout panels for pages, stash, and settings

### Performance

- `prepareWithSegments()` called once per unique text+font, cached
- `layoutNextLine()` is pure arithmetic — sub-ms per paragraph
- Position changes compared as string snapshots; React state only updates on meaningful change
- Text reflow triggers only when `generation` counter increments
- Snapshot page physics uses only dynamic bodies (no static obstacle bodies) for efficiency

## Tech Stack

- **React 19 + TypeScript** — UI framework
- **Vite** — Build tooling with dev proxy for CORS-free page fetching
- **Matter.js** — 2D physics engine
- **@chenglou/pretext** — Text measurement and line-by-line layout
