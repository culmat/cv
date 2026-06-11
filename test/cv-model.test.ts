import { describe, expect, test } from "bun:test";

import {
  buildVCard,
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

describe("buildVCard", () => {
  const site = {
    name: "Matthias Cullmann",
    email: "matthias.cullmann@gmail.com",
    website: "https://culmat.github.io/cv/",
    contact: {
      phone: "+41 79 699 1500",
      address: { street: "Beim Wasserturm 10", postalCode: "4059", city: "Basel", country: "Switzerland" },
      birthday: "",
    },
  };
  const social = [{ title: "GitHub", url: "https://github.com/culmat" }];
  const role = { title: "Senior AI Consultant", organization: "Helvetia, Basel" };

  test("wraps a valid vCard 3.0 with the core fields", () => {
    const card = buildVCard({ site, social, role });
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(card.endsWith("END:VCARD")).toBe(true);
    expect(card).toContain("FN:Matthias Cullmann");
    expect(card).toContain("N:Cullmann;Matthias;;;");
    expect(card).toContain("EMAIL;TYPE=INTERNET:matthias.cullmann@gmail.com");
    expect(card).toContain("TEL;TYPE=CELL:+41 79 699 1500");
    expect(card).toContain("ADR;TYPE=HOME:;;Beim Wasserturm 10;Basel;;4059;Switzerland");
    expect(card).toContain("URL:https://culmat.github.io/cv/");
  });

  test("escapes the organization name and labels social profiles", () => {
    const card = buildVCard({ site, social, role });
    expect(card).toContain("ORG:Helvetia\\, Basel");
    expect(card).toContain("TITLE:Senior AI Consultant");
    expect(card).toContain("item1.URL:https://github.com/culmat");
    expect(card).toContain("item1.X-ABLabel:GitHub");
  });

  test("omits BDAY when no birthday is set", () => {
    const card = buildVCard({ site, social, role });
    expect(card).not.toContain("BDAY:");
  });

  test("includes BDAY when a birthday is provided", () => {
    const withBday = { ...site, contact: { ...site.contact, birthday: "1980-07-15" } };
    const card = buildVCard({ site: withBday, social, role });
    expect(card).toContain("BDAY:1980-07-15");
  });
});
