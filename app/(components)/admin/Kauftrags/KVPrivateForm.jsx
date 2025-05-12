import Image from "next/image";
import tuvLogo from "@/app/(assets)/tuv.png";

export default function KaufvertragForm() {
  return (
    <form className="text-xs leading-tight space-y-4 p-4 print:p-2 max-w-4xl mx-auto print:max-w-none">
      {/* Header */}
      <header className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <p className="text-[0.65rem] text-gray-600 italic">
            Je ein Exemplar für Käufer und Verkäufer
          </p>
          <h2 className="text-[16px] font-bold text-gray-800">
            Kaufvertrag für ein gebrauchtes Kraftfahrzeug
          </h2>
          <p className="text-[0.70rem] text-gray-600">
            Bitte nur das Zutreffende ankreuzen oder ausfüllen.
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

      {/* Section Wrapper */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 border border-gray-300 rounded p-3 print:bg-white print:p-1">
        {["Verkäufer (privat)", "Käufer"].map((role) => (
          <div key={role} className="space-y-1.5">
            <h2 className="font-semibold text-[0.65rem] uppercase tracking-wider text-gray-700">
              {role}
            </h2>
            <div className="space-y-1">
              <FormInput label="Name, Vorname" />
              <div className="grid grid-cols-3 gap-1">
                <FormInput label="PLZ" />
                <div className="col-span-2">
                  <FormInput label="Ort" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <FormInput label="Straße, Hausnummer" />
                <FormInput label="Telefon" />
              </div>
              {role === "Käufer" && (
                <FormInput label="Pass-/Personalausweis-Nr., ausstellende Behörde" />
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Vehicle Details */}
      <section className="border border-gray-300 rounded p-3 bg-gray-50 print:bg-white">
        <h2 className="font-semibold text-[0.65rem] uppercase tracking-wider text-gray-700 mb-2">
          Kraftfahrzeug
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <FormInput label="Hersteller" />
          <FormInput label="Typ" />
          <FormInput label="Amtliches Kennzeichen" />
          <FormInput label="Erstzulassung" />
          <FormInput
            label="Zulassungsbescheinigung Teil 2 (ZB-II-Nr.)"
            colSpan={2}
          />
          <FormInput label="Fahrzeug-Ident-Nr." colSpan={2} />
          <FormInput label="Nächste HU" />
          <FormInput label="Abgelesener km-Stand" />
          <FormInput label="Anzahl der Vorbesitzer" />
          <FormInput
            label="Mitverkaufte Zubehör/Zusatzausstattung"
            colSpan={2}
          />
        </div>
      </section>

      {/* Contract Terms */}
      <section className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <FormInput label="Kaufpreis" placeholder="Euro" />
          <FormInput label="In Worten (Euro)" />
        </div>

        <p className="text-gray-700 text-[0.65rem] leading-snug">
          Das Fahrzeug wird – soweit nicht nachstehend ausdrücklich Garantien
          zugesagt sind – wie besichtigt und probegefahren unter Ausschluss
          jeglicher Haftung für Sachmängel verkauft. ...
        </p>

        <div className="space-y-1.5">
          <h3 className="font-semibold text-gray-700 text-[0.65rem]">
            Garantiezusagen des Verkäufers:
          </h3>
          <FormCheckbox
            label="nur folgende Unfall- oder sonstige erhebliche Schäden (Zahl, Art, Umfang) erlitten hat:"
            hasInput
          />
          <FormCheckbox label="dass das Fahrzeug noch mit dem Original- bzw. mit einem Austausch-/Ersatzmotor ausgerüstet ist," />
          <FormCheckbox
            label="der die nachfolgend genannte Laufleistung aufweist"
            hasInput
            placeholder="km"
          />
          <FormCheckbox label="dass der abgelesene Kilometerstand der Gesamtleistung des Fahrzeugs entspricht ..." />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-semibold text-gray-700 text-[0.65rem]">
            Erklärung des Käufers:
          </h3>
          <FormCheckbox label="Der Käufer meldet das Fahrzeug unverzüglich, spätestens am dritten Werktag nach Übergabe um." />
          <FormCheckbox label="Der Käufer erkennt an, dass das Fahrzeug bis zur vollständigen Erfüllung ..." />
        </div>

        <FormTextarea label="Sondervereinbarungen (z. B. Zahlungsbedingungen, Übergabe)" />

        <div className="grid grid-cols-2 gap-3 mt-3">
          {["Verkäufer", "Käufer"].map((role) => (
            <div key={role}>
              <FormInput label="Ort" />
              <FormInput
                className="mt-2"
                label="Datum"
                defaultValue={getTodayDateDE()}
                placeholder="Datum"
              />
              <p className="mt-1 text-[0.65rem] text-gray-600">
                Unterschrift des {role}s
              </p>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function FormInput({
  label,
  placeholder,
  defaultValue,
  colSpan,
  className = "",
}) {
  return (
    <div className={`${colSpan === 2 ? "col-span-2" : ""} ${className}`}>
      {label && (
        <label className="block text-[0.65rem] text-gray-600 mb-0.5">
          {label}
        </label>
      )}
      <input
        type="text"
        className="w-full p-1 border border-gray-300 rounded text-xs"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
}

function FormTextarea({ label, defaultValue }) {
  return (
    <div>
      <label className="block font-semibold text-gray-700 mb-0.5 text-[0.65rem]">
        {label}
      </label>
      <textarea
        className="w-full p-1 border border-gray-300 rounded text-xs"
        rows={2}
        defaultValue={defaultValue}
      />
    </div>
  );
}
function getTodayDateDE() {
  const today = new Date();
  return today.toLocaleDateString("de-DE");
}

function FormCheckbox({ label, hasInput = false, placeholder }) {
  return (
    <div className="flex items-start space-x-1">
      <input
        type="checkbox"
        defaultChecked
        className="mt-0.5 h-3 w-3 text-blue-600 rounded focus:ring-blue-500"
      />
      <label className="flex-1 text-gray-700 text-[0.65rem] leading-snug">
        {label}
      </label>
      {hasInput && (
        <input
          type="text"
          className="ml-2 flex-1 p-1 border border-gray-300 rounded text-xs"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
