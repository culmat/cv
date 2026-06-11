import { access, readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

const ATTR_RE = /(?:href|src)\s*=\s*"([^"]*)"/gi;
const ANCHOR_RE = /\b(?:id|name)\s*=\s*"([^"]*)"/gi;
// Schemes / forms that are not local files and are handled elsewhere.
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

// Read pathPrefix from .eleventy.js so it stays a single source of truth.
async function getPathPrefix() {
  const mod = await import(pathToFileURL(resolve(ROOT, ".eleventy.js")).href);
  const stub = new Proxy({}, { get: () => () => {} });
  const config = (typeof mod.default === "function" ? mod.default(stub) : mod.default) || {};
  return (config.pathPrefix || "/").replace(/\/+$/, "");
}

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function collectAnchors(html) {
  const anchors = new Set();
  for (const match of html.matchAll(ANCHOR_RE)) {
    anchors.add(match[1]);
  }
  return anchors;
}

// Map a resolved request path (root-relative, no prefix) to a file on disk.
function toDiskPath(requestPath) {
  if (requestPath.endsWith("/")) {
    return resolve(DIST, `.${requestPath}index.html`);
  }
  if (extname(requestPath) === "") {
    return resolve(DIST, `.${requestPath}/index.html`);
  }
  return resolve(DIST, `.${requestPath}`);
}

async function main() {
  const pathPrefix = await getPathPrefix();
  const files = await walkHtml(DIST);

  // Pass 1: index anchors per file.
  const anchorsByFile = new Map();
  for (const file of files) {
    anchorsByFile.set(file, collectAnchors(await readFile(file, "utf8")));
  }

  // Pass 2: validate every href/src reference.
  const errors = [];
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const rel = relative(DIST, file);

    for (const match of html.matchAll(ATTR_RE)) {
      const raw = decodeEntities(match[1].trim());
      if (!raw || EXTERNAL_RE.test(raw)) {
        continue;
      }

      const [pathAndQuery, fragment] = raw.split("#");
      const pathPart = pathAndQuery.split("?")[0];

      let targetFile;
      if (pathPart === "") {
        // Fragment-only link (e.g. "#section") → same document.
        targetFile = file;
      } else if (pathPart.startsWith("/")) {
        let requestPath = pathPart;
        if (pathPrefix && (requestPath === pathPrefix || requestPath.startsWith(`${pathPrefix}/`))) {
          requestPath = requestPath.slice(pathPrefix.length) || "/";
        }
        targetFile = toDiskPath(requestPath);
      } else {
        targetFile = resolve(dirname(file), pathPart);
        if (pathPart.endsWith("/")) targetFile = resolve(targetFile, "index.html");
        else if (extname(pathPart) === "") targetFile = resolve(targetFile, "index.html");
      }

      try {
        await access(targetFile);
      } catch {
        errors.push(`${rel}: ${raw} → missing target ${relative(DIST, targetFile)}`);
        continue;
      }

      if (fragment && targetFile.endsWith(".html")) {
        const anchors = anchorsByFile.get(targetFile) ?? collectAnchors(await readFile(targetFile, "utf8"));
        if (!anchors.has(fragment)) {
          errors.push(`${rel}: ${raw} → no anchor '#${fragment}' in ${relative(DIST, targetFile)}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`Internal link check failed:\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }

  process.stdout.write(`Link check passed (${files.length} pages scanned)\n`);
}

main();
