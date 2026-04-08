const WHITESPACE = /\s+/g;
const NON_WORD = /[^a-z0-9-]/g;
const DASHES = /-+/g;

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(WHITESPACE, "-")
    .replace(NON_WORD, "")
    .replace(DASHES, "-");
}

export function formatPeriod(start, end) {
  const startLabel = String(start || "").trim();
  const endLabel = String(end || "").trim();

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel || endLabel;
}

export function normalizeSocialLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .filter((link) => link && link.title && link.url)
    .map((link) => {
      if (link.image_url) {
        return {
          title: link.title,
          url: link.url,
          imageUrl: link.image_url,
          kind: "image",
        };
      }

      return {
        title: link.title,
        url: link.url,
        icon: link.icon || "fas fa-link",
        kind: "icon",
      };
    });
}
