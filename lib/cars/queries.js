/**
 * Gebrauchtwagen — reading the stock for the website (server only).
 *
 * The pages read the database directly, so every car page arrives with its
 * content (Google, link previews) instead of loading it in the browser.
 */

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

/** Mongo documents → plain JSON the pages can pass to the browser. */
function plain(doc) {
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
}

/** Everything the list, the filters and the comparison need — not the long text. */
const LIST_FIELDS = [
  "make",
  "model",
  "modelDescription",
  "firstRegistration",
  "mileage",
  "power",
  "fuel",
  "gearbox",
  "category",
  "price",
  "priceValue",
  "images",
  "sold",
  "newHuAu",
  "fullServiceHistory",
  "navigationSystem",
  "panoramicGlassRoof",
  "parkingAssistants",
  "electricHeatedSeats",
  "headUpDisplay",
  "keylessEntry",
  "createdAt",
  "mobileCreatedAt",
].join(" ");

export async function listCars() {
  await connectDB();
  const cars = await Car.find({})
    .select(LIST_FIELDS)
    .sort({ mobileCreatedAt: -1, createdAt: -1 })
    .lean();
  // Only the first photos are needed in the list.
  return plain(cars).map((car) => ({ ...car, images: (car.images || []).slice(0, 1) }));
}

export async function getCar(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  return plain(await Car.findById(id).lean());
}
