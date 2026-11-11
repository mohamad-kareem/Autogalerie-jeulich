// Helpers for the "Abholungen" page.

export const PICKUP_MODES = [
  { key: "pickup", label: "Wir holen ab" },
  { key: "delivery", label: "Kunde bringt" },
];

export function serializePickup(d) {
  if (!d) return null;
  return {
    _id: String(d._id),
    vehicle: { ...(d.vehicle || {}) },
    seller: { ...(d.seller || {}) },
    price: Number(d.price || 0),
    payment: d.payment || "transfer",
    mode: d.mode || "pickup",
    date: d.date || "",
    time: d.time || "",
    redPlate: d.redPlate || "",
    registered: Boolean(d.registered),
    driver: d.driver || "",
    note: d.note || "",
    status: d.status || "open",
    doneAt: d.doneAt ? new Date(d.doneAt).toISOString() : null,
    doneBy: d.doneBy || "",
    vehicleId: d.vehicleId ? String(d.vehicleId) : "",
    emailTo: d.emailTo || "",
    createdBy: d.createdBy || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
  };
}
