# DOMino

A physics-driven text layout experiment. Grab any element on the page and throw it through the text — paragraphs reflow around moving obstacles in real time using Pretext's line-by-line layout engine and Matter.js physics.

Fetch any public webpage by URL to turn it into a live physics playground, or explore the built-in preset scenes.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Commands

```bash
npm run dev          # Dev server on http://localhost:5173
npm run build        # TypeScript check + Vite build → dist/
npm run lint         # Biome check (lint + format)
npm run lint:fix     # Biome check with auto-fix
npm run format       # Biome format only
npm run test         # Vitest run (all tests)
npm run test:watch   # Vitest watch mode
npm run preview      # Preview production build
```

## Features

### Preset Scenes

- **Engine** — A minimal physics sandbox for experimenting with throwable elements and text reflow
- **Landing** — A dark-themed product landing page with feature cards and CTAs
- **Alice** — Alice in Wonderland Chapter I with themed illustrations and interactive elements

### Fetch Any URL

Paste any public URL into the Pages panel to fetch and render it as a live physics scene. The page is rendered in a sandboxed iframe with external CSS inlined. Images, badges, and visual elements are auto-selected as throwable physics bodies. Built-in site rules clean up known sites (NYTimes, Wikipedia, Notion, Craigslist).

### Picker Mode

Enter throwable picker mode via the toolbar to click any element and toggle it as a physics body. Alternatively, use save mode to stash elements for reuse across scenes.

### Saved Stash

Save elements from any scene to a persistent stash. Drag saved items onto any page to drop them as new throwable bodies. Stash persists via localStorage.

### Toolbar Controls (bottom-right)

| Button         | Action                                            |
| -------------- | ------------------------------------------------- |
| Pages          | Switch presets, fetch URLs, import HTML           |
| Pause / Resume | Freeze or resume physics                          |
| Explode        | Apply random velocity to all throwable bodies     |
| Reset          | Return all bodies to original positions           |
| Picker         | Toggle throwable / save picker modes              |
| Stash          | Open saved elements, drag onto scene              |
| Settings       | Physics, reflow, gravity, debug bounds, reset all |

## Architecture

### Tech Stack

- **React 19 + TypeScript** (strict mode) — UI and application logic
- **Vite 8** — Build tooling with a dev-only fetch proxy for CORS-free page fetching
- **Matter.js** — 2D physics engine (rigid bodies, mouse constraint, fixed timestep)
- **@chenglou/pretext** — Text measurement and line-by-line layout without DOM reflows
- **Biome** — Linting and formatting
- **Vitest** — Unit tests with jsdom + Testing Library

### Fetch & Snapshot Pipeline

```
URL → fetchPageHtml() → prepareHtmlForViewer() → SnapshotCustomPage (localStorage)
                              ↓
                       iframe srcDoc
                              ↓
                      snapshotWalker() → candidates + text blocks
                              ↓
                   auto-select throwables → ImportedPhysicsClone overlays
                              ↓
                    Matter.js bodies ← RAF loop → SnapshotTextLayer (Pretext)
```

