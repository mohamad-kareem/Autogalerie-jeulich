/** Reads the rendered results in the tab's isolated world. */
export function readSearchCards(limit) {
  const body = document.body?.innerText || "";
  const heading = document.querySelector("h1")?.innerText || "";
  if (/zugriff verweigert|access denied|captcha|too many requests|zu viele anfragen|just a moment|sicherheitsüberprüfung|are you (?:a )?human/i.test(
    [document.title, heading, body.slice(0, 1500)].join(" "),
  )) {
    return { status: "blocked", cards: [] };
  }

  const detailLinks = 'a[href*="/fahrzeuge/details"], a[href*="/auto-inserat/"]';
  const adIds = '[data-ad-id], [data-adid], [data-listing-id]';
  const cardSelector = '[data-testid="result-list-entry"], [data-testid="search-result"], article';
  const readId = (link) => {
    const dataId = link.getAttribute("data-ad-id") || link.getAttribute("data-adid") || link.getAttribute("data-listing-id");
    if (/^\d{3,}$/.test(dataId || "")) return dataId;
    try {
      const url = new URL(link.href);
      if (!["suchen.mobile.de", "www.mobile.de", "mobile.de", "m.mobile.de"].includes(url.hostname)) return null;
      const id = url.searchParams.get("id") || url.pathname.match(/\/(\d{3,})(?:\.html)?\/?$/)?.[1];
      return /^\d{3,}$/.test(id || "") ? id : null;
    } catch {
      return null;
    }
  };
  const cards = new Map();
  for (const link of document.querySelectorAll(`${detailLinks}, ${adIds}`)) {
    const id = readId(link);
    if (!id || cards.has(id)) continue;
    const container = link.closest(cardSelector);
    let element = link;
    for (let depth = 0; element && depth < 8; depth += 1) {
      // Never combine one ad's title with a neighbouring ad's price.
      if ([...element.querySelectorAll(`${detailLinks}, ${adIds}`)].some((other) => {
        const otherId = readId(other);
        return otherId && otherId !== id;
      })) break;
      const text = element.innerText?.trim() || "";
      const titleSelector = 'h2, h3, [role="heading"], [data-testid="ad-title"]';
      const title = (element.matches(titleSelector) ? element : element.querySelector(titleSelector))?.innerText?.trim();
      if (title && text.length <= 2_500 && /€/.test(text) &&
        /\b\d{1,2}\/\d{4}\b/.test(text) && /\b\d[\d.\s]*\s*km\b/i.test(text)) {
        cards.set(id, {
          url: `https://suchen.mobile.de/fahrzeuge/details.html?id=${id}`,
          title: title.slice(0, 250),
          text,
        });
        break;
      }
      if (element === container) break;
      element = element.parentElement;
    }
    if (cards.size >= limit) break;
  }

  return {
    status: cards.size || /keine (?:passenden )?(?:angebote|treffer)|\b0 angebote\b/i.test(body) ? "ok" : "unavailable",
    cards: [...cards.values()],
  };
}
