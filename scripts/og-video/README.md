# OG video

Records the social preview video (`public/og/dom-ino.mp4`) and poster (`public/og/dom-ino.png`) from the real app.

`record.mjs` loads the Engine preset in headless Chromium through Playwright at 1200×630, 2× DPR. It drives a scripted cursor:

1. Grab the gold orb.
2. Drag it through the headline and down the first column.
3. Fling it into the pink orb.
4. Click the toolbar's Reset button.

The loop runs from one Reset click to the next. Reset puts every body back at its starting position and velocity, so the video wraps exactly as the app does.

Frames are deterministic. `requestAnimationFrame` is replaced with a queue that the script ticks exactly 1/60 s at a time, two ticks per 30 fps frame. CSS transitions and animations are pinned to the same virtual clock. The cursor is drawn into the page, because headless screenshots don't include one. ffmpeg downsamples the 2× screenshots to 1200×630 and encodes H.264 (yuv420p, BT.709, `+faststart`, no audio).

## Usage

Requires ffmpeg on `PATH`. Run on macOS: the Engine preset is set in Iowan Old Style, a macOS system font.

```bash
npm run build                     # repo root: the script serves dist/ with `vite preview`
cd scripts/og-video
npm install
npx playwright install chromium   # first time only
npm run record                    # writes ../../public/og/dom-ino.{mp4,png}
```

Options (all optional):

| Flag                     | Default     | What it does                                                     |
| ------------------------ | ----------- | ---------------------------------------------------------------- |
| `--url <base>`           | —           | Record an already-running server instead of starting `vite preview` |
| `--port <n>`             | `4791`      | Port for the `vite preview` the script starts                    |
| `--out <dir>`            | `public/og` | Output directory (relative to the repo root)                     |
| `--crf <n>`              | `20`        | x264 quality; lower is sharper and bigger                         |
| `--poster-at <s>`        | `2.4`       | Seconds into the loop for the poster frame                        |
| `--frames <dir>`         | temp dir    | Keep the 2× PNG frames (and `orbs.json` positions) in `<dir>`     |
| `--keep-frames`          | off         | Don't delete the temp frame directory                             |
| `--dry`                  | off         | Simulate and log orb positions only (no screenshots, about 1 min) |
| `--swing-y`, `--swing-to`, `--swing-seconds`, `--watch` | see source | Tune the fling and how long the orbs ricochet before Reset |

`--dry` is the fast way to tune the choreography. Physics doesn't depend on the screenshots, so a dry run follows exactly the same trajectories as a full recording.
