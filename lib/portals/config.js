/**
 * Settings for reading the portals. Environment variables keep their old
 * names so the existing Vercel configuration keeps working.
 */

export const POLICY = Object.freeze({
  // A single page/API request.
  requestTimeoutMs: 12_000,
  requestRetries: 2,
});

/**
 * Optional scraping proxy. Set MARKET_FETCH_PROXY to a template containing
 * {url} (it is inserted URL-encoded), e.g.
 *   https://api.scraperapi.com/?api_key=XYZ&country_code=de&url={url}
 * When unset, pages are fetched directly.
 */
export const FETCH_PROXY_TEMPLATE = process.env.MARKET_FETCH_PROXY || "";

/** Same account as the Seller API (lib/mobile.js); used for the Search API. */
export const MOBILE_CREDENTIALS = {
  get username() {
    return process.env.MOBILEDE_USERNAME || "";
  },
  get password() {
    return process.env.MOBILEDE_PASSWORD || "";
  },
  get enabled() {
    return Boolean(
      process.env.MOBILEDE_USERNAME && process.env.MOBILEDE_PASSWORD,
    );
  },
};
