import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PRINT_HTML = resolve(ROOT, "dist/print/index.html");
const REPORT_DIR = resolve(ROOT, "dist/.artifacts");
const PDF_OUTPUT = resolve(REPORT_DIR, "cv.pdf");

async function main() {
  await mkdir(REPORT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(PRINT_HTML).toString(), { waitUntil: "networkidle" });
    await page.pdf({ path: PDF_OUTPUT, format: "A4", printBackground: true });
    process.stdout.write(`Print smoke passed: ${PDF_OUTPUT}\n`);
  } finally {
    await browser.close();
  }
}

main();
