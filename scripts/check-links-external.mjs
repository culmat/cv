import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

// Hosts that reliably block bots/datacenter probes regardless of headers
// (login walls, aggressive WAFs). Edit freely — matches host or any subdomain.
const IGNORED_HOSTS = ["linkedin.com", "stackoverflow.com", "sourceforge.net"];

const CONCURRENCY = 6;
const TIMEOUT_MS = 10000;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const ATTR_RE = /(?:href|src)\s*=\s*"([^"]*)"/gi;

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function isIgnored(url) {
  const host = url.hostname.toLowerCase();
  return IGNORED_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkHtml(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

// Returns { ok: true } | { ok: false, reason } | { offline: true }
async function probe(url, method) {
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Servers that reject HEAD → retry with GET before judging.
    if (method === "HEAD" && [403, 405, 501].includes(res.status)) {
      return probe(url, "GET");
    }
    if (res.status < 400) return { ok: true };
    if ((res.status === 429 || res.status >= 500) && method !== "GET") {
      return probe(url, "GET");
    }
    return { ok: false, reason: `HTTP ${res.status}` };
  } catch (error) {
    return { networkError: true, reason: error?.name === "TimeoutError" ? "timeout" : "network error" };
  }
}

async function checkUrl(url) {
  const first = await probe(url, "HEAD");
  if (!first.networkError) return first;
  // Retry once on network error / timeout.
  const second = await probe(url, "GET");
  if (!second.networkError) return second;
  return { networkError: true, reason: second.reason };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let index = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const files = await walkHtml(DIST);

  // Collect unique external URLs, tracking referencing files for reporting.
  const refs = new Map(); // url string → Set(file)
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const rel = relative(DIST, file);
    for (const match of html.matchAll(ATTR_RE)) {
      const raw = decodeEntities(match[1].trim());
      if (!/^https?:\/\//i.test(raw)) continue;
      if (!refs.has(raw)) refs.set(raw, new Set());
      refs.get(raw).add(rel);
    }
  }

  const candidates = [];
  let ignored = 0;
  for (const url of refs.keys()) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (isIgnored(parsed)) {
      ignored++;
      process.stdout.write(`  ignored: ${url}\n`);
      continue;
    }
    candidates.push({ url, parsed });
  }

  const results = await runPool(candidates, async ({ url, parsed }) => {
    const result = await checkUrl(parsed);
    return { url, ...result };
  });

  // If every probe failed with a network error, assume we are offline rather
  // than reporting every link as broken (keeps the warn-only pre-push quiet).
  const networkFailures = results.filter((r) => r.networkError);
  if (candidates.length > 0 && networkFailures.length === results.length) {
    process.stdout.write("Skipped external checks (offline)\n");
    process.exit(0);
  }

  const broken = results.filter((r) => !r.ok);
  if (broken.length > 0) {
    const lines = broken.map((r) => {
      const referencedBy = [...refs.get(r.url)].join(", ");
      return `${r.url} → ${r.reason} (referenced by: ${referencedBy})`;
    });
    process.stderr.write(`External link check failed:\n- ${lines.join("\n- ")}\n`);
    process.exit(1);
  }

  process.stdout.write(`External link check passed (${candidates.length} checked, ${ignored} ignored)\n`);
}

main();
