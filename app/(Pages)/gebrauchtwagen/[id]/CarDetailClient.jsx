"use client";

/**
 * One car of the public stock: photos, price, the facts that matter, the
 * full technical data, the equipment and the seller's text — plus the ways
 * to get in touch. Signed-in employees also get Verkauft / Kaufvertrag.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Expand,
  FileText,
  Fuel,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Share2,
  Tag,
  X,
  Zap,
} from "lucide-react";

import ContactForm from "@/app/(components)/helpers/ContactForm";
import {
  DEALER,
  descriptionBlocks,
  equipmentOf,
  euro,
  highlightsOf,
  imagesOf,
  inspection,
  km,
  label,
  power,
  priceOf,
  registration,
  sizedImage,
  specRows,
  subtitleOf,
  titleOf,
} from "@/lib/cars/format";

const WRAPPER = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";
const CARD = "rounded-xl border border-slate-200 bg-white";

/* ------------------------------------------------------------ photo */

function Photo({ url, size, alt, className = "", eager = false }) {
  const [src, setSrc] = useState(sizedImage(url, size));
  useEffect(() => setSrc(sizedImage(url, size)), [url, size]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => src !== url && setSrc(url)}
      className={className}
    />
  );
}

/* ------------------------------------------------------------ gallery */

