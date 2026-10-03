import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "4173" },
    dir: { type: "string", default: "." },
    base: { type: "string", default: "/" },
  },
});
const root = resolve(values.dir);
const base = values.base;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let path = resolve(
      root,
      pathname.startsWith(base)
        ? pathname.slice(base.length)
        : "__outside_base__",
    );
    if (path !== root && !path.startsWith(`${root}${sep}`))
      throw new Error("Outside document root");
    if ((await stat(path).catch(() => null))?.isDirectory())
      path = resolve(path, "index.html");
    let status = 200;
    let body;
    try {
      body = await readFile(path);
    } catch {
      path = resolve(root, "404.html");
      body = await readFile(path);
      status = 404;
    }
    response.writeHead(status, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
  }
}).listen(Number(values.port), "127.0.0.1", () =>
  console.log(`Preview: http://127.0.0.1:${values.port}${base}`),
);
