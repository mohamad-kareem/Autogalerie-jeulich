import image from "@/app/(assets)/tuv.png";
import Image from "next/image";
export default function KaufvertragForm() {
  return (
    <form className="text-sm leading-tight space-y-6 p-4 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-xs italic">
            Je ein Exemplar für Käufer und Verkäufer
          </p>
          <h2 className="text-lg font-bold">
            Kaufvertrag für ein gebrauchtes Kraftfahrzeug
          </h2>
          <p className="text-xs">
            Bitte nur das Zutreffende ankreuzen oder ausfüllen.
          </p>
        </div>

        <Image
          src={image}
          className="w-24 h-auto"
          alt="Logo"
          width={100}
          height={100}
        />
      </div>

      {/* Verkäufer und Käufer */}
      <div className="grid grid-cols-2 gap-4 border border-gray-500 rounded p-3">
        {["Verkäufer (privat)", "Käufer"].map((title) => (
          <div key={title} className="space-y-2">
            <h3 className="font-semibold text-xs uppercase">{title}</h3>
            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs">Name, Vorname</label>
              <input type="text" className="border p-1 bg-blue-50" />

              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="text-xs">PLZ</label>
                  <input type="text" className="border p-1 w-16 bg-blue-50" />
                </div>
                <div className="flex-1">
                  <label className="text-xs">Ort</label>
                  <input type="text" className="border p-1 bg-blue-50" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="text-xs">Straße, Hausnummer</label>
                  <input type="text" className="border p-1 bg-blue-50" />
                </div>
                <div className="flex-1">
                  <label className="text-xs">Telefon</label>
                  <input type="text" className="border p-1 bg-blue-50" />
                </div>
              </div>

              {title === "Käufer" && (
                <>
                  <label className="text-xs">
                    Pass-/Personalausweis-Nr., ausstellende Behörde
                  </label>
                  <input type="text" className="border p-1 bg-blue-50" />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Kraftfahrzeug */}
      <div className="border border-gray-500 rounded p-3 space-y-2">
        <h3 className="font-semibold text-xs uppercase">Kraftfahrzeug</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs">Hersteller</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>
          <div>
            <label className="text-xs">Typ</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>
          <div>
            <label className="text-xs">Amtliches Kennzeichen</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>

          <div>
            <label className="text-xs">Erstzulassung</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>
          <div className="col-span-2">
            <label className="text-xs">
              Zulassungsbescheinigung Teil 2 (ZB-II-Nr.)
            </label>
            <input type="text" className="border p-1 bg-blue-50 w-full" />
          </div>

          <div className="col-span-3">
            <label className="text-xs">Fahrzeug-Ident-Nr.</label>
            <input type="text" className="border p-1 bg-blue-50 w-full" />
          </div>

          <div>
            <label className="text-xs">Nächste HU</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>
          <div>
            <label className="text-xs">Abgelesener km-Stand</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>
          <div>
            <label className="text-xs">Anzahl der Vorbesitzer</label>
            <input type="text" className="border p-1 bg-blue-50" />
          </div>

          <div className="col-span-3">
            <label className="text-xs">
              Mitverkaufte Zubehör/Zusatzausstattung
            </label>
            <input type="text" className="border p-1 bg-blue-50 w-full" />
          </div>
        </div>
      </div>

      {/* Kaufpreis */}
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-2">
          <label className="text-xs">Kaufpreis Euro</label>
          <input type="text" className="border p-1 bg-blue-50 w-full" />
        </div>
        <div>
          <label className="text-xs">In Worten (Euro)</label>
          <input type="text" className="border p-1 bg-blue-50 w-full" />
        </div>
      </div>

      {/* Haftungsausschluss */}
      <p className="text-[10px]">
        Das Fahrzeug wird – soweit nicht nachstehend ausdrücklich Garantien
        zugesagt sind – wie besichtigt und probegefahren unter Ausschluss
        jeglicher Haftung für Sachmängel verkauft. Der Haftungsausschluss gilt
        nicht für Ersatzansprüche bei Vorsatz oder grober Fahrlässigkeit sowie
        für Personenschäden.
      </p>

      {/* Garantiezusagen */}
      <div className="border border-gray-500 rounded p-3 space-y-2">
        <h3 className="font-semibold text-xs uppercase">
          Garantiezusagen des Verkäufers
        </h3>
        <div className="space-y-1 text-[10px]">
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" /> uneingeschränktes
            Eigentum und frei von Rechten Dritter
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" /> nicht gewerblich genutzt
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" /> unfallfrei
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" /> keinen sonstigen
            erheblichen Schaden
          </label>
          <div className="flex items-start space-x-2">
            <input type="checkbox" className="mt-1 mr-1" />
            <span className="text-[10px]">
              Nur folgende Unfallschäden bzw. erhebliche Schäden (Art und
              Umfang):
            </span>
          </div>
          <textarea className="border p-1 bg-blue-50 w-full h-12" />
        </div>
      </div>

      {/* Erklärung des Käufers */}
      <div className="border border-gray-500 rounded p-3 space-y-2">
        <h3 className="font-semibold text-xs uppercase">
          Erklärung des Käufers
        </h3>
        <label className="flex items-center text-[10px]">
          <input type="checkbox" className="mr-1" /> meldet das Fahrzeug
          unverzüglich, spätestens am dritten Werktag nach Übergabe um.
        </label>
        <label className="flex items-center text-[10px]">
          <input type="checkbox" className="mr-1" /> erkennt an, dass das
          Fahrzeug bis zur vollständigen Zahlung Eigentum des Verkäufers bleibt.
        </label>
      </div>

      {/* Sondervereinbarungen / Unterschriften */}
      <div className="space-y-4">
        <div>
          <label className="text-xs">
            Sondervereinbarungen (z.&nbsp;B. Zahlungsbedingungen, Übergabe)
          </label>
          <textarea className="border p-1 bg-blue-50 w-full h-16" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>Ort</div>
          <div>Datum</div>
          <div>Unterschrift Verkäufer</div>
          <input type="text" className="border p-1 bg-blue-50" />
          <input type="text" className="border p-1 bg-blue-50" />
          <input type="text" className="border p-1 bg-blue-50" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div></div>
          <div></div>
          <div>Unterschrift Käufer</div>
          <div></div>
          <div></div>
          <input type="text" className="border p-1 bg-blue-50" />
        </div>
      </div>
    </form>
  );
}
