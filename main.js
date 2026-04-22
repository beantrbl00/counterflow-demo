// Demo page renderer. Reads tasks.json and builds the DOM.
// Video assets live under assets/videos/ and are staged by collect_assets.sh.

async function loadConfig() {
  const res = await fetch("tasks.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load tasks.json (${res.status})`);
  return res.json();
}

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.html != null) node.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(c);
  }
  return node;
}

// Mirrors collect_assets.sh layout:
//   assets/videos/input/<video_stem>.mp4
//   assets/videos/<results_version>/<method_dir>/<video_stem>__<target_slug>.mp4
function inputVideoPath(task) {
  return `assets/videos/input/${task.video_stem}.mp4`;
}
function methodVideoPath(task, methodDir) {
  return `assets/videos/${task.results_version}/${methodDir}/${task.video_stem}__${task.target_slug}.mp4`;
}

function renderFigure(site) {
  const root = document.getElementById("figure-section");
  if (!site.main_figure) return;
  const img = el("img", {
    attrs: { src: site.main_figure, alt: "Main figure" },
  });
  img.addEventListener("error", () => {
    img.replaceWith(
      el("div", {
        class: "missing",
        text: `Main figure not found at ${site.main_figure}`,
      })
    );
  });
  root.appendChild(img);
  if (site.main_figure_caption) {
    root.appendChild(el("div", { class: "figure-caption", text: site.main_figure_caption }));
  }
}

function renderTitle(site) {
  const root = document.getElementById("title-section");
  root.appendChild(el("h1", { text: site.title }));
  if (site.authors) root.appendChild(el("div", { class: "authors", text: site.authors }));
  if (site.venue) root.appendChild(el("div", { class: "venue", text: site.venue }));
  document.title = site.short_title || site.title;
}

function renderAbstract(site) {
  document.getElementById("abstract-text").textContent = site.abstract || "";
}

function videoCell(label, src, extraClass = "") {
  const wrap = el("div", { class: `video-cell ${extraClass}` });
  wrap.appendChild(el("div", { class: "cell-label", text: label }));

  const video = el("video", {
    attrs: {
      controls: "",
      preload: "metadata",
      playsinline: "",
      src: src,
    },
  });
  video.addEventListener("error", () => {
    video.replaceWith(el("div", { class: "missing", text: "video not available" }));
  });
  wrap.appendChild(video);
  return wrap;
}

function renderTask(task, methods) {
  const card = el("div", { class: "task-card" });

  const header = el("div", { class: "task-header" });
  header.appendChild(el("div", { class: "video-stem", text: task.video_stem }));
  const prompts = el("div", { class: "prompt-row" });
  prompts.innerHTML =
    `<span class="src-prompt">${task.source_prompt}</span>` +
    `<span class="arrow">→</span>` +
    `<span class="tgt-prompt">${task.target_prompt}</span>`;
  header.appendChild(prompts);
  card.appendChild(header);

  const grid = el("div", { class: "video-grid" });

  // Ours (left, highlighted)
  grid.appendChild(
    videoCell(methods.ours.label, methodVideoPath(task, methods.ours.results_dir), "ours")
  );

  // Baselines (right)
  for (const b of methods.baselines) {
    grid.appendChild(videoCell(b.label, methodVideoPath(task, b.results_dir)));
  }

  card.appendChild(grid);
  return card;
}

function renderDemos(cfg) {
  const root = document.getElementById("task-list");
  root.innerHTML = "";

  // Group tasks by section while preserving order of first appearance.
  const sections = [];
  const byName = new Map();
  for (const t of cfg.tasks) {
    const key = t.section || "Demos";
    if (!byName.has(key)) {
      const s = { name: key, items: [] };
      byName.set(key, s);
      sections.push(s);
    }
    byName.get(key).items.push(t);
  }

  for (const section of sections) {
    root.appendChild(el("div", { class: "section-heading", text: section.name }));
    for (const task of section.items) {
      root.appendChild(renderTask(task, cfg.methods));
    }
  }
}

(async function main() {
  try {
    const cfg = await loadConfig();
    renderTitle(cfg.site);
    renderFigure(cfg.site);
    renderAbstract(cfg.site);
    renderDemos(cfg);
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `<pre style="padding:24px;color:#c0392b;">${err.stack || err}</pre>`;
  }
})();
