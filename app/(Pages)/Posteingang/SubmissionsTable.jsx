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
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function SubmissionsTable({ setUnreadCount }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchSubmissions();
    }
  }, [status, session?.user?.id]);

  const fetchSubmissions = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/submissions?userId=${session.user.id}`);
      const data = await res.json();
      setSubmissions(data.submissions);

      if (setUnreadCount) {
        const unread = data.submissions.filter((s) => !s.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("❌ Error loading submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/submissions?id=${id}&userId=${session?.user?.id}`, {
        method: "PATCH",
      });

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isRead: true } : s))
      );

      if (setUnreadCount) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.warn("Failed to mark as read");
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (
      !confirm("Sind Sie sicher, dass Sie diese Einreichung löschen möchten?")
    )
      return;
    try {
      const res = await fetch(`/api/submissions?id=${submissionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Erfolgreich gelöscht");
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

  const truncateText = (text, maxWords = 5) => {
    if (!text) return "—";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-md rounded-xl shadow-sm p-8 text-center border border-gray-800">
        <FiInfo className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-xl font-medium text-gray-200 mb-2">
          Keine Anfragen gefunden
        </h3>
        <p className="text-gray-400">
          Es wurden noch keine Kontaktanfragen übermittelt
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden"
      >
        {/* Desktop View */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 bg-gray-800 p-4 font-medium text-gray-300 text-xs uppercase tracking-wider border-b border-gray-700">
            <div className="col-span-3">Kontakt</div>
            <div className="col-span-3">Betreff</div>
            <div className="col-span-3">Fahrzeug</div>
            <div className="col-span-2">Datum</div>
            <div className="col-span-1 text-right">Aktionen</div>
          </div>

          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="grid grid-cols-12 p-4 border-b border-gray-800 hover:bg-black/50 transition-colors items-center cursor-pointer"
              onClick={() => {
                setSelectedSubmission(submission);
                if (!submission.isRead) markAsRead(submission._id);
              }}
            >
              <div className="col-span-3">
                <p className="font-medium text-gray-200 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-900/40 text-slate-300 text-sm font-semibold shadow-sm border border-slate-800/50">
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </span>

                  <span className="truncate">{submission.name || "—"}</span>

                  {!submission.isRead && (
                    <span
                      className="ml-2 relative flex h-3 w-3"
                      title="Ungelesen"
                      aria-label="Ungelesen"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-600 shadow"></span>
                    </span>
                  )}
                </p>

                <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <FiMail className="text-slate-400" size={14} />
                  <span className="truncate">{submission.email || "—"}</span>
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-gray-300 font-medium truncate">
                  {submission.subject || "Kein Betreff"}
                </p>
              </div>
              <div className="col-span-3">
                {submission.carName ? (
                  <div className="flex items-center gap-2">
                    <FaCar className="text-slate-400" />
                    <div>
                      <p className="text-gray-300 truncate">
                        {truncateText(submission.carName, 3)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Kein Fahrzeug</span>
                )}
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <FiCalendar className="text-slate-400" size={14} />
                  <span>{formatDate(submission.createdAt)}</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                    if (!submission.isRead) markAsRead(submission._id);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-600 rounded-md transition-colors duration-200 border border-gray-700 hover:border-slate-500"
                  title="Details anzeigen"
                >
                  <FiEye />
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
              className="border-b border-gray-800 last:border-b-0 hover:bg-black/50 transition-colors"
            >
              <div
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => {
                  setSelectedSubmission(submission);
                  if (!submission.isRead) markAsRead(submission._id);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-900/40 text-slate-300 text-sm font-semibold shadow-sm border border-slate-800/50">
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </span>

                  <div>
                    <p className="font-medium text-gray-200 flex items-center gap-1">
                      {submission.name || "—"}
                      {!submission.isRead && (
                        <span
                          className="ml-2 inline-flex h-2 w-2 rounded-full bg-slate-600 ring-2 ring-gray-900 shadow-sm"
                          title="Ungelesen"
                          aria-label="Ungelesen"
                        ></span>
                      )}
                    </p>

                    <p className="text-sm text-gray-400">
                      {submission.subject || "Kein Betreff"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FiCalendar size={12} />
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                    if (!submission.isRead) markAsRead(submission._id);
                  }}
                  className="p-2 text-gray-400 hover:text-slate-400 rounded-md hover:bg-slate-900/20 transition-colors border border-gray-700"
                  title="Details anzeigen"
                >
                  <FiEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full mx-4 border border-gray-800">
              <div className="bg-gradient-to-r from-black to-slate-900 px-6 py-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-900/40 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-300 border border-slate-800/50">
                      {selectedSubmission.name?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-white">
                        Anfrage von {selectedSubmission.name}
                      </h3>
                      <p className="text-gray-300 mt-1 text-xs md:text-xs flex items-center gap-1">
                        <FiCalendar size={14} />
                        {formatDate(selectedSubmission.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-white transition-colors hover:bg-slate-600/20 p-1 rounded-md"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-4 md:px-6 py-4 max-h-[70vh] overflow-y-auto custom-scroll">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Name
                      </p>
                      <p className="text-gray-200 font-medium flex items-center gap-2">
                        <FiUser className="text-slate-400" />
                        {selectedSubmission.name || "—"}
                      </p>
                    </div>
                    {selectedSubmission.carLink && (
                      <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Fahrzeug-Link
                        </p>
                        <p className="text-gray-200 font-medium flex items-center gap-2">
                          <FiNavigation className="text-slate-400" />
                          <a
                            href={selectedSubmission.carLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 underline hover:text-slate-300"
                          >
                            Zum Fahrzeug
                          </a>
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        E-Mail
                      </p>
                      <p className="text-gray-200 font-medium flex items-center gap-2">
                        <FiMail className="text-slate-400" />
                        {selectedSubmission.email || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Telefon
                      </p>
                      <p className="text-gray-200 font-medium flex items-center gap-2">
                        <FiPhone className="text-slate-400" />
                        {selectedSubmission.phone || "—"}
                      </p>
                    </div>
                    {selectedSubmission.date && (
                      <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Terminwunsch
                        </p>
                        <p className="text-gray-200 font-medium flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />
                          {formatDate(selectedSubmission.date)}
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Betreff
                      </p>
                      <p className="text-gray-200 font-medium flex items-center gap-2">
                        <FiInfo className="text-slate-400" />
                        {selectedSubmission.subject || "—"}
                      </p>
                    </div>
                    {selectedSubmission.carName && (
                      <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800 w-176">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Fahrzeug
                        </p>
                        <p className="text-gray-200 font-medium flex items-center gap-2">
                          <FaCar className="text-slate-400" />
                          {selectedSubmission.carName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                    <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
                      <FiMessageSquare className="mr-2 text-slate-400" />
                      Nachricht
                    </h4>
                    <div className="bg-gray-900/60 p-4 rounded border border-gray-800">
                      <p className="text-gray-300 whitespace-pre-line">
                        {selectedSubmission.message || "Keine Nachricht"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 px-6 py-2 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t border-gray-700">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-2 py-2 border text-xs border-gray-700 rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-600 focus:outline-none transition-colors"
                >
                  Schließen
                </button>
                <button
                  onClick={() => handleDeleteSubmission(selectedSubmission._id)}
                  className="px-2 py-2 border text-xs  border-transparent rounded-lg shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none transition-colors"
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
