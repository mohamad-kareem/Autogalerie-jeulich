import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeEuro,
  CalendarDays,
  Car,
  Check,
  Fuel,
  Gauge,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Star,
  Tag,
  Zap,
} from "lucide-react";

import ConsentBanner from "../helpers/ConsentBanner";
import HomeSearch from "./HomeSearch";
import "./home.css";
import {
  DEALER,
  euro,
  imagesOf,
  km,
  label,
  powerPs,
  priceOf,
  registration,
  registrationYear,
  sizedImage,
  subtitleOf,
  titleOf,
} from "@/lib/cars/format";

/*
 * Startseite – Weiß, Grau und kräftiges Gelb. Motive aus der Autowelt:
 * Kennzeichen, Tacho-Zähler, Fahrbahnmarkierung, Preisaufkleber, Parkschein.
 */

const HOURS = [
  ["Mo – Fr", "10:00 – 18:00"],
  ["Samstag", "10:00 – 15:00"],
  ["Sonntag", "nach Absprache"],
];
const REVIEWS_URL = "https://www.mobile.de/bewertungen/AutogalerieJuelich#1";

function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

function Plate({ text, className = "" }) {
  return (
    <span className={`hp-plate ${className}`} aria-label={`Kennzeichen ${text}`}>
      <span className="hp-plate-eu" aria-hidden="true">D</span>
      <span className="hp-plate-text">{text}</span>
    </span>
  );
}

function Odometer({ value }) {
  const digits = String(Math.max(0, value)).padStart(3, "0").split("");
  return (
    <span className="hp-odo" aria-label={`${value}`}>
      {digits.map((d, i) => (
        <span key={i} className={i === digits.length - 1 ? "hp-odo-last" : ""} aria-hidden="true">{d}</span>
      ))}
    </span>
  );
}

function Heading({ kicker, children, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8a929c]">{kicker}</p>
      <h2 className="mt-2 text-[30px] font-black leading-[1.02] tracking-tight text-[#14171b] sm:text-[44px]">{children}</h2>
    </div>
  );
}

function Marker({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="absolute -inset-x-1 bottom-[0.08em] top-[0.45em] -z-0 -skew-x-6 bg-[#FFD000]" aria-hidden="true" />
      <span className="relative">{children}</span>
    </span>
  );
}

function facts(car) {
  const ps = powerPs(car);
  return [
    { icon: CalendarDays, value: registration(car.firstRegistration) },
    { icon: Gauge, value: km(car.mileage) },
    { icon: Zap, value: ps ? `${ps} PS` : null },
    { icon: Fuel, value: label("fuel", car.fuel) },
  ].filter((f) => f.value);
}

function Photo({ car, size, className = "" }) {
  const image = imagesOf(car)[0];
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sizedImage(image, size)} alt={`${titleOf(car)} ${subtitleOf(car)}`.trim()} loading="lazy" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#eceef1] text-[#a3aab3]">
      <Car className="h-10 w-10" aria-hidden="true" />
    </div>
  );
}

