# CLAUDE.md

## Project Overview

DOMino is a physics-driven text layout experiment. Users grab interactive DOM elements and throw them through text content, which reflows around moving obstacles in real-time using Pretext's line-by-line layout engine and Matter.js physics.

## Tech Stack

- **React 19** + **TypeScript** (strict mode) with **Vite 8**
- **Matter.js** for 2D physics simulation
- **@chenglou/pretext** for text measurement and line-by-line layout
- ESLint 9 (flat config) for linting; no Prettier

## Commands

```bash
npm run dev       # Dev server on http://localhost:5173
npm run build     # TypeScript check + Vite build → dist/
npm run lint      # ESLint on .ts/.tsx files
npm run test      # Vitest run (all tests)
npm run test:watch # Vitest watch mode
npm run preview   # Preview production build
```

## Project Structure

```
src/
  App.tsx                    # Main app component, state, routing
  main.tsx                   # Entry point with URL param handling
  components/                # React UI components
    DominoScene.tsx          # Preset scene orchestrator (physics, RAF, UI)
    SnapshotPageView.tsx     # Fetched/imported page view with physics overlay
    Toolbar.tsx              # Bottom-right toolbar with flyout panels
    TextFlowRegion.tsx       # Renders reflowed text lines
    PhysicsDomItem.tsx       # Throwable DOM element for preset scenes
    ImportedPhysicsClone.tsx # Cloned live DOM from iframe
    ThrowablePicker.tsx      # Toggle element selection overlay
    QuickSavePicker.tsx      # Save element to stash overlay
  physics/engine.ts          # Matter.js world setup, bodies, walls, mouse
  textflow/
    useTextFlow.ts           # Core text-flow algorithm with Pretext
    obstacles.ts             # Obstacle projection and interval helpers
  scene/
    types.ts                 # Core types (SceneElement, SceneDescription, etc.)
    domSnapshot.ts           # Fetch/import pipeline, HTML sanitization
    presets/                 # Scene preset definitions and registry
```

## Terminology (for communicating with the user)

- **Live text** / **pretext'd**: Text elements rendered via Pretext's layout engine (`TextFlowRegion`) that reflow around obstacles in real-time. In code these are non-throwable `paragraph` or `heading` elements with `text`.
- **Throwable** / **physics-enabled**: Elements with `throwable: true` that are registered as Matter.js bodies and can be grabbed/thrown by the user. These act as obstacles that live text reflows around.

These terms are for understanding user instructions — don't rename code symbols to match.

## Code Conventions

- Functional components only, no class components
- PascalCase for components/types, camelCase for functions/variables, UPPER_CASE for constants
- Inline styles for dynamic positioning; global CSS in `index.css`
- `useCallback`/`useMemo`/`memo()` used extensively for performance
- Single RAF loop for physics position updates
- Pretext text preparation cached by text+font key
- localStorage for state persistence with graceful error handling
- No CSS-in-JS library — plain inline style objects and CSS imports

## Pretext (@chenglou/pretext)

Pretext is a pure JS/TS library for measuring and laying out multiline text without triggering DOM reflows. It uses the browser's font engine (via canvas) as ground truth but performs layout with fast arithmetic only.

**Two-phase design:**
- `prepare()`/`prepareWithSegments()`: One-time analysis measuring text segments via canvas. Expensive (~19ms for 500 texts) but cached.
- `layout()`/`layoutNextLine()`: Fast arithmetic-only phase (~0.09ms for 500 texts). No DOM access needed.

**Key API used in this project:**

```typescript
// Prepare text for layout (cached in useTextFlow.ts with 60-item LRU)
prepareWithSegments(text: string, font: string, options?: { whiteSpace?: 'normal' | 'pre-wrap' }): PreparedTextWithSegments

// Lay out one line at a time — returns null when text is exhausted
layoutNextLine(prepared: PreparedTextWithSegments, start: LayoutCursor, maxWidth: number): LayoutLine | null

type LayoutLine = { text: string; width: number; start: LayoutCursor; end: LayoutCursor }
type LayoutCursor = { segmentIndex: number; graphemeIndex: number }
```

**Other available API (not currently used):**

```typescript
prepare(text, font, options?)          // Simple preparation (no segment data)
layout(prepared, maxWidth, lineHeight) // Returns { height, lineCount }
layoutWithLines(prepared, maxWidth, lineHeight) // Returns all lines at once
walkLineRanges(prepared, maxWidth, onLine) // Callback-based line iteration
clearCache()   // Reset internal measurement caches
setLocale(locale?) // Configure locale for text segmentation
```

