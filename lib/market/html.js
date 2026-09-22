/**
 * Dependency-free HTML helpers.
 *
 * Marketplaces change their markup regularly, so extraction is layered:
 * embedded JSON first (stable, machine readable), JSON-LD second, visible
 * text last. Nothing here assumes a specific DOM path.
 */

import { cleanText, safeJsonParse } from "./utils";

/** Strips tags and collapses whitespace. */
export function textContent(html) {
  return cleanText(
    String(html ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

/** Contents of a script tag with the given id, parsed as JSON. */
export function scriptJsonById(html, id) {
  const pattern = new RegExp(
    `<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)</script>`,
    "i",
  );
  const match = String(html ?? "").match(pattern);
  return match ? safeJsonParse(match[1].trim()) : null;
}

/** Every application/ld+json block on the page, parsed and flattened. */
export function jsonLdBlocks(html) {
  const blocks = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(String(html ?? ""))) !== null) {
    const parsed = safeJsonParse(match[1].trim());
    if (!parsed) continue;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      blocks.push(item);
      if (Array.isArray(item["@graph"])) blocks.push(...item["@graph"]);
    }
  }

  return blocks;
}

/** First JSON-LD block whose @type matches one of `types`. */
export function jsonLdOfType(html, types) {
  const wanted = types.map((type) => type.toLowerCase());
  return (
    jsonLdBlocks(html).find((block) => {
      const type = block["@type"];
      const list = Array.isArray(type) ? type : [type];
      return list.some(
        (entry) => entry && wanted.includes(String(entry).toLowerCase()),
      );
    }) || null
  );
}

/**
 * Assignments like `window.__X__ = {...};` or `self.__NUXT__=(function(){...`.
 * Returns the parsed object when the payload is plain JSON.
 */
