"use client";
import { useEffect, useRef } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <div
          ref={modalRef}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {vehicle
                    ? "Fahrzeug bearbeiten"
                    : "Neues Fahrzeug hinzufügen"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {vehicle
                    ? "Aktualisieren Sie die Fahrzeugdetails"
                    : "Füllen Sie das Formular aus, um ein neues Fahrzeug hinzuzufügen"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bezeichnung *
                  </label>
                  <div className="relative">
                    <input
                      {...register("name")}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Bezeichnung eingeben"
                    />
                    {errors.name && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Modell *
                  </label>
                  <div className="relative">
                    <input
                      {...register("model")}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.model ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Modell eingeben"
                    />
                    {errors.model && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.model && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.model.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    FIN-Nummer *
                  </label>
                  <div className="relative">
                    <input
                      {...register("vin")}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.vin ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="FIN eingeben"
                    />
                    {errors.vin && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FiAlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.vin && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.vin.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Baujahr
                  </label>
                  <input
                    type="number"
                    {...register("year", { valueAsNumber: true })}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.year ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Baujahr eingeben"
                  />
                  {errors.year && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {errors.year.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fahrzeugtyp *
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="official">Dienstfahrzeug</option>
                    <option value="unofficial">Privatfahrzeug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Verkaufsdatum
                  </label>
                  <input
                    type="date"
                    {...register("dateSoldIn")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reklamation
                </label>
                <textarea
                  {...register("reclamation")}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Reklamationsdetails eingeben"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notizen
                </label>
                <textarea
                  {...register("notes")}
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Zusätzliche Notizen eingeben"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verarbeitung...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} />
                      {vehicle ? "Aktualisieren" : "Speichern"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
