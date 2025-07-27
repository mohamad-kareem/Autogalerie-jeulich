"use client";
import React, { useState } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function VehicleTable({
  vehicles,
  type,
  onEdit,
  onDelete,
  isLoading,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await onDelete(id);
      toast.success("Fahrzeug erfolgreich gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const typeColors = {
    official: "bg-blue-100/30 border-blue-200 text-blue-800",
    unofficial: "bg-purple-100/30 border-purple-200 text-purple-800",
  };

  const typeLabels = {
    official: "Firmenwagen",
    unofficial: "Testwagen",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6 text-sm sm:text-base">
      <div
        className={`p-4 border-b ${
          typeColors[type] || "bg-gray-100/30 border-gray-200 text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-base sm:text-lg">
            {typeLabels[type] || type}
          </h2>
          <span className="bg-white/80 px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-sm">
            {vehicles.length} {vehicles.length === 1 ? "Fahrzeug" : "Fahrzeuge"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
                Bezeichnung
              </th>
              <th className="px-4 py-2 text-left text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
                Modell
              </th>
              <th className="px-4 py-2 text-left text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
                Verkaufsdatum
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-4 py-4 text-center">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </td>
              </tr>
            ) : vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <React.Fragment key={vehicle._id}>
                  <tr
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(vehicle._id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {vehicle.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {vehicle.dateSoldIn?.slice(0, 10) || "-"}
                    </td>
                  </tr>

                  {expandedRows[vehicle._id] && (
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-4 py-4">
                        <div className="space-y-3 text-sm">
                          {/* FIN at the top - minimal style */}
                          <div className="text-xs text-gray-600">
                            <span className="font-medium text-gray-700 mr-1">
                              FIN:
                            </span>
                            <span className="font-mono text-gray-900 text-sm break-all">
                              {vehicle.vin || "-"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Reklamation */}
                            {vehicle.reclamation && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm sm:col-span-2">
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                                  Reklamation
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                  {vehicle.reclamation
                                    .split("\n")
                                    .map((line, index) => (
                                      <li key={index}>{line}</li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            {/* Notizen */}
                            {vehicle.notes && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm sm:col-span-2">
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                                  Notizen
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                  {vehicle.notes
                                    .split("\n")
                                    .map((line, index) => (
                                      <li key={index}>{line}</li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => onEdit(vehicle)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 text-sm transition-colors px-3 py-1.5 border border-indigo-100 rounded-md bg-indigo-50"
                              title="Bearbeiten"
                            >
                              <FiEdit2 size={14} /> Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle._id)}
                              disabled={deletingId === vehicle._id}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 text-sm transition-colors px-3 py-1.5 border border-red-100 rounded-md bg-red-50 disabled:opacity-50"
                              title="Löschen"
                            >
                              <FiTrash2 size={14} /> Löschen
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-4 text-center text-xs text-gray-500"
                >
                  Keine {typeLabels[type] || type} gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