function Gallery({ images, alt, sold }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const count = images.length;
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setFull(false);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, go]);

  // Swipe on phones.
  const [touchX, setTouchX] = useState(null);
  const swipe = {
    onTouchStart: (event) => setTouchX(event.touches[0].clientX),
    onTouchEnd: (event) => {
      if (touchX === null || count < 2) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      setTouchX(null);
    },
  };

  if (!count) {
    return (
      <div className={`${CARD} flex aspect-[16/10] items-center justify-center text-slate-300`}>
        <CarFront className="size-16" />
      </div>
    );
  }

  const arrow = "absolute top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white active:scale-95";

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="group relative aspect-[16/10] bg-slate-100" {...swipe}>
        <button type="button" onClick={() => setFull(true)} className="block size-full cursor-zoom-in" aria-label="Bild vergrößern">
          <Photo url={images[index]} size={1024} alt={`${alt} – Bild ${index + 1}`} eager={index === 0} className="size-full object-cover" />
        </button>
        {sold ? (
          <div className="pointer-events-none absolute left-0 top-0 size-36 overflow-hidden" aria-label="Verkauft">
            <span className="absolute left-[-52px] top-[30px] block w-[220px] -rotate-45 bg-red-600 py-2 text-center text-[13px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              Verkauft
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setFull(true)}
          className="absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-black/50 px-2.5 text-[12px] font-medium text-white backdrop-blur transition hover:bg-black/65"
        >
          <Expand className="size-3.5" /> Vollbild
        </button>
        {count > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Vorheriges Bild" className={`${arrow} left-3`}>
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Nächstes Bild" className={`${arrow} right-3`}>
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-0.5 text-[12px] font-medium tabular-nums text-white">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto p-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Bild ${i + 1}`}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition sm:h-16 sm:w-24 ${
                i === index ? "ring-2 ring-[#146c2e] ring-offset-1" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Photo url={url} size={160} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {full ? (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950" role="dialog" aria-modal="true" aria-label="Bilder">
          <div className="flex h-14 items-center justify-between px-4 text-white">
            <span className="text-[13px] tabular-nums text-slate-300">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => setFull(false)} aria-label="Schließen" className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2" {...swipe}>
            <Photo url={images[index]} size={1600} alt={`${alt} – Bild ${index + 1}`} eager className="max-h-full max-w-full object-contain" />
            {count > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Vorheriges Bild" className="absolute left-2 inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Nächstes Bild" className="absolute right-2 inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6">
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ sections */

function Section({ title, children, action }) {
  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MoreButton({ open, onClick, more, less = "Weniger anzeigen" }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 text-[13px] font-semibold text-[#146c2e] hover:underline">
      {open ? less : more}
    </button>
  );
}

function ContactModal({ car, title, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Fahrzeug anfragen" className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-slate-900">Fahrzeug anfragen</h3>
            <p className="mt-0.5 truncate text-[12.5px] text-slate-500">{title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-4 text-[13px] leading-5 text-slate-500">Wir melden uns schnellstmöglich bei Ihnen – gerne auch für eine Probefahrt.</p>
          <ContactForm car={car} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ page */

export default function CarDetailClient({ car: initialCar }) {
  const router = useRouter();
  const { data: session } = useSession();
  const staff = Boolean(session?.user);

  const [car, setCar] = useState(initialCar);
  const [contact, setContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allEquipment, setAllEquipment] = useState(false);
  const [fullText, setFullText] = useState(false);

  const title = titleOf(car);
  const subtitle = subtitleOf(car);
  const fullTitle = `${title} ${subtitle}`.trim();
  const price = priceOf(car);
  const images = useMemo(() => imagesOf(car), [car]);
  const equipment = useMemo(() => equipmentOf(car), [car]);
  const specs = useMemo(() => specRows(car), [car]);
  const highlights = useMemo(() => highlightsOf(car), [car]);
  const description = useMemo(() => descriptionBlocks(car.description), [car.description]);
  const vat = Number(car.price?.vatRate) > 0 ? Number(car.price.vatRate) : null;

  const facts = [
    { icon: Calendar, label: "Erstzulassung", value: registration(car.firstRegistration) },
    { icon: Gauge, label: "Kilometerstand", value: km(car.mileage) },
    { icon: Zap, label: "Leistung", value: power(car) },
    { icon: Fuel, label: "Kraftstoff", value: label("fuel", car.fuel) },
    { icon: Settings2, label: "Getriebe", value: label("gearbox", car.gearbox) },
    { icon: ClipboardCheck, label: "HU", value: inspection(car) },
  ];

  const equipmentCount = equipment.reduce((sum, group) => sum + group.items.length, 0);
  const shownEquipment = allEquipment
    ? equipment
    : (() => {
        let left = 18;
        return equipment
          .map((group) => {
            const items = group.items.slice(0, Math.max(0, left));
            left -= items.length;
            return { ...group, items };
          })
          .filter((group) => group.items.length);
      })();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: fullTitle, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  const toggleSold = async () => {
    try {
      const res = await fetch(`/api/cars/${car._id}/sold`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold: !car.sold }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      setCar((current) => ({ ...current, sold: data.sold }));
      toast.success(data.sold ? "Als verkauft markiert" : "Wieder verfügbar");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const summary = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146c2e]">{label("category", car.category) || "Gebrauchtwagen"}</p>
      <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[24px]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13.5px] leading-5 text-slate-500">{subtitle}</p> : null}

      {highlights.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {highlights.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-md bg-[#146c2e]/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-[#0f5724]">
              <Check className="size-3" /> {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-[30px] font-bold leading-none tracking-[-0.03em] text-slate-900">{euro(price)}</p>
        <p className="mt-1.5 text-[12px] text-slate-500">{vat ? `inkl. ${vat.toLocaleString("de-DE")} % MwSt. · MwSt. ausweisbar` : "Endpreis"}</p>
      </div>
    </>
  );

  const actions = (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setContact(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#146c2e] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0f5724]"
      >
        <Mail className="size-4" /> Fahrzeug anfragen
      </button>
      <a
        href={`tel:${DEALER.phone}`}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-[14px] font-semibold text-slate-800 transition hover:border-[#146c2e]/40 hover:text-[#146c2e]"
      >
        <Phone className="size-4" /> {DEALER.phoneLabel}
      </a>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f6f7f5] pb-28 pt-4 text-slate-900 sm:pt-6 lg:pb-16">
      <div className={WRAPPER}>
        {/* top bar */}
        <nav className="mb-4 flex items-center justify-between gap-3">
          <Link href="/gebrauchtwagen" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 transition hover:text-[#146c2e]">
            <ArrowLeft className="size-4" /> Alle Fahrzeuge
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition hover:border-[#146c2e]/40 hover:text-[#146c2e]"
          >
            {copied ? <Check className="size-3.5 text-[#146c2e]" /> : <Share2 className="size-3.5" />}
            {copied ? "Link kopiert" : "Teilen"}
          </button>
        </nav>

        {car.sold ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
            <span className="font-medium">Dieses Fahrzeug ist bereits verkauft.</span>
            <Link href="/gebrauchtwagen" className="font-semibold underline">
              Ähnliche Fahrzeuge ansehen
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          {/* left */}
          <div className="min-w-0 space-y-5">
            <Gallery images={images} alt={fullTitle} sold={car.sold} />

            {/* phone: summary under the photos */}
            <div className={`${CARD} p-4 lg:hidden`}>{summary}</div>

            {/* key facts */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-3 bg-white p-3.5">
                  <fact.icon className="size-[18px] shrink-0 text-[#146c2e]" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">{fact.label}</p>
                    <p className="truncate text-[14px] font-semibold text-slate-900">{fact.value || "–"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* technical data */}
            {specs.length ? (
              <Section title="Technische Daten">
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {specs.map(([name, value]) => (
                    <div key={name} className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 text-[13.5px]">
                      <dt className="shrink-0 text-slate-500">{name}</dt>
                      <dd className={`min-w-0 text-right font-medium text-slate-900 ${name === "FIN" ? "break-all font-mono text-[12.5px]" : ""}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Section>
            ) : null}

            {/* equipment */}
            {equipmentCount ? (
              <Section title="Ausstattung" action={<span className="text-[12.5px] text-slate-500">{equipmentCount} Merkmale</span>}>
                <div className="space-y-4">
                  {shownEquipment.map((group) => (
                    <div key={group.title}>
                      <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</h3>
                      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-[#146c2e]" strokeWidth={2.5} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {equipmentCount > 18 ? (
                  <MoreButton open={allEquipment} onClick={() => setAllEquipment((open) => !open)} more={`Alle ${equipmentCount} Merkmale anzeigen`} />
                ) : null}
              </Section>
            ) : null}

            {/* description */}
            {description.length ? (
              <Section title="Fahrzeugbeschreibung">
                <div className={`relative space-y-2.5 overflow-hidden text-[13.5px] leading-6 text-slate-700 ${fullText ? "" : "max-h-72"}`}>
                  {description.map((block, index) =>
                    block.type === "list" ? (
                      <ul key={index} className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                        {block.items.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-slate-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : block.type === "heading" ? (
                      <h3 key={index} className="pt-2 text-[13.5px] font-semibold text-slate-900 first:pt-0">
                        {block.text}
                      </h3>
                    ) : block.type === "fact" ? (
                      <p key={index}>
                        <span className="font-medium text-slate-900">{block.label}:</span> {block.value}
                      </p>
                    ) : (
                      <p key={index}>{block.text}</p>
                    ),
                  )}
                  {!fullText ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white" /> : null}
                </div>
                <MoreButton open={fullText} onClick={() => setFullText((open) => !open)} more="Ganze Beschreibung lesen" />
              </Section>
            ) : null}
          </div>

          {/* right */}
          <aside className="min-w-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className={`${CARD} hidden p-5 lg:block`}>
                {summary}
                <div className="mt-4">{actions}</div>
              </div>

              <div className={`${CARD} p-5`}>
                <ul className="space-y-2 text-[13px] text-slate-700">
                  {["Finanzierung zu fairen Konditionen", "Inzahlungnahme Ihres Fahrzeugs", "Zulassungsservice auf Wunsch"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-[#146c2e]" strokeWidth={2.5} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-slate-100 pt-4 text-[13px]">
                  <p className="font-semibold text-slate-900">{DEALER.name}</p>
                  <a href={DEALER.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-start gap-2 text-slate-600 hover:text-[#146c2e]">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <span>
                      {DEALER.street}, {DEALER.zip} {DEALER.city}
                    </span>
                  </a>
                  <a href={`tel:${DEALER.phone}`} className="mt-1.5 flex items-center gap-2 text-slate-600 hover:text-[#146c2e]">
                    <Phone className="size-4 shrink-0 text-slate-400" /> {DEALER.phoneLabel}
                  </a>
                  <a href={`mailto:${DEALER.email}`} className="mt-1.5 flex items-center gap-2 text-slate-600 hover:text-[#146c2e]">
                    <Mail className="size-4 shrink-0 text-slate-400" /> {DEALER.email}
                  </a>
                </div>
              </div>

              {staff ? (
                <div className={`${CARD} border-dashed p-4`}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Intern</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={toggleSold}
                      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium ${
                        car.sold ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                      }`}
                    >
                      <Tag className="size-3.5" /> {car.sold ? "Verfügbar" : "Verkauft"}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/kaufvertrag/auswahl?carId=${encodeURIComponent(car._id)}`)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="size-3.5" /> Kaufvertrag
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* phone: sticky price and contact */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1240px] items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-slate-500">{title}</p>
            <p className="text-[19px] font-bold leading-tight tracking-[-0.02em] text-slate-900">{euro(price)}</p>
          </div>
          <a
            href={`tel:${DEALER.phone}`}
            aria-label="Anrufen"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#146c2e] active:scale-95"
          >
            <Phone className="size-4" />
          </a>
          <button
            type="button"
            onClick={() => setContact(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#146c2e] px-4 text-[14px] font-semibold text-white active:scale-95"
          >
            <Mail className="size-4" /> Anfragen
          </button>
        </div>
      </div>

      {contact ? <ContactModal car={car} title={fullTitle} onClose={() => setContact(false)} /> : null}
    </main>
  );
}
