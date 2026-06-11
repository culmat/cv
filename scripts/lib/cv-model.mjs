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

// Escape a single vCard text value per RFC 6350 §3.4: backslash, comma,
// semicolon and newlines are the reserved characters.
function escapeVCardValue(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Build a vCard 3.0 string (broadest device support) from CV data. Pure: no I/O,
// no embedded photo (keeps the QR low-density and scannable). `social` is the
// normalized link list; `role` is the most recent experience entry.
export function buildVCard({ site, social = [], role = {} } = {}) {
  const name = site?.name || "";
  const [firstName = "", ...rest] = name.trim().split(WHITESPACE);
  const lastName = rest.join(" ");

  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`);
  lines.push(`FN:${escapeVCardValue(name)}`);

  if (role?.organization) {
    lines.push(`ORG:${escapeVCardValue(role.organization)}`);
  }
  if (role?.title) {
    lines.push(`TITLE:${escapeVCardValue(role.title)}`);
  }

  if (site?.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(site.email)}`);
  }

  const phone = site?.contact?.phone;
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);
  }

  const address = site?.contact?.address;
  if (address && (address.street || address.city)) {
    // ADR: po-box;extended;street;locality;region;postal-code;country
    const adr = [
      "",
      "",
      address.street || "",
      address.city || "",
      address.region || "",
      address.postalCode || "",
      address.country || "",
    ]
      .map(escapeVCardValue)
      .join(";");
    lines.push(`ADR;TYPE=HOME:${adr}`);
  }

  const birthday = site?.contact?.birthday;
  if (birthday) {
    lines.push(`BDAY:${escapeVCardValue(birthday)}`);
  }

  if (site?.website) {
    lines.push(`URL:${escapeVCardValue(site.website)}`);
  }

  // Each social profile as a labelled URL using Apple's item-grouping syntax:
  // the X-ABLabel shows the service name on Apple devices, and the bare URL
  // still imports everywhere else.
  social.forEach((link, index) => {
    if (!link?.url) return;
    const item = `item${index + 1}`;
    lines.push(`${item}.URL:${escapeVCardValue(link.url)}`);
    if (link.title) {
      lines.push(`${item}.X-ABLabel:${escapeVCardValue(link.title)}`);
    }
  });

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

// Build a schema.org ProfilePage/Person graph (for JSON-LD in the page <head>).
// Pure: no I/O. Optional fields are omitted when absent so the output stays valid
// (no empty strings, no dangling nulls). `imageAbsolute` is the fully-qualified
// image URL; `role` is the most recent experience entry (for `worksFor`).
export function buildJsonLd({ site = {}, social = [], imageAbsolute = "", role = {} } = {}) {
  const contact = site.contact || {};
  const address = contact.address || {};

  const person = {
    "@type": "Person",
    name: site.name,
    url: site.website,
  };

  if (imageAbsolute) person.image = imageAbsolute;
  if (site.description) person.description = site.description;
  if (site.title) {
    person.jobTitle = site.title;
    person.hasOccupation = { "@type": "Occupation", name: site.title };
  }
  if (site.email) person.email = site.email;
  if (contact.phone) person.telephone = contact.phone;

  if (address.street || address.city) {
    person.address = { "@type": "PostalAddress" };
    if (address.street) person.address.streetAddress = address.street;
    if (address.postalCode) person.address.postalCode = address.postalCode;
    if (address.city) person.address.addressLocality = address.city;
    if (address.country) person.address.addressCountry = address.country;
    if (address.geo) {
      person.address.geo = {
        "@type": "GeoCoordinates",
        latitude: address.geo.latitude,
        longitude: address.geo.longitude,
      };
    }
  }

  const sameAs = social.map((link) => link?.url).filter(Boolean);
  if (sameAs.length) person.sameAs = sameAs;

  if (role?.organization) {
    person.worksFor = { "@type": "Organization", name: role.organization };
    if (role.organizationLink) person.worksFor.url = role.organizationLink;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: person,
  };
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
