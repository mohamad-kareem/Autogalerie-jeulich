"use client";
import React, { useState } from "react";
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
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
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const typeColors = {
    official: "bg-blue-50 border-blue-100 text-blue-800",
    unofficial: "bg-purple-50 border-purple-100 text-purple-800",
  };

  const typeLabels = {
    official: "Dienstfahrzeuge",
    unofficial: "Privatfahrzeuge",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div
        className={`p-4 border-b ${
          typeColors[type] || "bg-gray-50 border-gray-100 text-gray-800"
        }`}
      >
        <h2 className="font-semibold text-base sm:text-lg">
          {typeLabels[type] || type} ({vehicles.length})
        </h2>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                FIN
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bezeichnung
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modell
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ) : vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <React.Fragment key={vehicle._id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRow(vehicle._id)}
                  >
                    <td className="px-4 py-4 text-sm font-mono text-gray-900">
                      {vehicle.vin}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {vehicle.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(vehicle);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
                          title="Bearbeiten"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vehicle._id);
                          }}
                          className="text-red-600 hover:text-red-900 disabled:text-red-300 transition-colors p-1 rounded hover:bg-red-50"
                          title="Löschen"
                          disabled={deletingId === vehicle._id}
                        >
                          <FiTrash2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleRow(vehicle._id)}
                          className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded hover:bg-gray-100"
                          title="Details"
                        >
                          {expandedRows[vehicle._id] ? (
                            <FiChevronUp size={16} />
                          ) : (
                            <FiChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRows[vehicle._id] && (
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1 text-gray-500 font-medium">
                                Verkaufsdatum:
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {vehicle.dateSoldIn?.slice(0, 10) || "-"}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1 text-gray-500 font-medium">
                                Reklamation:
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {vehicle.reclamation || "-"}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1 text-gray-500 font-medium">
                                Vor Verkauf benötigt:
                              </div>
                              <div className="col-span-2 text-gray-700">
                                {vehicle.needsBeforeSelling || "-"}
                              </div>
                            </div>
                          </div>
                          {vehicle.notes && (
                            <div className="col-span-full pt-2 border-t border-gray-200">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1 text-gray-500 font-medium">
                                  Notizen:
                                </div>
                                <div className="col-span-2 text-gray-700">
                                  {vehicle.notes}
                                </div>
                              </div>
                            </div>
                          )}
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
                  className="px-4 py-4 text-center text-sm text-gray-500"
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
