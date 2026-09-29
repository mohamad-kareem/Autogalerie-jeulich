import { notFound } from "next/navigation";

import { DEALER, euro, imagesOf, keyFacts, label, priceOf, sizedImage, subtitleOf, titleOf } from "@/lib/cars/format";
import { getCar } from "@/lib/cars/queries";

import CarDetailClient from "./CarDetailClient";

const SITE = "https://xn--autogaleriejlich-uzb.de";

export const revalidate = 600;

async function load(params) {
  const { id } = await params;
  const car = await getCar(id).catch(() => null);
  return { id, car };
}

export async function generateMetadata({ params }) {
  const { id, car } = await load(params);
  if (!car) return { title: "Fahrzeug nicht gefunden | Autogalerie Jülich", robots: { index: false } };

  const name = `${titleOf(car)} ${subtitleOf(car)}`.trim();
  const facts = keyFacts(car).map((fact) => fact.value).join(" · ");
  const price = priceOf(car);
  const description = `${name}${price ? ` für ${euro(price)}` : ""}: ${facts}. Jetzt bei der Autogalerie Jülich anfragen – Finanzierung & Inzahlungnahme möglich.`;
  const image = imagesOf(car)[0];

  return {
    title: `${name}${price ? ` – ${euro(price)}` : ""} | Autogalerie Jülich`,
    description,
    alternates: { canonical: `/gebrauchtwagen/${id}` },
    robots: car.sold ? { index: false } : undefined,
    openGraph: {
      title: name,
      description,
      type: "website",
      images: image ? [{ url: sizedImage(image, 1024), alt: name }] : undefined,
    },
  };
}

/** schema.org data, so search engines show price, mileage and photo. */
function structuredData(car, id) {
  const price = priceOf(car);
  const reg = String(car.firstRegistration || "").replace(/\D/g, "");
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${titleOf(car)} ${subtitleOf(car)}`.trim(),
    brand: car.make ? { "@type": "Brand", name: car.make } : undefined,
    model: car.model || undefined,
    image: imagesOf(car).slice(0, 5).map((url) => sizedImage(url, 1024)),
    url: `${SITE}/gebrauchtwagen/${id}`,
    mileageFromOdometer: Number.isFinite(Number(car.mileage)) ? { "@type": "QuantitativeValue", value: Number(car.mileage), unitCode: "KMT" } : undefined,
    dateVehicleFirstRegistered: reg.length >= 6 ? `${reg.slice(0, 4)}-${reg.slice(4, 6)}` : undefined,
    fuelType: label("fuel", car.fuel) || undefined,
    vehicleTransmission: label("gearbox", car.gearbox) || undefined,
    offers: price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "EUR",
          itemCondition: "https://schema.org/UsedCondition",
          availability: car.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          seller: {
            "@type": "AutoDealer",
            name: DEALER.name,
            telephone: DEALER.phone,
            address: { "@type": "PostalAddress", streetAddress: DEALER.street, postalCode: DEALER.zip, addressLocality: DEALER.city, addressCountry: "DE" },
          },
        }
      : undefined,
  };
}

export default async function CarDetailPage({ params }) {
  const { id, car } = await load(params);
  if (!car) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(car, id)).replace(/</g, "\\u003c") }}
      />
      <CarDetailClient car={car} />
    </>
  );
}
