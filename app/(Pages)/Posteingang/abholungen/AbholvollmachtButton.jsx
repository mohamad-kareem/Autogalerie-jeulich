"use client";

// "Vollmacht" on a pickup card: the dealer authorises the driver to collect the
// bought car and to sign its Kaufvertrag. The form opens with everything that is
// already known, the rest is typed in and printed.

import { useState } from "react";
import { FileSignature, Printer } from "lucide-react";
import { Field, Modal } from "@/app/(components)/sales/ui";
import { VOLLMACHT_GIVER_KEY, abholvollmachtDefaults, printAbholvollmacht } from "@/lib/abholvollmacht";

function GroupTitle({ children }) {
  return (
    <div className="col-span-6 flex items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d6671]">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export default function AbholvollmachtButton({ pickup }) {
  const [values, setValues] = useState(null);
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  function print() {
    // The dealer's own name and address stay the same – remember them for the next time.
    try {
      const { giverName, giverStreet, giverCity } = values;
      window.localStorage.setItem(VOLLMACHT_GIVER_KEY, JSON.stringify({ giverName, giverStreet, giverCity }));
    } catch {
      // storage blocked: the fields simply start with the company address again
    }
    printAbholvollmacht(values);
    setValues(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setValues(abholvollmachtDefaults(pickup))}
        className="ind-act"
        title="Vollmacht für den Fahrer"
        aria-label="Vollmacht für den Fahrer"
      >
        <FileSignature className="h-3.5 w-3.5" />
      </button>

      {values ? (
        <Modal
          open
          onClose={() => setValues(null)}
          title="Vollmacht für den Fahrer"
          width="max-w-lg"
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setValues(null)}>
                Abbrechen
              </button>
              <button type="button" className="btn btn-primary" onClick={print}>
                <Printer /> Drucken
              </button>
            </>
          }
        >
          <div className="grid grid-cols-6 gap-x-3 gap-y-2.5">
            <GroupTitle>Vollmachtgeber</GroupTitle>
            <Field label="Name" id="v-giver" className="col-span-6">
              <input id="v-giver" className="field" value={values.giverName} onChange={set("giverName")} />
            </Field>
            <Field label="Straße, Nr." id="v-giver-street" className="col-span-6 sm:col-span-3">
              <input id="v-giver-street" className="field" value={values.giverStreet} onChange={set("giverStreet")} />
            </Field>
            <Field label="PLZ, Ort" id="v-giver-city" className="col-span-6 sm:col-span-3">
              <input id="v-giver-city" className="field" value={values.giverCity} onChange={set("giverCity")} />
            </Field>

            <GroupTitle>Bevollmächtigter (Fahrer)</GroupTitle>
            <Field label="Name" id="v-driver" className="col-span-6">
              <input id="v-driver" className="field" value={values.driverName} onChange={set("driverName")} />
            </Field>
            <Field label="Straße, Nr." id="v-driver-street" className="col-span-6 sm:col-span-3">
              <input id="v-driver-street" className="field" value={values.driverStreet} onChange={set("driverStreet")} />
            </Field>
            <Field label="PLZ, Ort" id="v-driver-city" className="col-span-6 sm:col-span-3">
              <input id="v-driver-city" className="field" value={values.driverCity} onChange={set("driverCity")} />
            </Field>

            <GroupTitle>Fahrzeug</GroupTitle>
            <Field label="Bezeichnung" id="v-vehicle" className="col-span-6">
              <input id="v-vehicle" className="field" value={values.vehicle} onChange={set("vehicle")} />
            </Field>
            <Field label="Erstzulassung" id="v-ez" className="col-span-3">
              <input id="v-ez" className="field" value={values.firstRegistration} onChange={set("firstRegistration")} />
            </Field>
            <Field label="Preis" id="v-price" className="col-span-3">
              <input id="v-price" className="field" value={values.price} onChange={set("price")} />
            </Field>

            <Field label="Ort" id="v-place" className="col-span-3">
              <input id="v-place" className="field" value={values.place} onChange={set("place")} />
            </Field>
            <Field label="Datum" id="v-date" className="col-span-3">
              <input id="v-date" type="date" className="field" value={values.date} onChange={set("date")} />
            </Field>

            <label className="col-span-6 inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={values.stamp}
                onChange={(event) => setValues((current) => ({ ...current, stamp: event.target.checked }))}
                className="h-4 w-4 cursor-pointer rounded accent-navy-900"
              />
              Firmenstempel bei der Unterschrift
            </label>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