**How DOMino uses Pretext** (`textflow/useTextFlow.ts`): The `computeTextFlow()` function calls `layoutNextLine()` repeatedly within available segments (gaps between physics obstacles) on each row. This lets text wrap around both sides of an obstacle in a single visual row. The cursor advances across segments, and rows advance downward at `lineHeight` increments.

**Caveats:** Targets standard CSS text: `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`. Avoid `system-ui` font on macOS — use explicit font names.

## Architecture Notes

- **Physics engine** (`physics/engine.ts`): Creates Matter.js world with bodies, walls, mouse constraint. Bodies tracked via `Map<elementId, PhysicsBody>`.
- **Text flow** (`textflow/useTextFlow.ts`): Row-by-row downward scan, obstacle avoidance via AABB projection, widest-first segment picking. Bails after 5 consecutive fully-blocked rows.
- **Fetch proxy** (`vite.config.ts`): Dev middleware at `/api/fetch-page?url=` proxies page fetches with User-Agent spoofing.
- **DOM snapshotting** (`scene/domSnapshot.ts`): Inlines computed CSS, fixes visibility, sanitizes HTML for viewer rendering.
- **Site rules** (`scene/siteStyles.ts`): Per-site CSS overrides and element removal selectors for known sites (NYTimes, Wikipedia).

## Testing

- **Vitest** + **jsdom** environment with `@testing-library/react` and `@testing-library/user-event`
- Setup: `vitest.config.ts` (root) + `src/test/setup.ts` (jest-dom matchers)
- Test files colocated with source: `*.test.ts` / `*.test.tsx`
- Key test areas: obstacles (geometry), domSnapshot (fetch pipeline, noscript handling, CSS rewriting), Toolbar (rendering, interactions, panels), physics engine (bodies, methods), presets (scene generation)
- `iframe.sandbox` is not a DOMTokenList in jsdom — tests mock it via `document.createElement` spy
- `fetchPageHtml` tests need `vi.stubGlobal("fetch", ...)` and response bodies >100 chars (the function rejects short proxy responses)

## Validation & Debugging

- **Always validate visually** after changes to SnapshotPageView, domSnapshot, or siteStyles. Use Chrome DevTools MCP to take screenshots and evaluate JS in the running app at `http://localhost:5173`.
- **Use `evaluate_script`** to inspect iframe state: count candidates (`[data-domino-id]`), check physics clones, verify CSS rules, measure element depths, and trace auto-selection logic.
- **Test with multiple sites**: NYTimes and Wikipedia are the two built-in WEBSITE_PRESETS. Always check both after changes to the snapshot pipeline or element selection — fixes for one site frequently regress the other.
- **Auto-selection pitfalls**: The `autoSelectedRef` does not reset when switching between snapshot pages unless explicitly handled (reset on `page.id` change). The auto-selection has several filters (inline skip, float-anchor skip, gallery/thumb skip, size limits, parent containment, cap) — trace through each when elements aren't being picked.
- **JS-loaded CSS**: Some sites (e.g., craigslist) load ALL CSS via JavaScript. Use the `cssLinks` field in site rules (`siteStyles.ts`) to inject CSS files that would normally be loaded by scripts.
- **Loading-state classes**: Classes like `show-curtain`, `opaque`, `loading` are stripped via `replaceClassTokens` in `domSnapshot.ts` since they're set by JS that we remove.

## Snapshot Pipeline Pitfalls

When debugging fetched page rendering issues, check these in order:

1. **CSS `url()` rewriting**: External CSS `url(/path)` must resolve against the CSS file's origin, not the page origin (fonts on CDNs like `g1.nyt.com` break otherwise)
2. **Noscript image pattern**: Sites like NYTimes ship `<img>` with no `src` + `opacity:0` (JS fills it), with the real URL only in `<noscript>`. The pipeline promotes src and forces `opacity:1`
3. **DOM depth**: Modern CSS-in-JS sites nest 25-35+ div levels deep. Walker depth limit is 40
4. **Inline media elements**: `<img>` and `<video>` default to `display:inline` — the walker and selectable-candidates filter must exempt media from inline-skip logic
5. **Font propagation**: `@font-face` rules from the iframe must be copied to the parent document for the Pretext text overlay to use the same fonts
6. **Position regex**: `position:fixed/sticky` replacement runs on the full HTML string including `<style>` blocks — this is intentional but aggressive