/** showroom tile – big for the first car, compact for the others */
function ShowroomTile({ car, big = false }) {
  return (
    <Link
      href={`/gebrauchtwagen/${car._id}`}
      className={`group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl bg-[#eceef1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${big ? "md:col-span-2 md:row-span-2 md:min-h-[540px]" : ""}`}
    >
      <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]">
        <Photo car={car} size={big ? 1024 : 640} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden="true" />
      <span className={`hp-sticker right-4 top-4 px-3 py-1.5 font-black ${big ? "text-[22px]" : "text-[17px]"}`}>{euro(priceOf(car))}</span>
      <div className="relative p-5 text-white">
        <h3 className={`font-black leading-tight ${big ? "text-[30px]" : "text-[19px]"}`}>{titleOf(car)}</h3>
        <p className="mt-0.5 truncate text-[13.5px] text-white/80">{subtitleOf(car) || " "}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {facts(car).map(({ icon: Icon, value }) => (
            <li key={value} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-medium backdrop-blur-sm">
              <Icon className="h-3 w-3" aria-hidden="true" /> {value}
            </li>
          ))}
        </ul>
      </div>
      <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#14171b] opacity-0 shadow transition group-hover:opacity-100" aria-hidden="true">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function HomePage({ cars = [] }) {
  const available = cars.filter((car) => !car.sold);
  const count = available.length;
  const withPhoto = available.filter((car) => imagesOf(car).length);
  const hero = withPhoto[0] || null;
  const showroom = (withPhoto.length >= 5 ? withPhoto : available).slice(0, 5);
  const makes = [...new Set(available.map((c) => c.make).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
  const searchData = available.map((car) => ({ make: car.make || "", price: priceOf(car), km: Number(car.mileage), year: registrationYear(car.firstRegistration) }));

  return (
    <main className="hp overflow-x-clip bg-white text-[#14171b]">
      {/* ================================================= HERO */}
      <section className="relative">
        <div className="relative">
        <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-[#eceef1] lg:block" aria-hidden="true" />
        <div className="hp-hazard-soft absolute right-[44%] top-0 hidden h-full w-3 lg:block" aria-hidden="true" />
        <Container className="relative grid grid-cols-[minmax(0,1fr)] gap-10 pb-2 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:pb-14 lg:pt-16">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <Plate text="DN · AG 2026" />
              <span className="text-[13px] font-semibold text-[#5d6671]">Autohändler in Jülich</span>
            </div>
            <h1 className="mt-6 text-[44px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[76px]">
              Dein nächstes
              <br />
              Auto steht in <Marker>Jülich.</Marker>
            </h1>
            <p className="mt-6 max-w-[500px] text-[16.5px] leading-relaxed text-[#4f5863]">
              Geprüfte Gebrauchtwagen, faire Preise und persönliche Beratung – mit Finanzierung, Inzahlungnahme und Zulassungsservice.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <Odometer value={count} />
              <span className="text-[14px] font-semibold leading-tight text-[#3e454e]">
                Fahrzeuge
                <br />
                <span className="font-normal text-[#5d6671]">jetzt im Bestand</span>
              </span>
            </div>
          </div>

          <div className="relative min-h-[300px] sm:min-h-[400px]">
            {hero ? (
              <Link href={`/gebrauchtwagen/${hero._id}`} className="group absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]">
                <div className="absolute inset-0 overflow-hidden rounded-[28px] border-[6px] border-white shadow-[0_30px_60px_rgba(20,23,27,0.18)] lg:rotate-[2deg]">
                  <Photo car={hero} size={1024} className="transition duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="hp-sticker -left-3 bottom-8 px-4 py-3 sm:-left-6">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em]">Neu im Bestand</span>
                  <span className="block text-[17px] font-black leading-tight">{titleOf(hero)}</span>
                  <span className="block text-[24px] font-black leading-tight">{euro(priceOf(hero))}</span>
                </div>
              </Link>
            ) : (
              <div className="absolute inset-0 rounded-[28px] bg-[#eceef1]" />
            )}
          </div>
        </Container>
        </div>

        <Container className="relative z-10 pt-8 pb-12 lg:pt-10 lg:pb-16">
          <HomeSearch cars={searchData} />
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] font-semibold text-[#3e454e]">
            {["Finanzierung möglich", "Inzahlungnahme", "Zulassungsservice", "Probefahrt nach Absprache"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD000]"><Check className="h-3 w-3" aria-hidden="true" /></span>
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ================================================= MAKES MARQUEE */}
      {makes.length > 2 ? (
        <section className="border-y border-[#e1e4e8] bg-[#f6f7f8] py-5" aria-label="Marken im Bestand">
          <div className="hp-marquee">
            <div className="hp-marquee-track">
              {[0, 1].map((round) => (
                <ul key={round} className="flex shrink-0 items-center" aria-hidden={round === 1 || undefined}>
                  {makes.map((m) => (
                    <li key={`${round}-${m}`} className="flex items-center">
                      <Link href={`/gebrauchtwagen?make=${encodeURIComponent(m)}`} tabIndex={round === 1 ? -1 : undefined} className="px-7 text-[22px] font-black uppercase tracking-tight text-[#b7bdc5] transition hover:text-[#14171b]">
                        {m}
                      </Link>
                      <span className="h-2.5 w-2.5 rotate-45 bg-[#FFD000]" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ================================================= SHOWROOM */}
      {showroom.length ? (
        <section className="py-16 sm:py-24">
          <Container>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <Heading kicker="Showroom">Frisch auf dem <Marker>Hof.</Marker></Heading>
              <Link href="/gebrauchtwagen" className="inline-flex items-center gap-2 rounded-full border-2 border-[#14171b] px-5 py-2.5 text-[14px] font-extrabold transition hover:bg-[#14171b] hover:text-white">
                Alle {count} Fahrzeuge <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[repeat(4,minmax(0,1fr))] md:grid-rows-[repeat(2,minmax(0,1fr))]">
              {showroom.map((car, i) => <ShowroomTile key={car._id} car={car} big={i === 0} />)}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ================================================= THE ROAD: kaufen → verkaufen → finanzieren */}
      <section className="hp-asphalt relative overflow-hidden py-16 sm:py-24">
        <Container>
          <Heading kicker="Drei Wege zu uns" className="max-w-[640px]">Kaufen. Verkaufen. <Marker>Finanzieren.</Marker></Heading>
        </Container>
        <div className="relative mt-12">
          <div className="hp-road-line absolute inset-x-0 top-[34px] hidden md:block" aria-hidden="true" />
          <Container className="relative grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-6">
            <div className="hp-road-line-v absolute bottom-0 left-[46px] top-0 md:hidden" aria-hidden="true" />
            {[
              { icon: Car, km: "KM 1", title: "Auto kaufen", text: "Bestand ansehen, Probefahrt vereinbaren, persönlich beraten lassen.", href: "/gebrauchtwagen", cta: "Zum Bestand" },
              { icon: Tag, km: "KM 2", title: "Auto verkaufen", text: "Kostenlose, unverbindliche Bewertung – faire Preise, schnelle Abwicklung.", href: "/Autoverkaufen", cta: "Bewertung anfragen" },
              { icon: Landmark, km: "KM 3", title: "Finanzieren", text: "Wir finden mit Ihnen die Finanzierung, die zu Ihrem Budget passt.", href: "/finanzierung", cta: "Zur Finanzierung" },
            ].map(({ icon: Icon, km: stop, title, text, href, cta }) => (
              <Link key={title} href={href} className="group relative flex gap-5 md:flex-col md:gap-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]">
                <span className="relative z-10 flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-2xl border-[3px] border-[#14171b] bg-[#FFD000] shadow-[4px_4px_0_#14171b] transition group-hover:-translate-y-1">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  <span className="mt-0.5 text-[10px] font-black tracking-wider">{stop}</span>
                </span>
                <span className="block rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(20,23,27,0.06)] transition group-hover:shadow-[0_16px_40px_rgba(20,23,27,0.12)] md:mt-6">
                  <span className="block text-[21px] font-black">{title}</span>
                  <span className="mt-1.5 block text-[14.5px] leading-relaxed text-[#5d6671]">{text}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-extrabold">
                    {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </Container>
        </div>
      </section>

      {/* ================================================= CHECKLIST + SELL */}
      <section className="py-16 sm:py-24">
        <Container className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-[#e1e4e8] bg-[#f6f7f8] p-7 sm:p-10">
            <Heading kicker="Checkliste">Zum Autokauf mitbringen</Heading>
            <ul className="mt-7 space-y-4">
              {[
                ["Gültiger Ausweis", "Personalausweis oder Reisepass des Käufers."],
                ["Zahlung oder Finanzierung", "Gesicherte Finanzierung, EC-Karte oder Überweisungsnachweis."],
                ["Bonitätsnachweis", "Nur bei Finanzierung: Einkommens- oder Bonitätsnachweis."],
                ["eVB-Nummer", "Von Ihrer Versicherung – die Zulassung übernehmen wir gerne."],
              ].map(([title, text]) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-[#14171b] bg-white">
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[16.5px] font-extrabold">{title}</span>
                    <span className="block text-[14.5px] text-[#5d6671]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#FFD000] p-7 sm:p-10">
            <div className="hp-hazard absolute inset-x-0 top-0 h-3" aria-hidden="true" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-black/60">Autoankauf</p>
              <h2 className="mt-2 text-[40px] font-black leading-[0.98] tracking-tight sm:text-[56px]">Wir kaufen
                <br />
                Ihr Auto.</h2>
              <p className="mt-4 max-w-[420px] text-[15.5px] leading-relaxed text-black/75">Faire Bewertung, schnelle Abwicklung und persönliche Beratung – kostenlos und unverbindlich.</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/Autoverkaufen" className="inline-flex h-13 items-center gap-2 rounded-full bg-[#14171b] px-7 py-3.5 text-[15px] font-extrabold text-white transition hover:bg-black">
                Jetzt bewerten lassen <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={REVIEWS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#14171b] px-5 py-3 text-[14px] font-extrabold transition hover:bg-white/40">
                <span className="flex" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-[#14171b]" />)}</span>
                Bewertungen auf mobile.de
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================= VISIT: map card + parking ticket */}
      <section className="border-t border-[#e1e4e8] bg-[#f6f7f8] py-16 sm:py-24">
        <Container>
          <Heading kicker="Besuchen Sie uns" className="mb-10">Hier finden Sie <Marker>uns.</Marker></Heading>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <a href={DEALER.mapsUrl} target="_blank" rel="noreferrer" className="hp-map group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl border border-[#e1e4e8] p-6 sm:p-8">
              <span className="absolute left-1/2 top-[38%] flex -translate-x-1/2 -translate-y-full flex-col items-center" aria-hidden="true">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#14171b] bg-[#FFD000] shadow-[4px_4px_0_#14171b] transition group-hover:-translate-y-1">
                  <MapPin className="h-6 w-6" />
                </span>
                <span className="h-4 w-[3px] bg-[#14171b]" />
              </span>
              <div className="relative rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(20,23,27,0.08)]">
                <p className="text-[19px] font-black">{DEALER.name}</p>
                <p className="text-[15px] text-[#4f5863]">{DEALER.street}, {DEALER.zip} {DEALER.city}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-extrabold">
                  Route planen <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </a>

            <div className="hp-ticket flex flex-col">
              <div className="flex items-center justify-between rounded-t-[9px] bg-[#FFD000] px-6 py-4">
                <span className="text-[13px] font-black uppercase tracking-[0.16em]">Öffnungszeiten</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#14171b] bg-white text-[18px] font-black">P</span>
              </div>
              <dl className="flex-1 px-6 py-4 font-mono">
                {HOURS.map(([day, time]) => (
                  <div key={day} className="flex items-baseline justify-between gap-3 border-b border-dotted border-[#c9ced5] py-2.5 text-[15px] last:border-0">
                    <dt className="text-[#5d6671]">{day}</dt>
                    <dd className="text-right font-bold">{time}</dd>
                  </div>
                ))}
              </dl>
              <div className="hp-ticket-cut grid grid-cols-[minmax(0,1fr)] gap-2 px-6 py-5 sm:grid-cols-2">
                <a href={`tel:${DEALER.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#14171b] px-4 py-3 text-[14px] font-extrabold text-white transition hover:bg-black">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {DEALER.phoneLabel}
                </a>
                <Link href="/kontakt" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#14171b] px-4 py-3 text-[14px] font-extrabold transition hover:bg-[#FFD000]">
                  <Mail className="h-4 w-4" aria-hidden="true" /> Nachricht
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================= FOOTER */}
      <footer className="bg-white">
        <div className="hp-road-line mx-auto mt-0 w-full" aria-hidden="true" />
        <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 py-12 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Plate text="AUTOGALERIE" />
            <p className="mt-4 max-w-[340px] text-[14px] text-[#5d6671]">Ihr zuverlässiger Partner für Gebrauchtwagen in Jülich und Umgebung. {DEALER.street}, {DEALER.zip} {DEALER.city}.</p>
          </div>
          <nav aria-label="Seiten" className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-[14.5px] font-semibold sm:grid-cols-3">
            {[
              ["Gebrauchtwagen", "/gebrauchtwagen"],
              ["Auto verkaufen", "/Autoverkaufen"],
              ["Finanzierung", "/finanzierung"],
              ["Garantie", "/garantie"],
              ["Vergleich", "/vergleich"],
              ["Kontakt", "/kontakt"],
              ["Impressum", "/impressum"],
              ["Datenschutz", "/Datenschutz"],
            ].map(([text, href]) => (
              <Link key={href} href={href} className="text-[#3e454e] underline-offset-4 hover:text-[#14171b] hover:underline hover:decoration-[#FFD000] hover:decoration-[3px]">{text}</Link>
            ))}
          </nav>
        </Container>
        <div className="border-t border-[#eef0f2]">
          <Container className="flex flex-wrap items-center justify-between gap-2 py-4 text-[12.5px] text-[#8a929c]">
            <span>© {new Date().getFullYear()} Autogalerie Jülich</span>
            <span>Alle Rechte vorbehalten.</span>
          </Container>
        </div>
      </footer>

      <ConsentBanner />
    </main>
  );
}
