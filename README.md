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
- **Import HTML** — Paste any HTML snippet to create a custom scene

### Throwable Picker
Click "Select Throwables" in the control panel to enter picker mode. Click any element to toggle it as throwable. The engine will auto-detect good candidates when importing HTML, but you can customize which elements participate in physics.

### Controls
The debug panel (top-right gear icon) provides:
- **Physics** — Toggle physics simulation
- **Pretext reflow** — Toggle between Pretext layout and browser text rendering
- **Obstacle bounds** — Visualize obstacle AABBs
- **Line boxes** — Visualize individual line bounding boxes
- **Pause** — Freeze physics
- **Gravity Y** — Adjust gravity strength (-3 to 5)
- **Select Throwables** — Enter picker mode to toggle elements
- **Explode** — Apply random velocity to all throwable bodies
- **Reset** — Return all bodies to original positions

### Scene Picker
Use the bottom toolbar to switch between preset scenes or import custom HTML.

## Architecture

### DOM Snapshotting (`src/scene/domSnapshot.ts`)

The snapshot engine takes an HTML string and converts it to a `SceneDescription`:

1. Renders the HTML in a hidden offscreen container
2. Walks the DOM tree recursively (up to 12 levels deep)
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
- Fixed timestep runner with gravity and sleeping enabled
- Rectangular bodies for each throwable element
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

### Text Overlap Prevention

Each text region's max render height is computed as the distance to the nearest element below it, preventing paragraphs from bleeding into each other when obstacles push text down.

### Obstacle → Row Exclusion (`src/textflow/obstacles.ts`)

```
Row y=200, lineHeight=28 → row spans [200, 228]

Obstacle AABB: {left: 100, right: 260, top: 190, bottom: 240}
  → overlaps row → blocked interval [100, 260]

Container: [40, 700]
After 8px padding: blocked = [92, 268]
Available: [40, 92] (52px), [268, 700] (432px)
Best: [268, 700] at 432px wide
```

Rotated obstacles use their axis-aligned bounding box for simplicity.

### Rendering Layer

- **`TextFlowRegion`** — Absolutely positioned line divs from `computeTextFlow()`
- **`PhysicsDomItem`** — Throwable DOM elements driven by Matter.js body positions
- **`DominoScene`** — Orchestrator: physics init, RAF sync, obstacle building, layers
- **`ThrowablePicker`** — Overlay for toggling element throwability
- **`ScenePicker`** — Toolbar for scene switching and HTML import
- **`DebugPanel`** — Control panel with all settings

### Performance

- `prepareWithSegments()` called once per unique text+font, cached
- `layoutNextLine()` is pure arithmetic — sub-ms per paragraph
- Position changes compared as string snapshots; React state only updates on meaningful change
- Text reflow triggers only when `generation` counter increments

## Tech Stack

- **React + TypeScript** — UI framework
- **Vite** — Build tooling
- **Matter.js** — 2D physics engine
- **@chenglou/pretext** — Text measurement and line-by-line layout
