import Image from "next/image";
import tuvLogo from "@/app/(assets)/tuv.png";

export default function KaufvertragForm() {
  return (
    <form className="text-[10px] leading-[1.2] space-y-2  max-w-3xl mx-auto print:max-w-none print:scale-[.92]">
      {/* Header */}
      <header className="flex justify-between items-start mb-1">
        <div className="space-y-0.5">
          <p className="text-[8px] text-gray-600 italic">
            Je ein Exemplar für Käufer und Verkäufer
          </p>
          <h2 className="text-[14px] font-bold text-gray-800">
            Kaufvertrag für ein gebrauchtes Kraftfahrzeug
          </h2>
          <p className="text-[9px] text-gray-600">
            Bitte nur das Zutreffende ankreuzen oder ausfüllen.
          </p>
        </div>
        <Image
          src={tuvLogo}
          alt="TÜV Logo"
          className="w-14 h-auto object-contain print:w-12"
          width={56}
          height={28}
          priority
        />
      </header>

      {/* Section Wrapper */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-1.5 bg-gray-50 border border-gray-300 rounded p-2 print:bg-white">
        {["Verkäufer (privat)", "Käufer"].map((role) => (
          <div key={role} className="space-y-1">
            <h2 className="font-semibold text-[8px] uppercase tracking-wider text-gray-700">
              {role}
            </h2>
            <div className="space-y-0.5">
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
      <section className="border border-gray-300 rounded p-2 bg-gray-50 print:bg-white mt-1">
        <h2 className="font-semibold text-[8px] uppercase tracking-wider text-gray-700 mb-1">
          Kraftfahrzeug
        </h2>
        <div className="grid grid-cols-2 gap-1">
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
      <section className="space-y-1.5 text-[10px] mt-1">
        <div className="grid grid-cols-2 gap-1">
          <FormInput label="Kaufpreis" placeholder="Euro" />
          <FormInput label="In Worten (Euro)" />
        </div>

        <p className="text-gray-700 text-[9px] leading-[1.3] mt-1">
          Das Fahrzeug wird – soweit nicht nachstehend ausdrücklich Garantien
          zugesagt sind – wie besichtigt und probegefahren unter Ausschluss
          jeglicher Haftung für Sachmängel verkauft. ...
        </p>

        <div className="space-y-0.5 mt-1">
          <h3 className="font-semibold text-gray-700 text-[9px]">
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

        <div className="space-y-0.5 mt-1">
          <h3 className="font-semibold text-gray-700 text-[9px]">
            Erklärung des Käufers:
          </h3>
          <FormCheckbox label="Der Käufer meldet das Fahrzeug unverzüglich, spätestens am dritten Werktag nach Übergabe um." />
          <FormCheckbox label="Der Käufer erkennt an, dass das Fahrzeug bis zur vollständigen Erfüllung ..." />
        </div>

        <FormTextarea
          label="Sondervereinbarungen (z. B. Zahlungsbedingungen, Übergabe)"
          className="mt-1"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-2 mt-2">
          {["Verkäufer", "Käufer"].map((role) => (
            <div key={role} className="mt-0">
              <FormInput label="Ort" className="mb-0" />
              <FormInput
                label="Datum"
                defaultValue={getTodayDateDE()}
                placeholder="Datum"
                className="mb-0"
              />
              <p className="text-[8px] text-gray-600 mt-1">
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
        <label className="block text-[8px] text-gray-600 mb-0.5">{label}</label>
      )}
      <input
        type="text"
        className="w-full p-1 border border-gray-300 rounded text-[10px] h-[22px]"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
}

function FormTextarea({ label, defaultValue, className = "", rows = 2 }) {
  return (
    <div className={`${className}`}>
      <label className="block font-semibold text-gray-700 mb-0.5 text-[9px]">
        {label}
      </label>
      <textarea
        className="w-full p-1 border border-gray-300 rounded text-[10px]"
        defaultValue={defaultValue}
        rows={rows}
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
        className="mt-0.5 h-2.5 w-2.5 text-blue-600 rounded focus:ring-blue-500"
      />
      <label className="flex-1 text-gray-700 text-[9px] leading-[1.3]">
        {label}
      </label>
      {hasInput && (
        <input
          type="text"
          className="ml-1 flex-1 p-1 border border-gray-300 rounded text-[10px] h-[20px]"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
