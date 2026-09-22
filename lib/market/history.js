/**
 * An ad's price over time, from the database.
 *
 * Server-only. Kept out of analyze.js on purpose: the analysis must work with
 * the database down, so history is loaded and stored around it by the route,
 * each step with a short time limit and no way to fail the request.
 */

import { connectDB } from "@/lib/mongodb";
import MarketAnalysis from "@/models/MarketAnalysis";
import PriceObservation from "@/models/PriceObservation";

const TIME_LIMIT_MS = 2_500;
const SAME_DAY_MS = 20 * 60 * 60 * 1000;

function withinTime(promise, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), TIME_LIMIT_MS);
    }),
  ])
    .catch(() => fallback)
    .finally(() => clearTimeout(timer));
}

/**
 * Earlier prices for this ad, oldest first. Saved evaluations count as
 * sightings too, so cars saved before tracking began still have a history.
 *
 * @returns {Promise<Array<{price:number, observedAt:string}>>}
 */
export async function loadObservations(listingUrl) {
  if (!listingUrl) return [];

  return withinTime(
    (async () => {
      await connectDB();

      const [observations, saved] = await Promise.all([
        PriceObservation.find({ listingUrl }, "price observedAt")
          .sort({ observedAt: 1 })
          .limit(60)
          .lean(),
        MarketAnalysis.findOne({ listingUrl }, "listPrice analyzedAt").lean(),
      ]);

      const points = observations.map((entry) => ({
        price: entry.price,
        observedAt: new Date(entry.observedAt).toISOString(),
      }));

      if (saved?.listPrice && saved?.analyzedAt) {
        points.push({
          price: saved.listPrice,
          observedAt: new Date(saved.analyzedAt).toISOString(),
        });
      }

      return points
        .filter((point) => Number.isFinite(point.price))
        .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    })(),
    [],
  );
}

/** Records today's price, unless the same price was already seen today. */
export async function recordObservation({ listingUrl, price, source }) {
  if (!listingUrl || !Number.isFinite(price)) return;

  await withinTime(
    (async () => {
      await connectDB();

      const last = await PriceObservation.findOne({ listingUrl })
        .sort({ observedAt: -1 })
        .lean();

      const recent = last && Date.now() - new Date(last.observedAt).getTime() < SAME_DAY_MS;
      if (recent && last.price === price) return;

      await PriceObservation.create({ listingUrl, price, source: source || "" });
    })(),
    undefined,
  );
}
