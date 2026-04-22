#!/usr/bin/env python3
"""Stage demo assets from benchmark_local7 results into demo_page/assets/.

Re-run this after editing tasks.json.

Usage:
  python3 collect_assets.py              # copy files (default)
  python3 collect_assets.py --symlink    # symlink instead
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path


def stage(src: Path, dst: Path, mode: str) -> bool:
    if not src.is_file():
        print(f"  MISSING  {src}")
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() or dst.is_symlink():
        dst.unlink()
    if mode == "symlink":
        os.symlink(src, dst)
    else:
        shutil.copyfile(src, dst)
    print(f"  staged   {dst.name}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--symlink", action="store_true",
                        help="symlink instead of copying (not for GitHub Pages)")
    args = parser.parse_args()
    mode = "symlink" if args.symlink else "copy"

    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    tasks_json = script_dir / "tasks.json"
    videos_dir = script_dir / "assets" / "videos"

    video_src_dir = root_dir / "videos"
    results_root = root_dir / "benchmark_local7" / "results"

    if not tasks_json.is_file():
        print(f"tasks.json not found at {tasks_json}", file=sys.stderr)
        return 1

    cfg = json.loads(tasks_json.read_text())
    methods = [cfg["methods"]["ours"], *cfg["methods"]["baselines"]]
    tasks = cfg["tasks"]

    print(f"Staging assets into {videos_dir} (mode: {mode})")
    for i, t in enumerate(tasks, 1):
        stem = t["video_stem"]
        slug = t["target_slug"]
        version = t["results_version"]
        print(f"\n[task {i}/{len(tasks)}] {stem} -> {slug} ({version})")

        stage(
            video_src_dir / f"{stem}.mp4",
            videos_dir / "input" / f"{stem}.mp4",
            mode,
        )
        for m in methods:
            mdir = m["results_dir"]
            src = results_root / version / mdir / stem / "wrong" / f"{stem}_{slug}.mp4"
            dst = videos_dir / version / mdir / f"{stem}__{slug}.mp4"
            stage(src, dst, mode)

    print(
        "\nDone. Serve locally with:\n"
        f"  cd {script_dir} && python3 -m http.server 8000\n"
        "Then open http://localhost:8000/"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