export function inlineStateJson(html, variableNames) {
  const source = String(html ?? "");

  for (const name of variableNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*;`, "i");
    const match = source.match(pattern);
    if (!match) continue;
    const parsed = safeJsonParse(match[1]);
    if (parsed) return parsed;
  }

  return null;
}

/** Content of the first matching meta tag. */
export function metaContent(html, names) {
  const source = String(html ?? "");

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]*(?:property|name|itemprop)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) return cleanText(match[1]);
    }
  }

  return null;
}

/**
 * Kleinanzeigen-style definition lists:
 *   <li class="addetailslist--detail">Kilometerstand
 *      <span class="addetailslist--detail--value">120.000 km</span></li>
 * Returns a lowercase-keyed map of label -> value.
 */
export function detailPairs(html) {
  const pairs = {};
  const source = String(html ?? "");

  const listPattern =
    /<li[^>]*class=["'][^"']*addetailslist--detail[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = listPattern.exec(source)) !== null) {
    const block = match[1];
    const valueMatch = block.match(
      /<span[^>]*addetailslist--detail--value[^>]*>([\s\S]*?)<\/span>/i,
    );
    if (!valueMatch) continue;
    const label = textContent(block.replace(valueMatch[0], "")).toLowerCase();
    const value = textContent(valueMatch[1]);
    if (label && value) pairs[label] = value;
  }

  // Generic <dt>/<dd> pairs, used by several detail pages.
  const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  while ((match = dlPattern.exec(source)) !== null) {
    const label = textContent(match[1]).toLowerCase();
    const value = textContent(match[2]);
    if (label && value && !pairs[label]) pairs[label] = value;
  }

  return pairs;
}

/** Looks up a detail map by any of several German labels. */
export function detailValue(pairs, labels) {
  for (const label of labels) {
    const needle = label.toLowerCase();
    for (const [key, value] of Object.entries(pairs)) {
      if (key.includes(needle)) return value;
    }
  }
  return null;
}

/**
 * Harvests every JSON payload in the document: `<script type="application/json">`,
 * scripts carrying an id, JSON-LD, and `window.X = {...}` assignments.
 *
 * Portals rename their state blobs regularly, so we collect whatever is there
 * and let the caller look for a node that resembles a listing. This is what
 * keeps extraction working after a redesign.
 */
export function allEmbeddedJson(html, { maxBlocks = 40, maxBytes = 3_000_000 } = {}) {
  const source = String(html ?? "").slice(0, maxBytes);
  const found = [];

  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptPattern.exec(source)) !== null && found.length < maxBlocks) {
    const attributes = match[1] || "";
    const content = match[2].trim();
    if (content.length < 40) continue;

    const isJsonType = /type=["'](application\/(ld\+)?json|application\/json)["']/i.test(
      attributes,
    );
    const hasId = /\bid=["'][^"']+["']/i.test(attributes);

    if (isJsonType || hasId) {
      const parsed = safeJsonParse(content);
      if (parsed && typeof parsed === "object") {
        found.push(parsed);
        continue;
      }
    }

    // `window.__X__ = {...};` / `self.__NUXT__ = {...}` inside a plain script.
    const assignment = content.match(
      /(?:window|self|globalThis)\.[A-Za-z0-9_$]+\s*=\s*(\{[\s\S]*?\})\s*[;\n]/,
    );
    if (assignment) {
      const parsed = safeJsonParse(assignment[1]);
      if (parsed && typeof parsed === "object") found.push(parsed);
    }
  }

  return found;
}

/**
 * Reads "Label … value" out of the page's visible text — the last line of
 * defence, and the most durable one, because the German labels on these
 * portals outlive every markup change.
 *
 * @param {string} text    plain text of the page
 * @param {string[]} labels  e.g. ["Erstzulassung", "EZ"]
 * @param {RegExp} valuePattern  capturing group 1 is the value
 * @param {number} window  how far after the label to look
 */
export function extractLabelled(text, labels, valuePattern, window = 60) {
  const haystack = String(text ?? "");

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const labelPattern = new RegExp(escaped, "gi");
    let hit;

    while ((hit = labelPattern.exec(haystack)) !== null) {
      const slice = haystack.slice(hit.index + hit[0].length, hit.index + hit[0].length + window);
      const value = slice.match(valuePattern);
      if (value) return value[1] ?? value[0];
    }
  }

  return null;
}

/** All hrefs on the page matching a pattern, absolute-ised against `base`. */
export function hrefs(html, pattern, base) {
  const found = new Set();
  const linkPattern = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkPattern.exec(String(html ?? ""))) !== null) {
    const raw = match[1].replace(/&amp;/g, "&");
    if (!pattern.test(raw)) continue;
    try {
      found.add(new URL(raw, base).toString());
    } catch {
      /* skip malformed hrefs */
    }
  }

  return [...found];
}

/* ------------------------------------------------------------- equipment */

const EQUIPMENT_KEYS =
  /^(features|featureList|featureItems|equipment|equipments|equipmentList|ausstattung|ausstattungsmerkmale|extras|options|optionalEquipment)$/i;

function equipmentLabel(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;
  const value = item.label ?? item.name ?? item.displayName ?? item.text ?? item.title ?? item.value ?? item.id;
  return typeof value === "string" ? value : null;
}

/** Walks a parsed JSON blob and hands every key/value pair to `visit`. */
function walkJson(node, visit, depth = 0) {
  if (!node || typeof node !== "object" || depth > 14) return;
  if (Array.isArray(node)) {
    for (const entry of node) walkJson(entry, visit, depth + 1);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    visit(key, value);
    walkJson(value, visit, depth + 1);
  }
}

/**
 * Equipment lists wherever a page keeps them.
 *
 *   1. arrays called features / equipment / ausstattung in embedded JSON —
 *      including the grouped form { comfort: [...], safety: [...] }
 *   2. otherwise the list entries under an "Ausstattung" heading in the markup
 *
 * Portal codes like "NAVIGATION_SYSTEM" come back as "NAVIGATION SYSTEM";
 * equipment.js understands both wordings.
 *
 * @returns {string[]} de-duplicated labels, as the portal wrote them
 */
export function equipmentFromHtml(html, { blobs = null } = {}) {
  const found = [];

  const take = (list) => {
    for (const item of list) {
      const label = equipmentLabel(item);
      if (!label) continue;
      const clean = cleanText(label.replace(/_/g, " "));
      if (clean.length >= 2 && clean.length <= 80) found.push(clean);
    }
  };

  for (const blob of blobs || allEmbeddedJson(html)) {
    walkJson(blob, (key, value) => {
      if (!EQUIPMENT_KEYS.test(key)) return;
      if (Array.isArray(value)) take(value);
      else if (value && typeof value === "object") {
        for (const group of Object.values(value)) {
          if (Array.isArray(group)) take(group);
        }
      }
    });
  }

  if (found.length < 3) {
    const source = String(html ?? "");
    const heading = source.search(/>\s*(Sonder)?ausstattung(smerkmale)?\s*</i);

    if (heading >= 0) {
      let section = source.slice(heading, heading + 20_000);
      // Stop at the next heading, so "Fahrzeugbeschreibung" or "Ähnliche
      // Fahrzeuge" below the list are not read as equipment.
      // Skip past the heading's own closing tag before looking for the next one.
      const skip = Math.max(20, section.search(/<\/h[1-6]>/i) + 5);
      const next = section.slice(skip).search(/<h[1-4][\s>]/i);
      if (next >= 0) section = section.slice(0, next + skip);

      const itemPattern = /<li[^>]*>([\s\S]{0,300}?)<\/li>/gi;
      let hit;
      while ((hit = itemPattern.exec(section)) !== null) {
        const label = textContent(hit[1]);
        if (label.length >= 2 && label.length <= 80) found.push(label);
      }
    }
  }

  return [...new Set(found)];
}

/**
 * The photo gallery out of embedded JSON: the first array named images /
 * gallery whose entries point at `hostPattern`. The ad's own gallery comes
 * first in every portal's state; "similar vehicles" come later.
 */
export function galleryFromJson(html, hostPattern, { blobs = null, limit = 12 } = {}) {
  for (const blob of blobs || allEmbeddedJson(html)) {
    let gallery = null;

    walkJson(blob, (key, value) => {
      if (gallery || !/^(images|galleryImages|gallery|pictures|photos)$/i.test(key)) return;
      if (!Array.isArray(value) || !value.length) return;

      const urls = value
        .map((entry) =>
          typeof entry === "string"
            ? entry
            : entry?.uri ?? entry?.url ?? entry?.src ?? entry?.ref ?? entry?.large ?? null,
        )
        .filter((url) => typeof url === "string")
        .map((url) => (url.startsWith("//") ? `https:${url}` : url))
        .filter((url) => hostPattern.test(url));

      if (urls.length) gallery = urls;
    });

    if (gallery) return [...new Set(gallery)].slice(0, limit);
  }
  return [];
}
