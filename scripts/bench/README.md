# Website-mode benchmark

`bench.mjs` drives the real client pipeline for website mode (fetch → prepare →
iframe → scanner → auto-select → physics clones) with Playwright, throws the
bodies around, and records frame timing over a fixed window.

`/api/fetch-page` is intercepted, so runs are deterministic and don't depend on
the proxy or the network (except image loads on the Wikipedia fixture).

Scenarios:

- `wiki`: `public/test-wiki-rendered.html` (Wikipedia "Typography", CSS already inlined)
- `news`: a generated news-homepage fixture (48 story cards, inline SVG images)
- `nyt`: a saved nytimes.com homepage, passed with `--nyt path/to/nyt.html`

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
