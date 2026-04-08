import { describe, expect, test } from "bun:test";

import {
  formatPeriod,
  normalizeSocialLinks,
  slugify,
} from "../scripts/lib/cv-model.mjs";

describe("slugify", () => {
  test("creates lowercase slugs from mixed text", () => {
    expect(slugify("Helvetia, Basel")).toBe("helvetia-basel");
  });
});

describe("formatPeriod", () => {
  test("renders start and present end", () => {
    expect(formatPeriod("November 2024", "Present")).toBe("November 2024 - Present");
  });
});

describe("normalizeSocialLinks", () => {
  test("maps codeberg image links and icon links", () => {
    const links = normalizeSocialLinks([
      {
        title: "Codeberg",
        url: "https://codeberg.org/culmat",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Codeberg_Logo.svg",
      },
      {
        title: "Custom",
        url: "https://example.com/custom",
        icon: "fas fa-star",
      },
    ]);

    expect(links).toHaveLength(2);
    expect(links[0].kind).toBe("image");
    expect(links[1].kind).toBe("icon");
  });


});
