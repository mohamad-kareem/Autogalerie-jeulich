// app/(Pages)/gebrauchtwagen/[id]/page.js
export const dynamic = "force-dynamic"; // disable build-time prerender

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function CarPage({ params }) {
  await connectDB();
  const car = await Car.findById(params.id).lean();

  if (!car) return <p className="p-8">🚫 Car not found</p>;

  // safe formatters
  const mileage = car.mileage != null ? car.mileage.toLocaleString() : "–";
  const registration = car.firstRegistration
    ? new Date(car.firstRegistration).toLocaleDateString()
    : "–";
  const powerKW = car.powerKW != null ? `${car.powerKW} kW` : "–";
  const powerPS = car.powerPS != null ? `(${car.powerPS} PS)` : "";
  const displacement =
    car.engineDisplacement != null ? `${car.engineDisplacement} cm³` : "–";
  const consumption =
    car.consumptionCombined != null
      ? `${car.consumptionCombined} l/100km`
      : "–";
  const co2 = car.co2Emissions != null ? `${car.co2Emissions} g/km` : "–";
  const nextInspection = car.nextInspection
    ? new Date(car.nextInspection).toLocaleDateString()
    : "–";
  const price =
    car.priceGross != null
      ? `${car.priceGross.toLocaleString()} ${car.currency || ""}`
      : "–";

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        {car.make} {car.model}{" "}
        {registration && `(${registration.split(".").pop()})`}
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-4">
          {car.images.map((img, i) => (
            <img
              key={i}
              src={img.ref}
              alt={`Image ${i + 1}`}
              className="w-full rounded"
            />
          ))}
        </div>

        {/* Details */}
        <div className="prose">
          <h2>Technische Daten</h2>
          <ul>
            <li>
              <strong>Kilometerstand:</strong> {mileage} km
            </li>
            <li>
              <strong>Erstzulassung:</strong> {registration}
            </li>
            <li>
              <strong>Leistung:</strong> {powerKW} {powerPS}
            </li>
            <li>
              <strong>Hubraum:</strong> {displacement}
            </li>
            <li>
              <strong>Kraftstoff:</strong> {car.fuel || "–"}
            </li>
            <li>
              <strong>Getriebe:</strong> {car.gearbox || "–"}
            </li>
            <li>
              <strong>Zylinder:</strong> {car.cylinders ?? "–"}
            </li>
            <li>
              <strong>Verbrauch (komb.):</strong> {consumption}
            </li>
            <li>
              <strong>CO₂-Emissionen:</strong> {co2}
            </li>
            <li>
              <strong>Schadstoffklasse:</strong> {car.emissionClass || "–"}
            </li>
            <li>
              <strong>Umweltplakette:</strong> {car.environmentBadge || "–"}
            </li>
            <li>
              <strong>nächste HU:</strong> {nextInspection}
            </li>
            <li>
              <strong>Vorbesitzer:</strong> {car.previousOwners ?? "–"}
            </li>
            <li>
              <strong>Sitzplätze:</strong> {car.seats ?? "–"}
            </li>
            <li>
              <strong>Türen:</strong> {car.doors ?? "–"}
            </li>
            <li>
              <strong>Tankgröße:</strong> {car.tankCapacity ?? "–"} l
            </li>
          </ul>

          <h2>Ausstattung & Sicherheit</h2>
          <ul>
            {car.airbags?.length && (
              <li>
                <strong>Airbags:</strong> {car.airbags.join(", ")}
              </li>
            )}
            {car.abs && <li>ABS</li>}
            {car.esp && <li>ESP</li>}
            {car.tractionControl && <li>ASR</li>}
            {car.centralLocking && <li>Zentralverriegelung</li>}
            {car.alarm && <li>Wegfahrsperre</li>}
            {car.cruiseControl && <li>Tempomat</li>}
            {car.cdPlayer && <li>CD-Spieler</li>}
            {car.radio && <li>Radio: {car.radio}</li>}
            {car.fogLights && <li>Nebelscheinwerfer</li>}
            {car.multifunctionSteering && <li>Multifunktionslenkrad</li>}
            {car.equipmentList?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>Farben & Innenraum</h2>
          <ul>
            <li>
              <strong>Außen:</strong> {car.colorExterior || "–"}
            </li>
            <li>
              <strong>Innen:</strong> {car.colorInterior || "–"}
            </li>
          </ul>

          <h2>Beschreibung</h2>
          <p>{car.modelDescription}</p>

          <h2>Preis</h2>
          <p className="text-xl font-bold">
            {price}
            {car.vatRate != null ? ` (zzgl. ${car.vatRate}% MwSt.)` : ""}
          </p>

          <h2>Service & Historie</h2>
          <p>{car.serviceHistory || "–"}</p>
        </div>
      </div>
    </main>
  );
}
