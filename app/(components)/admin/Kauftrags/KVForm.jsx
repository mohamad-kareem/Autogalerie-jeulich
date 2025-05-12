// app/components/KaufvertragKfz.tsx
import Image from "next/image";
import tuvLogo from "@/app/(assets)/tuv.png";

export default function KaufvertragKfz() {
  return (
    <form className="text-xs leading-tight space-y-4 p-4 print:p-2 max-w-4xl mx-auto print:max-w-none">
      {/* Header */}
      <header className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <h1 className="text-sm font-bold text-gray-800">
            KAUFVERTRAG über ein gebrauchtes Kraftfahrzeug
          </h1>
          <p className="text-[0.65rem] text-gray-600 italic">
            Zutreffendes bitte ankreuzen oder ausfüllen
          </p>
        </div>
        <Image
          src={tuvLogo}
          alt="TÜV Logo"
          className="w-16 h-auto object-contain print:w-14"
          width={64}
          height={32}
          priority
        />
      </header>

      {/* Parties Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 border border-gray-300 rounded print:bg-white print:p-1">
        {["Verkäufer", "Käufer"].map((role) => (
          <div key={role}>
            <h2 className="font-semibold text-[0.65rem] uppercase tracking-wider text-gray-700 mb-2">
              {role}
            </h2>
            <div className="space-y-1.5">
              <Input label="Name, Vorname" />
              <Input label="Straße, Hs.Nr." />
              <div className="grid grid-cols-3 gap-2">
                <Input label="PLZ" />
                <div className="col-span-2">
                  <Input label="Ort" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Geburtsdatum" />
                <Input label="Telefon" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Vehicle Section */}
      <section className="border border-gray-300 rounded p-3 bg-gray-50 print:bg-white">
        <h2 className="font-semibold text-[0.65rem] uppercase tracking-wider text-gray-700 mb-2">
          Kraftfahrzeug
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Fahrzeughersteller" />
          <Input label="Typ und Ausführung" />
          <Input label="Amtliches Kennzeichen" />
          <Input label="Fahrzeugbrief-Nr." />
          <Input label="Fahrzeug-Ident-Nr. (Fahrgestell-Nr.)" />
          <Input label="Erstzulassung am" />
          <Input label="PS / kW" />
          <Input label="Hubraum (cm³)" />
          <Input label="Zubehör / Sonderausstattung" />
          <Input label="Original- oder Austauschmotor" />
          <Input label="km-Stand" />
          <Input label="bei km-Stand" />
          <Input label="Nächster TÜV-Termin" />
        </div>
      </section>

      {/* Damage Section */}
      <section className="space-y-1 text-[0.65rem]">
        <h3 className="font-semibold text-gray-700">
          Der Verkäufer sichert zu, dass das Kfz. während seiner Zeit als
          Eigentümer und – soweit ihm bekannt – auch früher:
        </h3>
        <Checkbox label="keinen Unfallschaden" />
        <Checkbox label="keine sonstigen erheblichen Beschädigungen" />
        <Checkbox label="folgende Schäden (Zahl, Art und Umfang)" hasInput />
      </section>

      {/* Agreement Section */}
      <section className="grid grid-cols-2 gap-3">
        <Input
          label="Sondervereinbarung (z. B. Zahlungsweise, Liefertermin, Fahrzeug abgemeldet)"
          textarea
        />
        <div className="space-y-2">
          <Input label="Gesamtpreis (Euro)" />
          <Input label="In Worten" />
        </div>
      </section>

      {/* Legal Notice */}
      <section className="text-[0.65rem] text-gray-700 space-y-1">
        <p>
          Das Fahrzeug, der Kfz-Brief, der Kfz-Schein und die Fahrzeugschlüssel
          wurden übergeben.
        </p>
        <p>
          Der Verkäufer versichert, dass das Kraftfahrzeug sein Eigentum ist und
          keine Rechte Dritter darauf lasten.
        </p>

        <p>
          <span className="font-bold text-[12px]">
            Das Kraftfahrzeug wurde gekauft wie besichtigt und probegefahren –
            unter Ausschluss jeglicher Gewährleistung.
          </span>{" "}
          <span>
            (Vorstehende Gewährleistungsklausel können Sie gegebenenfalls durch
            Streichung oder Ergänzung individuell anpassen)
          </span>
        </p>

        <p>
          Das Kraftfahrzeug bleibt bis zur vollständigen Bezahlung des
          Kaufpreises Eigentum des Verkäufers.
        </p>
      </section>

      {/* Buyer Obligation Section */}
      <section className="space-y-1 text-[0.65rem]">
        <h3 className="font-semibold text-gray-700">
          Der Käufer verpflichtet sich:
        </h3>
        <Checkbox
          label="das Fahrzeug bei einer Kfz-Zulassungsstelle umzuschreiben am"
          hasInput
        />
        <Checkbox label="vorübergehend abzumelden am" hasInput />
        <Checkbox label="endgültig abzumelden am" hasInput />
      </section>

      {/* Signature Section */}
      <section className="grid grid-cols-2 gap-4 mt-4">
        {["Verkäufer", "Käufer"].map((role) => (
          <div key={role}>
            <Input label="Ort / Datum / Uhrzeit" />
            <p className="text-[0.65rem] mt-2 text-gray-600">
              Unterschrift des {role}s
            </p>
          </div>
        ))}
      </section>
    </form>
  );
}

// Reusable Input Component
function Input({ label, textarea = false }) {
  return (
    <div>
      <label className="block text-[0.65rem] text-gray-600 mb-0.5">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={2}
          className="w-full p-1 border border-gray-300 rounded text-xs"
        />
      ) : (
        <input
          type="text"
          className="w-full p-1 border border-gray-300 rounded text-xs"
        />
      )}
    </div>
  );
}
function getTodayDateDE() {
  const today = new Date();
  return today.toLocaleDateString("de-DE");
}

// Reusable Checkbox Component
function Checkbox({ label, hasInput = false }) {
  return (
    <div className="flex items-start space-x-1">
      <input
        type="checkbox"
        className="mt-0.5 h-3 w-3 text-blue-600 rounded focus:ring-blue-500"
      />
      <label className="flex-1 text-gray-700 leading-snug">{label}</label>
      {hasInput && (
        <input
          type="text"
          className="ml-2 flex-1 p-1 border border-gray-300 rounded text-xs"
        />
      )}
    </div>
  );
}
