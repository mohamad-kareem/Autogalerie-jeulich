import Link from "next/link";

export default function CarNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7f5] px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Fahrzeug nicht mehr verfügbar</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-slate-500">
          Dieses Angebot wurde verkauft oder entfernt. Sehen Sie sich unsere anderen Fahrzeuge an.
        </p>
        <Link
          href="/gebrauchtwagen"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#146c2e] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0f5724]"
        >
          Alle Fahrzeuge ansehen
        </Link>
      </div>
    </main>
  );
}
