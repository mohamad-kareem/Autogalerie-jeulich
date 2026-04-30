"use client";

import { useState, useEffect, useCallback } from "react";
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

  const cardBg = darkMode ? "bg-gray-900/80" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-slate-200";
  const headerBg = darkMode ? "bg-gray-900" : "bg-slate-100";
  const rowHover = darkMode ? "hover:bg-gray-900/70" : "hover:bg-slate-50";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const updateUnreadCount = useCallback(
    (list) => {
      const unread = list.filter((item) => !item.isRead).length;
      setUnreadCount?.(unread);
    },
    [setUnreadCount],
  );

  const fetchSubmissions = useCallback(
    async (showLoader = false) => {
      if (!session?.user?.id) return;

      if (showLoader) setIsLoading(true);

      try {
        const res = await fetch(`/api/submissions?userId=${session.user.id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load submissions");
        }

        const list = data.submissions || [];

        setSubmissions(list);
        updateUnreadCount(list);
      } catch (error) {
        console.error("Error loading submissions:", error);
        toast.error("Anfragen konnten nicht geladen werden");
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [session?.user?.id, updateUnreadCount],
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    fetchSubmissions(true);

    const intervalId = setInterval(() => {
      fetchSubmissions(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [status, session?.user?.id, fetchSubmissions]);

  const markAsRead = async (id) => {
    if (!id || !session?.user?.id) return;

    const currentItem = submissions.find((item) => item._id === id);
    if (currentItem?.isRead) return;

    const updatedList = submissions.map((item) =>
      item._id === id ? { ...item, isRead: true } : item,
    );

    setSubmissions(updatedList);
    updateUnreadCount(updatedList);

    try {
      const res = await fetch(
        `/api/submissions?id=${id}&userId=${session.user.id}`,
        { method: "PATCH" },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      fetchSubmissions(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (
      !confirm(
        "Sind Sie sicher, dass Sie diese Anfrage endgültig löschen möchten?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/submissions?id=${submissionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      const updatedList = submissions.filter(
        (item) => item._id !== submissionId,
      );

      setSubmissions(updatedList);
      updateUnreadCount(updatedList);
      setSelectedSubmission(null);

      toast.success("Anfrage erfolgreich gelöscht");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Fehler beim Löschen der Anfrage");
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
    return words.length <= maxWords
      ? text
      : `${words.slice(0, maxWords).join(" ")}...`;
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
                markAsRead(submission._id);
              }}
            >
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
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 shadow" />
                    </span>
                  )}
                </p>

                <div
                  className={`mt-1 flex items-center gap-1 text-[11px] ${textMuted}`}
                >
                  <FiMail size={13} />
                  <span className="truncate">{submission.email || "—"}</span>
                </div>
              </div>

              <div className="col-span-3">
                <p
                  className={`truncate font-medium ${
                    darkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {submission.subject || "Kein Betreff"}
                </p>
              </div>

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

              <div className="col-span-2">
                <div
                  className={`flex items-center gap-1 text-[14px] ${textMuted}`}
                >
                  <FiCalendar size={13} />
                  <span>{formatDate(submission.createdAt)}</span>
                </div>
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                    markAsRead(submission._id);
                  }}
                  className={`p-1.5 rounded-md text-xs border transition-colors ${
                    darkMode
                      ? "border-gray-700 text-slate-300 hover:bg-gray-800"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FiEye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

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
                  markAsRead(submission._id);
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
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
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

                <FiEye className={textMuted} size={16} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${
              darkMode ? "bg-gray-900/80" : "bg-gray-800/60"
            } backdrop-blur-sm`}
            onClick={() => setSelectedSubmission(null)}
          />

          <div
            className={`relative z-10 w-full max-w-2xl mx-auto rounded-xl shadow-xl ${
              darkMode
                ? "bg-gray-900 border border-gray-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <div
              className={`px-5 py-3 border-b ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-base font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {selectedSubmission.name || "Unbekannter Kontakt"}
                </h3>

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className={`p-1.5 rounded-lg ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox darkMode={darkMode} title="Kontaktdaten">
                  <p className="flex items-center gap-2">
                    <FiMail /> {selectedSubmission.email || "—"}
                  </p>

                  {selectedSubmission.phone && (
                    <p className="flex items-center gap-2">
                      <FiPhone /> {selectedSubmission.phone}
                    </p>
                  )}
                </InfoBox>

                <InfoBox darkMode={darkMode} title="Fahrzeug / Betreff">
                  <p>
                    {selectedSubmission.carName || "Kein Fahrzeug angegeben"}
                  </p>

                  {selectedSubmission.carLink && (
                    <a
                      href={selectedSubmission.carLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 text-sm"
                    >
                      <FiExternalLink />
                      Zum Fahrzeug
                    </a>
                  )}

                  <p className="mt-2 font-medium">
                    {selectedSubmission.subject || "Allgemeine Anfrage"}
                  </p>
                </InfoBox>
              </div>

              <InfoBox darkMode={darkMode} title="Nachricht">
                <p className="whitespace-pre-wrap">
                  {selectedSubmission.message || "Keine Nachricht vorhanden."}
                </p>
              </InfoBox>
            </div>

            <div
              className={`px-5 py-3 border-t flex justify-end gap-2 ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => {
                  if (selectedSubmission.email) {
                    window.location.href = `mailto:${
                      selectedSubmission.email
                    }?subject=${encodeURIComponent(
                      `Antwort: ${selectedSubmission.subject || ""}`,
                    )}`;
                  }
                }}
                className="px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FiMail size={14} />
                Antworten
              </button>

              <button
                onClick={() => handleDeleteSubmission(selectedSubmission._id)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 ${
                  darkMode
                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                    : "bg-red-50 hover:bg-red-100 text-red-600"
                }`}
              >
                <FiTrash2 size={14} />
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoBox({ title, children, darkMode }) {
  return (
    <div
      className={`rounded-lg p-4 text-sm space-y-2 ${
        darkMode ? "bg-gray-800/40 text-gray-200" : "bg-gray-50 text-gray-800"
      }`}
    >
      <h4
        className={`text-xs font-semibold uppercase tracking-wider ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {title}
      </h4>

      {children}
    </div>
  );
}
