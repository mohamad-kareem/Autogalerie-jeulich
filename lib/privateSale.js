// Private contract (TÜV-SÜD-Formular) → the same follow-ups as a normal Kaufvertrag:
// car marked as sold (Fahrzeugverwaltung + website), buyer in Kunden,
// special agreements as notes of the car. Server only.

import CarSchein from "@/models/CarSchein";
import ContactCustomer from "@/models/ContactCustomer";
import { normPhone, normVin } from "@/lib/sales";
import { isoDate } from "@/lib/privateContract";
import { makeVehicleAvailable, markVehicleSold, scheinOf } from "@/lib/kaufvertragServer";

const s = (v) => String(v ?? "").trim();

/**
 * Called after every save. Only acts once a buyer is entered.
 * @returns {Promise<{ scheinId: string, vehicleName: string } | null>}
 */
export async function applyPrivateSale({ doc }) {
  const d = doc.data || {};
  const buyer = d.buyer || {};
  const car = d.car || {};
  if (!s(buyer.name)) return null;

  const vin = normVin(car.vin);
  const name = [s(car.maker), s(car.type)].filter(Boolean).join(" ");
  const date = isoDate(d.dateSeller) || isoDate(d.dateBuyer) || new Date().toISOString().slice(0, 10);

  // buyer → Kunden (once per name + phone)
  const phone = s(buyer.phone);
  const existing = await ContactCustomer.find({ customerName: s(buyer.name) }).select("phone").lean();
  if (!existing.some((c) => normPhone(c.phone) === normPhone(phone))) {
    await ContactCustomer.create({
      customerName: s(buyer.name),
      phone,
      email: "",
      street: s(buyer.street),
      postalCode: s(buyer.zip),
      city: s(buyer.city),
      carName: name,
      vin,
      firstRegistration: s(car.firstRegistration),
      source: "kaufvertrag",
    }).catch(() => null);
  }

  if (!vin) return null;

  // Fahrzeugverwaltung: sold (creates the entry when the car is not there yet)
  let schein = await scheinOf(vin);
  if (!schein && vin.length >= 11) {
    await CarSchein.create({ carName: name, finNumber: vin, notes: [], owner: "", keySold: true, stage: "SOLD", soldAt: new Date(date) }).catch(() => null);
    schein = await scheinOf(vin);
  }
  await markVehicleSold(vin, date);

  // special agreements → notes of the car (once)
  const items = s(d.special)
    .split(/[;\n]+/)
    .map(s)
    .filter(Boolean)
    .slice(0, 10);
  if (schein?._id && items.length) {
    const full = await CarSchein.findById(schein._id).select("notes").lean();
    const notes = [...new Set([...(full?.notes || []), ...items])];
    await CarSchein.updateOne({ _id: schein._id }, { $set: { notes } }).catch(() => null);
  }

  if (schein?._id) doc.scheinId = schein._id;
  return { scheinId: schein?._id ? String(schein._id) : "", vehicleName: name };
}

/** Private contract deleted → the car is available again. */
export async function undoPrivateSale(doc) {
  const vin = normVin(doc?.vin || doc?.data?.car?.vin);
  if (vin) await makeVehicleAvailable(vin);
}
