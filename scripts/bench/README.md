# Website-mode benchmark

`bench.mjs` drives the real client pipeline for website mode (fetch → prepare →
iframe → scanner → auto-select → physics clones) with Playwright, throws the
bodies around, and records frame timing over a fixed window.

`/api/fetch-page` is intercepted, so runs are deterministic and don't depend on
the proxy. The page HTML comes from the fixture. Linked stylesheets (the saved
NYT page links 23) are fetched once through the app's own proxy and then
replayed from disk, keyed by target URL, so every build under test gets the
same CSS.

Scenarios:

- `wiki`: `public/test-wiki-rendered.html` (Wikipedia "Typography", CSS already inlined)
- `news`: a generated news-homepage fixture (48 story cards, inline SVG images)
- `nyt`: a saved nytimes.com homepage, passed with `--nyt path/to/nyt.html`
  (decompressed HTML; a gzip-encoded save won't parse)

```bash
npm run dev -- --port 5291 --strictPort &
# Playwright isn't a project dependency; point at any install
PLAYWRIGHT_MODULE=/abs/path/node_modules/playwright/index.mjs \
  node scripts/bench/bench.mjs --base http://localhost:5291 --label after --runs 3
# Slow-machine simulation
... --cpu-throttle 4 --label after-cpu4x
```

Results are written to `scripts/bench/results/<label>.json`; a markdown table
of medians is printed to stdout.

External sub-resources (images, stylesheets) are cached on disk under
`$TMPDIR/domino-bench-cache` after the first fetch so network jitter doesn't
leak into load timings. "scanner pass" reads `performance.measure("domino:scan")`,
which older builds don't record (`n/a`).

`nyt-shots.mjs` captures `nyt-after.png` / `nyt-after-physics.png` through the
real proxy (live fetch → Wayback fallback).
