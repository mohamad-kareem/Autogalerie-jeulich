"use client";
import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";

const vehicleSchema = z.object({
  vin: z.string().min(1, "FIN ist erforderlich").max(50),
  name: z.string().min(1, "Bezeichnung ist erforderlich").max(100),
  model: z.string().min(1, "Modell ist erforderlich").max(100),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  type: z.enum(["official", "unofficial"]),
  dateSoldIn: z.string().optional(),
  reclamation: z.string().max(500).optional(),
  needsBeforeSelling: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export default function VehicleModal({
  isOpen,
  onClose,
  vehicle,
  onSubmit: externalOnSubmit,
}) {
  const modalRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: "",
      name: "",
      model: "",
      year: undefined,
      type: "official",
      dateSoldIn: "",
      reclamation: "",
      needsBeforeSelling: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        ...vehicle,
        dateSoldIn: vehicle.dateSoldIn?.split("T")[0] || "",
      });
    } else {
      reset();
    }
  }, [vehicle, reset]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      await externalOnSubmit({
        ...data,
        vin: data.vin.toUpperCase(),
        year: data.year ? parseInt(data.year) : undefined,
        dateSoldIn: data.dateSoldIn || undefined,
      });
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <div
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-start">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {vehicle ? "Fahrzeug bearbeiten" : "Neues Fahrzeug hinzufügen"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FIN-Nummer *
                  </label>
                  <input
                    {...register("vin")}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.vin ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="FIN eingeben"
                  />
                  {errors.vin && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.vin.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezeichnung *
                  </label>
                  <input
                    {...register("name")}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Bezeichnung eingeben"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modell *
                  </label>
                  <input
                    {...register("model")}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.model ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Modell eingeben"
                  />
                  {errors.model && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.model.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baujahr
                  </label>
                  <input
                    type="number"
                    {...register("year", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.year ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Baujahr eingeben"
                  />
                  {errors.year && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.year.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fahrzeugtyp *
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="official">Dienstfahrzeug</option>
                    <option value="unofficial">Privatfahrzeug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verkaufsdatum
                  </label>
                  <input
                    type="date"
                    {...register("dateSoldIn")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reklamation
                </label>
                <textarea
                  {...register("reclamation")}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Reklamationsdetails eingeben"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vor Verkauf benötigt
                </label>
                <textarea
                  {...register("needsBeforeSelling")}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Erforderliche Arbeiten vor Verkauf"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  {...register("notes")}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Zusätzliche Notizen eingeben"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Wird verarbeitet..."
                    : vehicle
                    ? "Aktualisieren"
                    : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
