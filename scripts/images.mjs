import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { SITE_CONFIG } from "../js/config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const images = [
  "assets/images/pratham-1.jpg",
  "assets/images/pratham-2.jpg",
  ...SITE_CONFIG.projects.flatMap((project) =>
    project.gallery.filter((item) => item.image).map((item) => item.image),
  ),
];
const manifest = {};
for (const image of images) {
  const input = resolve(root, image);
  const { width, height } = await sharp(input).metadata();
  const widths = image.includes("meme-capsule/") ? [320, 640] : [480, 960];
  const sources = [];
  for (const size of new Set(widths.map((size) => Math.min(size, width)))) {
    const src = image.replace(/\.jpg$/, `-${size}.webp`);
    const info = await sharp(input)
      .rotate()
      .resize({ width: size })
      .webp({ quality: 82, effort: 6 })
      .toFile(resolve(root, src));
    sources.push({
      src,
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
  manifest[image] = {
    width,
    height,
    originalBytes: (await stat(input)).size,
    sources,
  };
}
await writeFile(
  resolve(root, "assets/images/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
const screenshots = Object.entries(manifest).filter(([path]) =>
  path.includes("meme-capsule/"),
);
console.log(
  `Screenshots: ${screenshots.reduce((sum, [, image]) => sum + image.originalBytes, 0)} original bytes → ${screenshots.reduce((sum, [, image]) => sum + image.sources.at(-1).bytes, 0)} bytes at 640px WebP.`,
);
