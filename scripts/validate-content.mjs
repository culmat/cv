import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CONTENT_ROOT = resolve(ROOT, "src/content");
const EXPERIENCE_ROOT = resolve(CONTENT_ROOT, "experience");

const requiredFiles = ["about.md", "community.md", "education.md", "contact.md"];
const requiredFrontmatter = ["title", "order"];
const requiredExperienceFrontmatter = [
  "title",
  "organization",
  "organizationLink",
  "period",
  "order",
];

async function checkFile(path) {
  await access(path);
  const text = await readFile(path, "utf8");
  return matter(text);
}

async function main() {
  const errors = [];

  for (const fileName of requiredFiles) {
    const path = resolve(CONTENT_ROOT, fileName);

    try {
      const parsed = await checkFile(path);

      for (const field of requiredFrontmatter) {
        if (!(field in parsed.data)) {
          errors.push(`${fileName}: missing frontmatter '${field}'`);
        }
      }
    } catch {
      errors.push(`${fileName}: missing required file`);
    }
  }

  try {
    const entries = await readdir(EXPERIENCE_ROOT);
    const files = entries.filter((name) => name.endsWith(".md"));

    if (files.length === 0) {
      errors.push("experience: no markdown entries found");
    }

    for (const fileName of files) {
      const path = resolve(EXPERIENCE_ROOT, fileName);
      const parsed = await checkFile(path);

      for (const field of requiredExperienceFrontmatter) {
        if (!(field in parsed.data)) {
          errors.push(`${fileName}: missing frontmatter '${field}'`);
        }
      }
    }
  } catch {
    errors.push("experience: directory missing");
  }

  if (errors.length > 0) {
    process.stderr.write(`Content validation failed:\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }

  process.stdout.write("Validation passed\n");
}

main();
