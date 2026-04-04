# CLAUDE.md

## Project Overview

DOMino is a physics-driven text layout experiment. Users grab interactive DOM elements and throw them through text content, which reflows around moving obstacles in real-time using Pretext's line-by-line layout engine and Matter.js physics.

## Tech Stack

- **React 19** + **TypeScript** (strict mode) with **Vite 8**
- **Matter.js** for 2D physics simulation
- **@chenglou/pretext** for text measurement and line-by-line layout
- **Biome** for linting and formatting

## Commands

```bash
npm run dev        # Dev server on http://localhost:5173
npm run build      # TypeScript check + Vite build → dist/
npm run lint       # Biome check (lint + format)
npm run lint:fix   # Biome check with auto-fix
npm run format     # Biome format only
npm run test       # Vitest run (all tests)
npm run test:watch # Vitest watch mode
npm run preview    # Preview production build
```

## Project Structure

```
src/
  App.tsx                         # Lean orchestrator — contexts + routing
  main.tsx                        # Entry point with URL param handling

  contexts/                       # React contexts (React 19 use() API)
    NavigationContext.tsx          # Page navigation state (preset, pages, import/fetch)
    SavedElementsContext.tsx       # Saved element stash (save/unsave/remove)
    SettingsContext.tsx             # SceneSettings + stats for SettingsPanel

  hooks/                          # Custom React hooks
    usePageNavigation.ts          # Page/scene state management (extracted from App)
    useScenePhysics.ts            # Composes picker, physics loop, animated alpha
    usePickerPause.ts             # PickerMode state + physics pause/resume
    usePhysicsLoop.ts             # RAF-driven physics position updates
    useAnimatedAlpha.ts           # GIF frame-synced alpha row tracking
    useImportedTextLayouts.ts     # Imported page text flow computation
    useSnapshotScanner.ts         # Iframe DOM scanning + selection state

  components/                     # React UI components
    DominoScene.tsx               # Preset scene orchestrator
    SnapshotPageView.tsx          # Fetched/imported page view
    SceneTextLayer.tsx            # Text rendering layer for DominoScene
    SnapshotTextLayer.tsx         # Text rendering layer for SnapshotPageView
    SnapshotPhysicsOverlay.tsx    # Physics clones for snapshot elements
    Toolbar.tsx                   # Bottom-right toolbar with flyout panels
    ElementRenderer.tsx           # Type-switch renderer for SceneElement visuals
    PhysicsDomItem.tsx            # Positioned wrapper + debug overlays
    TextFlowRegion.tsx            # Renders reflowed text lines
    ImportedPhysicsClone.tsx      # Cloned live DOM from iframe
    Overlays.tsx                  # FetchOverlay, PageReloadOverlay, Hint
    picker/                       # Element picker components
      ThrowablePicker.tsx         # Toggle throwable/physics on elements
      QuickSavePicker.tsx         # Click-to-save element overlay
      SnapshotPickerOverlay.tsx   # Snapshot page element picker
      PickerBadges.tsx            # Physics/Save/Delete badge pills
      PickerBanner.tsx            # Picker mode bottom banner
      PickerIcons.tsx             # Small SVG icons for pickers
      pickerStyles.ts             # Shared constants, outline styles, keyframes
      useFlyAnimation.ts          # Stash fly-to animation hook
      useEscClose.ts              # Escape key close hook
    toolbar/                      # Toolbar flyout panels
      PagesPanel.tsx              # Page/preset selection + URL import
      SettingsPanel.tsx           # Physics/reflow/debug settings
      StashPanel.tsx              # Saved element stash management
      icons.tsx                   # Toolbar button SVG icons

  physics/
    engine.ts                     # Matter.js world setup, bodies, walls, mouse

  textflow/
    useTextFlow.ts                # Core text-flow algorithm with Pretext
    obstacles.ts                  # Obstacle projection and interval helpers
    glyphBodies.ts                # Glyph body measurement from DOM nodes

  scene/                          # Scene data, types, and snapshot pipeline
    types.ts                      # Core types (SceneElement, CustomPage, etc.)
    domSnapshot.ts                # Thin facade re-exporting snapshot pipeline
    snapshot/                     # Snapshot pipeline (split from domSnapshot)
      prepare.ts                  # HTML preparation: CSS inlining, URL rewriting
      walker.ts                   # Iframe render + DOM walker
      parser.ts                   # Regex-based fallback HTML parser
      fetchPage.ts                # URL fetching + auto-select throwables
    snapshotHelpers.ts            # Snapshot DOM utilities (element-to-scene, etc.)
    snapshotViewUtils.ts          # Stage rect conversion helpers
    snapshotWalker.ts             # Pure iframe DOM scanning function
    siteStyles.ts                 # Per-site CSS overrides + selectors
    siteRules.ts                  # Site rule definitions (NYTimes, Wikipedia, etc.)
    presets/                      # Scene preset definitions and registry

  utils/
    persistence.ts                # localStorage save/load/clear
    fonts.ts                      # Font string building + parsing
    gifFrames.ts                  # GIF parsing via gifuct-js
    imageAlpha.ts                 # Alpha row extraction from images
    stashImageFromFile.ts         # Create SavedElement from dropped image files
    physics.ts                    # Physics math helpers
    styles.ts                     # Background style helpers
    url.ts                        # URL normalization
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
- React 19: `use()` for context consumption, `<Context value={}>` for providers (no `.Provider`)
- Three React contexts reduce prop drilling: `NavigationContext`, `SavedElementsContext`, `SettingsContext`
- `PickerMode` discriminated union (`null | "throwable" | "save"`) instead of separate booleans
- `SceneSettings` (not DebugSettings) for runtime scene configuration
- localStorage persistence via `utils/persistence.ts` with graceful error handling
- No CSS-in-JS library — plain inline style objects and CSS imports

## Pretext (@chenglou/pretext)

Pretext is a pure JS/TS library for measuring and laying out multiline text without triggering DOM reflows. It uses the browser's font engine (via canvas) as ground truth but performs layout with fast arithmetic only.

**Two-phase design:**
- `prepare()`/`prepareWithSegments()`: One-time analysis measuring text segments via canvas. Expensive (~19ms for 500 texts) but cached.
- `layout()`/`layoutNextLine()`: Fast arithmetic-only phase (~0.09ms for 500 texts). No DOM access needed.

**Key API used in this project:**

```typescript
prepareWithSegments(text: string, font: string, options?: { whiteSpace?: 'normal' | 'pre-wrap' }): PreparedTextWithSegments
layoutNextLine(prepared: PreparedTextWithSegments, start: LayoutCursor, maxWidth: number): LayoutLine | null