1. **Fetch** — `fetchPageHtml(url)` routes through the Vite dev middleware at `/api/fetch-page` to bypass CORS, spoofing a desktop User-Agent. Private/internal network hostnames are blocked.
2. **Prepare** (`snapshot/prepare.ts`) — Inlines external CSS, rewrites relative URLs to absolute (resolving CSS `url()` against the CSS file's own origin), strips `<script>` tags, fixes JS-dependent visibility classes, and injects a `<base>` tag.
3. **Render & Walk** (`snapshot/walker.ts`) — Renders the prepared HTML in a hidden offscreen iframe, then walks the DOM (up to depth 40) reading computed styles and bounding rects to build a list of selectable candidates.
4. **Auto-select** — Filters candidates by size, skips inline/float-anchored/gallery elements, picks the best throwable elements (images, badges) up to a cap. Per-site rules (`siteRules.ts`) can force or exclude specific selectors.
5. **Physics overlay** — Selected elements are hidden in the iframe and replaced with `ImportedPhysicsClone` components that clone live DOM nodes with inline styles. Matter.js bodies drive their positions via RAF.
6. **Text reflow** — When elements move from their original positions they become obstacles. `SnapshotTextLayer` re-runs `computeTextFlow()` and re-renders Pretext'd text blocks around them.

### Text Reflow (`textflow/useTextFlow.ts`)

The core algorithm uses Pretext's `layoutNextLine`:

1. **Prepare** — `prepareWithSegments(text, font)` does one-time canvas-based text analysis. Results are cached by `text+font` key.
2. **Row iteration** — Walk downward in `lineHeight` increments from the container top.
3. **Obstacle projection** — `getBlockedIntervalsForRow()` finds overlapping obstacle AABBs and projects their horizontal extents for the current row.
4. **Available segments** — `getAvailableSegments()` subtracts merged blocked intervals from the row width, adding configurable padding around obstacles.
5. **Best segment** — `pickBestSegment()` chooses the widest available span (leftmost on ties).
6. **Line layout** — `layoutNextLine(prepared, cursor, width)` fits as much text as possible into the chosen segment, advancing the cursor.
7. **Positioning** — Each line is placed absolutely at `(segment.left, rowY)`.

For snapshot pages, only elements that have moved from their original position act as text obstacles — preventing false displacement of text around static content.

### Physics Engine (`physics/engine.ts`)

Matter.js world management:

- Fixed-timestep runner with configurable gravity
- Rectangular, circular, and polygon body creation
- Boundary walls (floor, ceiling, left/right) to contain bodies
- `MouseConstraint` for drag interaction with tuned stiffness/damping
- Mouse offset re-synced on scroll and resize
- Body clamping to prevent wall escape on resize
- `explode()`, `reset()`, `pin()`, `unpin()`, `pause()`, `resume()`, and gravity adjustment

### Rendering Components

| Component                | Role                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| `DominoScene`            | Orchestrator for preset scenes: physics init, RAF sync, obstacle building   |
| `SnapshotPageView`       | Orchestrator for fetched/imported pages: iframe, scanning, physics overlay  |
| `SceneTextLayer`         | Pretext text overlay for preset scenes                                      |
| `SnapshotTextLayer`      | Pretext text overlay for snapshot pages                                     |
| `SnapshotPhysicsOverlay` | Physics clone management for snapshot pages                                 |
| `TextFlowRegion`         | Renders a single reflowed text block as absolutely-positioned line `<div>`s |
| `PhysicsDomItem`         | Throwable DOM element driven by Matter.js body position (preset scenes)     |
| `ImportedPhysicsClone`   | Cloned live DOM node from iframe, positioned by physics body                |
| `ElementRenderer`        | Type-switch renderer for preset `SceneElement` visuals                      |
| `Toolbar`                | Compact pill toolbar with flyout panels                                     |

### Contexts & Hooks

Three React contexts (React 19 `use()` / `<Context value={}>` API) reduce prop drilling:

- **`NavigationContext`** — Active page, preset key, pages list, import/fetch state
- **`SavedElementsContext`** — Stash of saved elements (save, unsave, remove, drop)
- **`SettingsContext`** — `SceneSettings` (physics params, debug flags) + stats for the Settings panel

Key hooks:

- `useScenePhysics` — Composes picker mode, physics loop, and animated alpha for scene components
- `usePickerPause` — `PickerMode` discriminated union (`null | "throwable" | "save"`) with physics pause/resume
- `usePhysicsLoop` — RAF-driven Matter.js position sync
- `useSnapshotScanner` — Iframe DOM scanning and selection state
- `useTextFlow` / `useImportedTextLayouts` — Text flow computation with Pretext

### Site Rules (`scene/siteRules.ts`)

Per-site configuration applied when fetching known URLs:

- **`removeSelectors`** — DOM elements to strip entirely (ads, nav overlays, banners)
- **`css`** — Additional CSS injected into the iframe for layout corrections
- **`cssLinks`** — CSS files to fetch and inline for sites that load all CSS via JavaScript (e.g. Craigslist)
- **`snapshotPretext`** — Which tags/selectors participate in Pretext text flow
- **`snapshotSolid`** — Elements that act as static walls rather than throwables
- **`snapshotAutoSelect`** — Force or exclude elements from automatic throwable selection

Built-in rules: **Wikipedia**, **NYTimes**, **Notion**, **Craigslist**.

### Performance

- `prepareWithSegments()` runs once per unique `text+font` pair; results are cached in a `Map`
- `layoutNextLine()` is pure arithmetic — sub-millisecond per paragraph
- Physics position state is compared as string snapshots; React state only updates on meaningful change
- Text reflow is gated on a `generation` counter that increments when obstacle positions change
- Snapshot page physics uses only dynamic bodies — no static obstacle bodies in the Matter world

## Project Structure

```
src/
  App.tsx                   # Lean orchestrator — contexts + routing
  main.tsx                  # Entry point with URL param handling

  contexts/                 # React contexts (React 19 use() API)
  hooks/                    # Custom React hooks
  components/               # React UI components
    picker/                 # Element picker overlays + badges
    toolbar/                # Toolbar flyout panels (Pages, Settings, Stash)

  physics/
    engine.ts               # Matter.js world setup, bodies, walls, mouse

  textflow/
    useTextFlow.ts          # Core text-flow algorithm with Pretext
    obstacles.ts            # Obstacle projection and interval helpers
    glyphBodies.ts          # Glyph body measurement from DOM nodes

  scene/                    # Scene data, types, and snapshot pipeline
    types.ts                # Core types (SceneElement, CustomPage, etc.)
    domSnapshot.ts          # Thin re-export facade for snapshot pipeline
    snapshot/               # Snapshot pipeline modules
      prepare.ts            # HTML preparation: CSS inlining, URL rewriting
      walker.ts             # Iframe render + DOM walker
      parser.ts             # Regex-based fallback HTML parser
      fetchPage.ts          # URL fetching + auto-select throwables
      snapshotHelpers.ts    # Snapshot DOM utilities
      snapshotViewUtils.ts  # Stage rect conversion helpers
      snapshotWalker.ts     # Pure iframe DOM scanning function
    siteStyles.ts           # Per-site CSS overrides + selectors
    siteRules.ts            # Site rule definitions
    presets/                # Preset scene definitions (Engine, Landing, Alice)

  utils/
    persistence.ts          # localStorage save/load/clear
    fonts.ts                # Font string building + parsing
    gifFrames.ts            # GIF parsing via gifuct-js
    imageAlpha.ts           # Alpha row extraction from images
    stashImageFromFile.ts   # Create SavedElement from dropped image files
    physics.ts              # Physics math helpers
    styles.ts               # Background style helpers
    url.ts                  # URL normalization
```
