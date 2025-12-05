// app/(components)/SubmissionsTable.jsx
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
  FiCalendar,
  FiNavigation,
  FiTag,
  FiExternalLink,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function SubmissionsTable({ setUnreadCount, darkMode = false }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  // Theme helpers
  const cardBg = darkMode ? "bg-gray-900/80" : "bg-white";
  const cardBgSoft = darkMode ? "bg-gray-900/60" : "bg-slate-50";
  const borderColor = darkMode ? "border-gray-700" : "border-slate-200";
  const headerBg = darkMode ? "bg-gray-900" : "bg-slate-100";
  const rowHover = darkMode ? "hover:bg-gray-900/70" : "hover:bg-slate-50";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  const fetchSubmissions = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/submissions?userId=${session.user.id}`);
      const data = await res.json();
      const list = data.submissions || [];
      setSubmissions(list);

      if (setUnreadCount) {
        const unread = list.filter((s) => !s.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("❌ Error loading submissions:", error);
      toast.error("Anfragen konnten nicht geladen werden");
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
      !confirm(
        "Sind Sie sicher, dass Sie diese Anfrage endgültig löschen möchten?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/submissions?id=${submissionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Anfrage erfolgreich gelöscht");
        setSubmissions((prev) => prev.filter((s) => s._id !== submissionId));
        setSelectedSubmission(null);
      } else {
        toast.error("Fehler beim Löschen der Anfrage");
      }
    } catch {
      toast.error("Netzwerkfehler beim Löschen");
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
      <div className="flex justify-center items-center min-h-[260px]">
        <div
          className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div
        className={`rounded-xl border px-6 py-8 text-center shadow-sm ${cardBg} ${borderColor}`}
      >
        <FiInfo
          className={`mx-auto mb-4 text-4xl ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <h3
          className={`text-lg font-semibold mb-1 ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Keine Anfragen gefunden
        </h3>
        <p className={`text-sm ${textSecondary}`}>
          Es wurden bisher keine Kontaktanfragen übermittelt.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={`rounded-xl border overflow-hidden shadow-sm ${cardBg} ${borderColor}`}
      >
        {/* Desktop View */}
        <div className="hidden md:block">
          <div
            className={`grid grid-cols-12 px-4 py-3 border-b text-[11px] font-medium uppercase tracking-wider ${headerBg} ${
              darkMode
                ? "border-gray-800 text-slate-300"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <div className="col-span-3">Kontakt</div>
            <div className="col-span-3">Betreff</div>
            <div className="col-span-3">Fahrzeug</div>
            <div className="col-span-2">Datum</div>
            <div className="col-span-1 text-right">Aktion</div>
          </div>

          {submissions.map((submission) => (
            <div
              key={submission._id}
              className={`grid grid-cols-12 px-4 py-3 border-b text-base items-center cursor-pointer transition-colors duration-200 ${
                darkMode ? "border-gray-800" : "border-slate-200"
              } ${rowHover}`}
              onClick={() => {
                setSelectedSubmission(submission);
                if (!submission.isRead) markAsRead(submission._id);
              }}
            >
              {/* Kontakt */}
              <div className="col-span-3">
                <p
                  className={`flex items-center gap-2 font-medium ${
                    darkMode ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-sm border ${
                      darkMode
                        ? "bg-gray-900 text-slate-200 border-gray-700"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </span>

                  <span className="truncate">
                    {submission.name || "Unbekannt"}
                  </span>

                  {!submission.isRead && (
                    <span
                      className="ml-1 relative flex h-3 w-3"
                      title="Ungelesen"
                      aria-label="Ungelesen"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-600 shadow" />
                    </span>
                  )}
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[11px] ${textMuted}`}
                >
                  <FiMail size={13} className="flex-shrink-0" />
                  <span className="truncate">{submission.email || "—"}</span>
                </div>
              </div>

              {/* Betreff */}
              <div className="col-span-3">
                <p
                  className={`truncate font-medium ${
                    darkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {submission.subject || "Kein Betreff"}
                </p>
              </div>

              {/* Fahrzeug */}
              <div className="col-span-3">
                {submission.carName ? (
                  <div className="flex items-center gap-2">
                    <FaCar
                      className={darkMode ? "text-slate-400" : "text-slate-500"}
                    />
                    <p className={`${textSecondary} truncate`}>
                      {truncateText(submission.carName, 4)}
                    </p>
                  </div>
                ) : (
                  <span className={textMuted}>Kein Fahrzeug</span>
                )}
              </div>

              {/* Datum */}
              <div className="col-span-2">
                <div
                  className={`flex items-center gap-1 text-[14px] ${textMuted}`}
                >
                  <FiCalendar size={13} />
                  <span>{formatDate(submission.createdAt)}</span>
                </div>
              </div>

              {/* Aktionen */}
              <div className="col-span-1 flex justify-end items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                    if (!submission.isRead) markAsRead(submission._id);
                  }}
                  className={`p-1.5 rounded-md text-xs border transition-colors ${
                    darkMode
                      ? "border-gray-700 text-slate-300 hover:bg-gray-800 hover:border-slate-500"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                  }`}
                  title="Details anzeigen"
                >
                  <FiEye size={14} />
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
              className={`border-b ${
                darkMode ? "border-gray-800" : "border-slate-200"
              }`}
            >
              <div
                className={`px-4 py-3 flex items-center justify-between cursor-pointer ${rowHover}`}
                onClick={() => {
                  setSelectedSubmission(submission);
                  if (!submission.isRead) markAsRead(submission._id);
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border shadow-sm ${
                      darkMode
                        ? "bg-gray-900 text-slate-200 border-gray-700"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {submission.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                  <div>
                    <p
                      className={`flex items-center gap-1 text-sm font-medium ${
                        darkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {submission.name || "Unbekannt"}
                      {!submission.isRead && (
                        <span
                          className="inline-flex h-2 w-2 rounded-full bg-slate-600 ring-2 ring-black/40"
                          title="Ungelesen"
                          aria-label="Ungelesen"
                        />
                      )}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      {submission.subject || "Kein Betreff"}
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1 text-[11px] ${textMuted}`}
                    >
                      <FiCalendar size={11} />
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
                  className={`p-2 rounded-md border text-xs transition-colors ${
                    darkMode
                      ? "border-gray-700 text-slate-300 hover:bg-gray-800"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Details anzeigen"
                >
                  <FiEye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 ${
              darkMode
                ? "bg-gray-900/80 backdrop-blur-sm"
                : "bg-gray-800/60 backdrop-blur-sm"
            }`}
            onClick={() => setSelectedSubmission(null)}
          />

          {/* Compact Modal Container */}
          <div
            className={`relative z-10 w-full max-w-2xl mx-auto rounded-xl shadow-xl ${
              darkMode
                ? "bg-gray-900 border border-gray-800"
                : "bg-white border border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact HEADER */}
            <div
              className={`px-5 py-3 border-b ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg ${
                      darkMode
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <FiUser size={18} />
                  </div>
                  <div>
                    <h3
                      className={`text-base font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {selectedSubmission.name || "Unbekannter Kontakt"}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 flex items-center gap-1 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <FiCalendar size={12} />
                      Eingang: {formatDate(selectedSubmission.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className={`p-1.5 rounded-lg ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Compact BODY - Improved Alignment */}
            <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Contact & Vehicle Row - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Info Card */}
                  <div
                    className={`rounded-lg p-3 ${
                      darkMode ? "bg-gray-800/40" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                        size={14}
                      />
                      <h4
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Kontaktdaten
                      </h4>
                    </div>
                    <div className="space-y-2 pl-1">
                      <div className="flex items-center gap-2">
                        <FiMail
                          className={`flex-shrink-0 ${
                            darkMode ? "text-blue-400" : "text-blue-500"
                          }`}
                          size={14}
                        />
                        <span
                          className={`text-sm truncate ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {selectedSubmission.email || "—"}
                        </span>
                      </div>
                      {selectedSubmission.phone && (
                        <div className="flex items-center gap-2">
                          <FiPhone
                            className={`flex-shrink-0 ${
                              darkMode ? "text-green-400" : "text-green-500"
                            }`}
                            size={14}
                          />
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            {selectedSubmission.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle & Subject Card */}
                  <div
                    className={`rounded-lg p-3 ${
                      darkMode ? "bg-gray-800/40" : "bg-gray-50"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Vehicle Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FaCar
                            className={
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }
                            size={14}
                          />
                          <h4
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Fahrzeug
                          </h4>
                        </div>
                        <div className="pl-1">
                          {selectedSubmission.carName ? (
                            <>
                              <p
                                className={`text-sm mb-1 ${
                                  darkMode ? "text-gray-200" : "text-gray-800"
                                }`}
                              >
                                {selectedSubmission.carName}
                              </p>
                              {selectedSubmission.carLink && (
                                <a
                                  href={selectedSubmission.carLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs inline-flex items-center gap-1 hover:underline ${
                                    darkMode
                                      ? "text-blue-400 hover:text-blue-300"
                                      : "text-blue-600 hover:text-blue-800"
                                  }`}
                                >
                                  <FiExternalLink size={12} />
                                  Zum Fahrzeug →
                                </a>
                              )}
                            </>
                          ) : (
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Kein Fahrzeug angegeben
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FiTag
                            className={
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }
                            size={14}
                          />
                          <h4
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Betreff
                          </h4>
                        </div>
                        <p
                          className={`text-sm pl-1 ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {selectedSubmission.subject || "Allgemeine Anfrage"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message - Full Width Below */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiMessageSquare
                      className={darkMode ? "text-gray-400" : "text-gray-500"}
                      size={14}
                    />
                    <h4
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Nachricht
                    </h4>
                  </div>
                  <div
                    className={`rounded-lg p-4 min-h-[120px] ${
                      darkMode
                        ? "bg-gray-800/40 border border-gray-700"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <p
                      className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {selectedSubmission.message ||
                        "Keine Nachricht vorhanden."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact FOOTER - Clean without ID */}
            <div
              className={`px-5 py-3 border-t ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className={darkMode ? "text-gray-500" : "text-gray-500"}>
                    {/* Empty - No ID shown */}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedSubmission.email) {
                        window.location.href = `mailto:${selectedSubmission.email}?subject=Antwort: ${selectedSubmission.subject}`;
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    disabled={!selectedSubmission.email}
                  >
                    <FiMail size={14} />
                    Antworten
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteSubmission(selectedSubmission._id)
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 ${
                      darkMode
                        ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300"
                        : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                    }`}
                  >
                    <FiTrash2 size={14} />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
