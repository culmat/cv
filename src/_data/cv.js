import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";

import { buildVCard, normalizeSocialLinks } from "../../scripts/lib/cv-model.mjs";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CONTENT = resolve(ROOT, "content");
const EXPERIENCE = resolve(CONTENT, "experience");
const markdown = new MarkdownIt({ html: true, linkify: true });

function normalizeSpacingInLinks(markdownText) {
  return markdownText.replace(/\((mailto|tel):([^\)]*?)\)/gi, (_match, scheme, value) => {
    const compact = String(value).replace(/\s+/g, "");
    return `(${scheme}:${compact})`;
  });
}

async function readMarkdown(path) {
  const raw = await readFile(path, "utf8");
  return matter(raw);
}

async function readTextSection(name) {
  const parsed = await readMarkdown(resolve(CONTENT, `${name}.md`));
  const body = parsed.content.trim();
  const normalizedBody = normalizeSpacingInLinks(body);

  return {
    ...parsed.data,
    body: normalizedBody,
    bodyHtml: markdown.render(normalizedBody),
  };
}

async function readExperience() {
  const files = await readdir(EXPERIENCE);
  const markdownFiles = files.filter((entry) => entry.endsWith(".md"));
  const items = [];

  for (const fileName of markdownFiles) {
    const parsed = await readMarkdown(resolve(EXPERIENCE, fileName));
    items.push({
      ...parsed.data,
      body: parsed.content.trim(),
      bodyHtml: markdown.render(parsed.content.trim()),
    });
  }

  return items.sort((a, b) => Number(a.order) - Number(b.order));
}

export default async function () {
  const [site, social, about, community, education, contact, experience] = await Promise.all([
    import("./site.json", { with: { type: "json" } }).then((mod) => mod.default),
    import("./social.json", { with: { type: "json" } }).then((mod) => mod.default),
    readTextSection("about"),
    readTextSection("community"),
    readTextSection("education"),
    readTextSection("contact"),
    readExperience(),
  ]);

  const normalizedSocial = normalizeSocialLinks(social.links);

  return {
    site,
    social: normalizedSocial,
    vcard: buildVCard({ site, social: normalizedSocial, role: experience[0] }),
    sections: {
      about,
      experience,
      community,
      education,
      contact,
    },
  };
}
