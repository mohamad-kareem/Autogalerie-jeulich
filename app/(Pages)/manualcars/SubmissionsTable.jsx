"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FiTrash2,
  FiEye,
  FiX,
  FiMail,
  FiPhone,
  FiInfo,
  FiMessageSquare,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiNavigation,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function SubmissionsTable() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      const res = await fetch(`/api/submissions?id=${submissionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Submission deleted successfully");
        setSubmissions((prev) => prev.filter((s) => s._id !== submissionId));
        setSelectedSubmission(null);
      } else {
        toast.error("Error deleting submission");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("de-DE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Ungültiges Datum";
    }
  };

  const truncateText = (text, maxWords = 6) => {
    if (!text) return "—";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-500"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <FiInfo className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          Keine Anfragen gefunden
        </h3>
        <p className="text-gray-500">
          Es wurden noch keine Kontaktanfragen übermittelt
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {/* Desktop View */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 bg-gradient-to-r from-black-50 to-red-50 p-4 font-medium text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-3">Kontakt</div>
            <div className="col-span-3">Betreff</div>
            <div className="col-span-3">Fahrzeug</div>
            <div className="col-span-2">Datum</div>
            <div className="col-span-1 text-right">Aktionen</div>
          </div>

          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="grid grid-cols-12 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
            >
              <div className="col-span-3">
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-black-100 text-black-800">
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                  <span className="truncate">{submission.name || "—"}</span>
                </p>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <FiMail className="text-black-400" size={14} />
                  <span className="truncate">{submission.email || "—"}</span>
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-gray-700 font-medium truncate">
                  {submission.subject || "Kein Betreff"}
                </p>
              </div>
              <div className="col-span-3">
                {submission.carName ? (
                  <div className="flex items-center gap-2">
                    <FaCar className="text-red-900" />
                    <div>
                      <p className="text-gray-700 truncate">
                        {truncateText(submission.carName)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">Kein Fahrzeug</span>
                )}
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <FiCalendar className="text-black-400" size={14} />
                  <span>{formatDate(submission.createdAt)}</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end items-center gap-1">
                <button
                  onClick={() => setSelectedSubmission(submission)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200"
                  title="Details anzeigen"
                >
                  <FiEye />
                </button>
                <button
                  onClick={() => handleDeleteSubmission(submission._id)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200"
                  title="Anfrage löschen"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="border-b border-gray-200 last:border-b-0"
            >
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-black-100 text-black-800">
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {submission.name || "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.subject || "Kein Betreff"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <FiCalendar size={12} />
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(submission)}
                  className="p-2 text-gray-500 hover:text-black-600 rounded-md hover:bg-black-50 transition-colors"
                  title="Details anzeigen"
                >
                  <FiEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full mx-4">
              <div className="bg-gradient-to-r from-black to-red-900 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black-500 text-black">
                      {selectedSubmission.name?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white ">
                        Anfrage von {selectedSubmission.name}
                      </h3>
                      <p className="text-gray-200 mt-1 text-xs md:text-xs flex items-center gap-1">
                        <FiCalendar size={14} />
                        {formatDate(selectedSubmission.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-black-100 hover:text-white transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-4 md:px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </p>
                      <p className="text-gray-800 font-medium flex items-center gap-2">
                        <FiUser className="text-black-600" />
                        {selectedSubmission.name || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-Mail
                      </p>
                      <p className="text-gray-800 font-medium flex items-center gap-2">
                        <FiMail className="text-black-600" />
                        {selectedSubmission.email || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </p>
                      <p className="text-gray-800 font-medium flex items-center gap-2">
                        <FiPhone className="text-black-600" />
                        {selectedSubmission.phone || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betreff
                      </p>
                      <p className="text-gray-800 font-medium flex items-center gap-2">
                        <FiInfo className="text-black-600" />
                        {selectedSubmission.subject || "—"}
                      </p>
                    </div>
                    {selectedSubmission.carName && (
                      <>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fahrzeug
                          </p>
                          <p className="text-gray-800 font-medium flex items-center gap-2">
                            <FaCar className="text-red-500" />
                            {selectedSubmission.carName}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiMessageSquare className="mr-2 text-black-600" />
                      Nachricht
                    </h4>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-line">
                        {selectedSubmission.message || "Keine Nachricht"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  Schließen
                </button>
                <button
                  onClick={() => handleDeleteSubmission(selectedSubmission._id)}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none transition-colors"
                >
                  Anfrage löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