type LayoutLine = { text: string; width: number; start: LayoutCursor; end: LayoutCursor }
type LayoutCursor = { segmentIndex: number; graphemeIndex: number }
```

**How DOMino uses Pretext** (`textflow/useTextFlow.ts`): The `computeTextFlow()` function calls `layoutNextLine()` repeatedly within available segments (gaps between physics obstacles) on each row. This lets text wrap around both sides of an obstacle in a single visual row. The cursor advances across segments, and rows advance downward at `lineHeight` increments.

**Caveats:** Targets standard CSS text: `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`. Avoid `system-ui` font on macOS — use explicit font names.

## Architecture Notes

- **App.tsx**: Lean orchestrator. Uses `usePageNavigation` hook for all page/scene state, provides `NavigationContext` + `SavedElementsContext`, routes to `DominoScene` or `SnapshotPageView`.
- **Scene components** (`DominoScene`, `SnapshotPageView`): Use `useScenePhysics` for physics + picker + animation, provide `SettingsContext` around `Toolbar`.
- **Physics engine** (`physics/engine.ts`): Creates Matter.js world with bodies, walls, mouse constraint. Bodies tracked via `Map<elementId, PhysicsBody>`.
- **Text flow** (`textflow/useTextFlow.ts`): Row-by-row downward scan, obstacle avoidance via AABB projection, widest-first segment picking. Bails after 5 consecutive fully-blocked rows.
- **Fetch proxy** (`vite.config.ts`): Dev middleware at `/api/fetch-page?url=` proxies page fetches with User-Agent spoofing.
- **Snapshot pipeline** (`scene/snapshot/`): `prepare.ts` inlines CSS + fixes URLs, `walker.ts` renders in iframe + walks DOM, `parser.ts` is regex fallback, `fetchPage.ts` handles URL fetching. `domSnapshot.ts` is a thin re-export facade.
- **Site rules** (`scene/siteStyles.ts` + `siteRules.ts`): Per-site CSS overrides and element removal selectors for known sites (NYTimes, Wikipedia).
- **Picker system** (`components/picker/`): Three picker overlays (throwable, save, snapshot) share badges, styles, and animation via shared utilities.

## Testing

- **Vitest** + **jsdom** environment with `@testing-library/react` and `@testing-library/user-event`
- Setup: `vitest.config.ts` (root) + `src/test/setup.ts` (jest-dom matchers)
- Test files colocated with source: `*.test.ts` / `*.test.tsx`
- Key test areas: obstacles (geometry), domSnapshot (fetch pipeline, noscript handling, CSS rewriting), Toolbar (rendering, interactions, panels), physics engine (bodies, methods), presets (scene generation)
- Toolbar tests wrap renders in `NavigationContext` + `SavedElementsContext` + `SettingsContext` providers via `renderToolbar()` helper
- `iframe.sandbox` is not a DOMTokenList in jsdom — tests mock it via `document.createElement` spy
- `fetchPageHtml` tests need `vi.stubGlobal("fetch", ...)` and response bodies >100 chars (the function rejects short proxy responses)

## Validation & Debugging

- **Always validate visually** after changes to SnapshotPageView, domSnapshot, or siteStyles. Use Chrome DevTools MCP to take screenshots and evaluate JS in the running app at `http://localhost:5173`.
- **Use `evaluate_script`** to inspect iframe state: count candidates (`[data-domino-id]`), check physics clones, verify CSS rules, measure element depths, and trace auto-selection logic.
- **Test with multiple sites**: NYTimes and Wikipedia are the two built-in WEBSITE_PRESETS. Always check both after changes to the snapshot pipeline or element selection — fixes for one site frequently regress the other.
- **Auto-selection pitfalls**: Auto-selection state resets on `pageId` change. The auto-selection has several filters (inline skip, float-anchor skip, gallery/thumb skip, size limits, parent containment, cap) — trace through each when elements aren't being picked.
- **JS-loaded CSS**: Some sites (e.g., craigslist) load ALL CSS via JavaScript. Use the `cssLinks` field in site rules (`siteStyles.ts`) to inject CSS files that would normally be loaded by scripts.
- **Loading-state classes**: Classes like `show-curtain`, `opaque`, `loading` are stripped via `replaceClassTokens` in `snapshot/prepare.ts` since they're set by JS that we remove.

## Snapshot Pipeline Pitfalls

When debugging fetched page rendering issues, check these in order:

1. **CSS `url()` rewriting**: External CSS `url(/path)` must resolve against the CSS file's origin, not the page origin (fonts on CDNs like `g1.nyt.com` break otherwise)
2. **Noscript image pattern**: Sites like NYTimes ship `<img>` with no `src` + `opacity:0` (JS fills it), with the real URL only in `<noscript>`. The pipeline promotes src and forces `opacity:1`
3. **DOM depth**: Modern CSS-in-JS sites nest 25-35+ div levels deep. Walker depth limit is 40
4. **Inline media elements**: `<img>` and `<video>` default to `display:inline` — the walker and selectable-candidates filter must exempt media from inline-skip logic
5. **Font propagation**: `@font-face` rules from the iframe must be copied to the parent document for the Pretext text overlay to use the same fonts
6. **Position regex**: `position:fixed/sticky` replacement runs on the full HTML string including `<style>` blocks — this is intentional but aggressive
