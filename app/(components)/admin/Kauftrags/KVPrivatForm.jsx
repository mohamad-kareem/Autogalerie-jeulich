// KVPrivatForm.jsx
import React from "react";

export default function KVPrivatForm() {
  return (
    <form className="space-y-6 text-sm leading-tight">
      <div className="text-center">
        <h2 className="font-bold text-lg">Kfz-Kaufvertrag</h2>
        <p>Je ein Exemplar für Käufer und Verkäufer</p>
      </div>

      {/* Verkäufer und Käufer */}
      <div className="grid grid-cols-2 gap-4 border rounded p-4">
        <div>
          <h3 className="font-semibold mb-2">Verkäufer (privat)</h3>
          <div className="grid grid-cols-2 gap-2">
            <label>Name, Vorname</label>
            <input type="text" className="border p-1" />
            <label>Straße, Hausnummer</label>
            <input type="text" className="border p-1" />
            <label>PLZ Ort</label>
            <input type="text" className="border p-1" />
            <label>Telefon</label>
            <input type="text" className="border p-1" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Käufer</h3>
          <div className="grid grid-cols-2 gap-2">
            <label>Name, Vorname</label>
            <input type="text" className="border p-1" />
            <label>Straße, Hausnummer</label>
            <input type="text" className="border p-1" />
            <label>PLZ Ort</label>
            <input type="text" className="border p-1" />
            <label>Telefon</label>
            <input type="text" className="border p-1" />
            <label>Pass-/Personalausweis-Nr.</label>
            <input type="text" className="border p-1 col-span-2" />
            <label>ausstellende Behörde</label>
            <input type="text" className="border p-1 col-span-2" />
          </div>
        </div>
      </div>

      {/* Fahrzeugdaten */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Kraftfahrzeug</h3>
        <div className="grid grid-cols-3 gap-2">
          <label>Hersteller</label>
          <input type="text" className="border p-1" />
          <label>Typ</label>
          <input type="text" className="border p-1" />
          <label>Amtliches Kennzeichen</label>
          <input type="text" className="border p-1 col-span-2" />
          <label>Erstzulassung</label>
          <input type="text" className="border p-1" />
          <label>Zulassungsbescheinigung Teil&nbsp;2 (Nr.)</label>
          <input type="text" className="border p-1 col-span-2" />
          <label>Fahrzeug-Ident-Nr.</label>
          <input type="text" className="border p-1 col-span-2" />
          <label>Nächste HU</label>
          <input type="text" className="border p-1" />
          <label>Abgelesener km-Stand</label>
          <input type="text" className="border p-1" />
          <label>Anzahl der Vorbesitzer</label>
          <input type="text" className="border p-1" />
          <label>Mitverkaufte Zubehör/Zusatzausstattung</label>
          <input type="text" className="border p-1 col-span-2" />
        </div>
      </div>

      {/* Kaufpreis */}
      <div className="grid grid-cols-3 gap-2 items-end">
        <label className="col-span-2">Kaufpreis Euro</label>
        <input type="text" className="border p-1" />
        <label className="col-span-3">In Worten (Euro)</label>
        <input type="text" className="border p-1 col-span-3" />
      </div>

      {/* Haftungsausschluss */}
      <p className="text-xs">
        Das Fahrzeug wird – soweit nicht nachstehend ausdrücklich Garantien
        zugesagt sind – wie besichtigt und probegefahren unter Ausschluss
        jeglicher Haftung für Sachmängel verkauft. Der Haftungsausschluss gilt
        nicht für Ersatzansprüche bei Vorsatz oder grober Fahrlässigkeit sowie
        für Personenschäden.
      </p>

      {/* Garantiezusagen */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Garantiezusagen des Verkäufers</h3>
        <div className="flex flex-col space-y-1">
          <label>
            <input type="checkbox" className="mr-2" /> uneingeschränktes
            Eigentum und frei von Rechten Dritter
          </label>
          <label>
            <input type="checkbox" className="mr-2" /> nicht gewerblich genutzt
          </label>
          <label>
            <input type="checkbox" className="mr-2" /> unfallfrei
          </label>
          <label>
            <input type="checkbox" className="mr-2" /> keinen sonstigen Schaden
          </label>
          <div className="flex gap-2">
            <input type="checkbox" className="mt-1" />
            <span>
              Nur folgende Unfallschäden bzw. erhebliche Schäden (Art und
              Umfang):
            </span>
          </div>
          <textarea className="border p-1 h-16" />
        </div>
      </div>

      {/* Käufererklärung */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Erklärung des Käufers</h3>
        <div className="flex flex-col space-y-1">
          <label>
            <input type="checkbox" className="mr-2" /> meldet das Fahrzeug
            unverzüglich, spätestens am dritten Werktag nach Übergabe um.
          </label>
          <label>
            <input type="checkbox" className="mr-2" /> erkennt an, dass das
            Fahrzeug bis zur vollständigen Zahlung Eigentum des Verkäufers
            bleibt.
          </label>
        </div>
      </div>

      {/* Sondervereinbarungen und Unterschriften */}
      <div className="space-y-4">
        <div>
          <label>
            Sondervereinbarungen (z. B. Zahlungsbedingungen, Übergabe)
          </label>
          <textarea className="border p-1 w-full h-20" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>Ort</div>
          <div>Datum</div>
          <div>Unterschrift Verkäufer</div>
          <input type="text" className="border p-1" />
          <input type="text" className="border p-1" />
          <input type="text" className="border p-1" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div></div>
          <div></div>
          <div>Unterschrift Käufer</div>
          <div></div>
          <div></div>
          <input type="text" className="border p-1" />
        </div>
      </div>
    </form>
  );
}
