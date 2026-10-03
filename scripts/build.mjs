import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { format } from "prettier";
import { SITE_CONFIG as cfg } from "../js/config.js";
import { shell, home, about, projectPage, notFound } from "./pages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: {
    base: { type: "string" },
    url: { type: "string" },
    "out-dir": { type: "string" },
    check: { type: "boolean" },
  },
});
const settings = JSON.parse(
  await readFile(resolve(root, "site.config.json"), "utf8"),
);
const rawBase = values.base ?? settings.basePath;
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(rawBase))
  throw new Error(
    "Base must be / or a slash-delimited path such as /portfolio/.",
  );
const base = rawBase;
const siteURL = values.url ?? settings.url;
if (siteURL && !/^https?:\/\//.test(siteURL))
  throw new Error("Site URL must be an absolute HTTP(S) URL.");
const output = resolve(root, values["out-dir"] || ".");
const manifest = JSON.parse(
  await readFile(resolve(root, "assets/images/manifest.json"), "utf8"),
);
const slugs = new Set();
for (const p of cfg.projects) {
  if (!/^[a-z0-9-]+$/.test(p.slug) || slugs.has(p.slug))
    throw new Error(`Invalid or duplicate slug: ${p.slug}`);
  slugs.add(p.slug);
  const ids = new Set(p.architecture.nodes.map((node) => node.id));
  if (ids.size !== 4)
    throw new Error(
      `${p.slug}: the diagram layout requires four unique nodes.`,
    );
  for (const [from, to] of p.architecture.edges)
    if (!ids.has(from) || !ids.has(to) || from === to)
      throw new Error(`${p.slug}: invalid edge`);
  for (const flow of p.architecture.flows) {
    if (!flow.steps.length || flow.steps.some((id) => !ids.has(id)))
      throw new Error(`${p.slug}: invalid flow`);
    for (let i = 1; i < flow.steps.length; i++) {
      const a = flow.steps[i - 1],
        b = flow.steps[i];
      if (
        !p.architecture.edges.some(
          ([from, to]) => (from === a && to === b) || (from === b && to === a),
        )
      )
        throw new Error(`${p.slug}: flow traverses an undocumented edge`);
    }
  }
}
const pages = [
  {
    path: "index.html",
    root: "",
    title: "Pratham Pandey — Student, builder, maker of apps",
    description:
      "Pratham Pandey is a first-semester BCom student and multidisciplinary builder creating apps, backends, videos, and business models.",
    body: home(manifest),
    script: "home",
  },
  {
    path: "about/index.html",
    root: "../",
    title: "About — Pratham Pandey",
    description:
      "About Pratham Pandey, a BCom student and multidisciplinary builder.",
    body: about(manifest),
  },
  ...cfg.projects.map((p, i) => ({
    path: `projects/${p.slug}/index.html`,
    root: "../../",
    title: `${p.name} — Pratham Pandey`,
    description: p.overview,
    body: projectPage(p, cfg.projects[(i + 1) % cfg.projects.length], manifest),
    theme: p.slug,
    script: "project",
  })),
  {
    path: "404.html",
    root: base,
    title: "Page not found — Pratham Pandey",
    description: "Find your way back to Pratham Pandey's portfolio.",
    body: notFound(base),
  },
];
let stale = false;
for (const page of pages) {
  const canonical =
    siteURL && page.path !== "404.html"
      ? new URL(page.path, `${siteURL.replace(/\/$/, "")}/`).href
      : "";
  const socialImage = siteURL
    ? new URL("assets/images/pratham-1.jpg", `${siteURL.replace(/\/$/, "")}/`)
        .href
    : "";
  const html = await format(shell({ ...page, canonical, socialImage }), {
    parser: "html",
  });
  const target = resolve(output, page.path);
  if (values.check) {
    if ((await readFile(target, "utf8").catch(() => "")) !== html) {
      console.error(`Stale generated page: ${relative(root, target)}`);
      stale = true;
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
  }
}
if (stale) process.exitCode = 1;
if (!values.check && output !== root.replace(/\/$/, "")) {
  for (const dir of ["assets", "css", "js"])
    await cp(resolve(root, dir), resolve(output, dir), { recursive: true });
  await writeFile(resolve(output, ".nojekyll"), "");
}
console.log(
  `${values.check ? "Checked" : "Generated"} ${pages.length} pages (404 base: ${base}).`,
);
