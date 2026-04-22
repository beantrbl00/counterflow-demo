# CounterFlow Demo Page

A static site that renders side-by-side video comparisons from `benchmark_local7`.

## Layout

```
demo_page/
├── index.html          # page skeleton
├── style.css
├── main.js             # reads tasks.json and renders the page
├── tasks.json          # *** single source of truth for content ***
├── collect_assets.py   # stages videos from benchmark_local7 into assets/
└── assets/
    ├── figure/
    │   └── main_figure.png   # (place your main figure here)
    └── videos/
        ├── input/<video_stem>.mp4
        └── <results_version>/<method_dir>/<video_stem>__<target_slug>.mp4
```

## Changing the demo content

Edit only `tasks.json`. Everything else is data-driven.

- `site.main_figure` — path to the main figure (relative to `demo_page/`)
- `site.title`, `site.abstract`, etc. — textual header
- `methods.ours` — highlighted column on the left
- `methods.baselines` — three baseline columns on the right, in display order
- `tasks[]` — each entry is one demo row:
  - `section` — groups tasks under headings (e.g. "Foley", "Music")
  - `video_stem` — filename stem under `videos/` (e.g. `cat_1`)
  - `source_prompt` / `target_prompt` — displayed labels
  - `target_slug` — the suffix used in generated filenames (e.g. `lion_roaring`)
  - `results_version` — which run to pull from (e.g. `local7_v2`, `local7_v3`)

After editing `tasks.json`, re-run:

```bash
python3 collect_assets.py            # copies files into assets/videos/
# or
python3 collect_assets.py --symlink  # symlink instead (not for GitHub Pages)
```

The script expects:
- silent inputs at `/home/lgbin81/prompt_switch/videos/<video_stem>.mp4`
- generated videos at `/home/lgbin81/prompt_switch/benchmark_local7/results/<results_version>/<method_dir>/<video_stem>/wrong/<video_stem>_<target_slug>.mp4`

Missing files produce a placeholder tile — the page does not crash.

## Previewing locally

```bash
cd demo_page
python3 -m http.server 8000
```

Open http://localhost:8000/.

## Hosting on GitHub Pages

The simplest flow: create a new public repo and push the contents of `demo_page/` to it.

```bash
# from within demo_page/
git init
git add .
git commit -m "Initial demo page"
git branch -M main
git remote add origin git@github.com:<USER>/<REPO>.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`**.

Alternative: keep `demo_page/` inside a larger repo and configure Pages to serve from `/docs`:

```bash
# from repo root
git mv demo_page docs
git commit -m "Move demo to docs/ for GitHub Pages"
```

### A note on video size

GitHub Pages works fine with committed MP4s, but the repo has a soft limit of 1 GB and individual files over 100 MB will be rejected without Git LFS. Current benchmark outputs are ~3 MB per video (5 tasks × 4 methods × ~3 MB + 5 inputs ≈ 75 MB), which is comfortably within limits.

If you add many more tasks, consider:
- `python3 collect_assets.py --symlink` for local preview + host videos on an external CDN, or
- configure [Git LFS](https://git-lfs.github.com/) for the `assets/videos/` folder.
