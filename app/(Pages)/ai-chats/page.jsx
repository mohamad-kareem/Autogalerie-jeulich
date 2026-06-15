"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Archive,
  ArchiveRestore,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  User,
} from "lucide-react";

export default function AIChatsAdminPage() {
  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [loadingList, setLoadingList] = useState(true);

  const [loadingConversation, setLoadingConversation] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [status, setStatus] = useState("open");

  const [page, setPage] = useState(1);

  const [unreadCount, setUnreadCount] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [error, setError] = useState("");

  /* -------------------------------------------------------------------------- */
  /* LOAD CONVERSATIONS                                                         */
  /* -------------------------------------------------------------------------- */

  const loadConversations = useCallback(async () => {
    try {
      setLoadingList(true);
      setError("");

      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: "30",
      });

      const response = await fetch(`/api/admin/ai-chats?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unterhaltungen konnten nicht geladen werden.",
        );
      }

      const loadedConversations = Array.isArray(data?.conversations)
        ? data.conversations
        : [];

      setConversations(loadedConversations);

      setUnreadCount(Number(data?.unreadCount) || 0);

      setPagination(
        data?.pagination || {
          page: 1,
          pages: 1,
          total: 0,
        },
      );

      setSelectedConversation((currentConversation) => {
        if (!currentConversation) {
          return null;
        }

        const stillExists = loadedConversations.some(
          (conversation) =>
            conversation.conversationId === currentConversation.conversationId,
        );

        return stillExists ? currentConversation : null;
      });
    } catch (loadError) {
      console.error("Could not load AI conversations:", loadError);

      setError(
        loadError.message || "Unterhaltungen konnten nicht geladen werden.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [status, page]);

  /* -------------------------------------------------------------------------- */
  /* LOAD ON PAGE OPEN, TAB CHANGE OR PAGINATION                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* -------------------------------------------------------------------------- */
  /* OPEN CONVERSATION                                                          */
  /* -------------------------------------------------------------------------- */

  async function openConversation(conversationId) {
    if (!conversationId) {
      return;
    }

    try {
      setLoadingConversation(true);
      setError("");

      const selectedListItem = conversations.find(
        (conversation) => conversation.conversationId === conversationId,
      );

      const wasUnread = Boolean(selectedListItem?.unreadByAdmin);

      const response = await fetch(
        `/api/admin/ai-chats/${encodeURIComponent(conversationId)}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unterhaltung konnte nicht geladen werden.",
        );
      }

      setSelectedConversation(data.conversation);

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.conversationId === conversationId
            ? {
                ...conversation,
                unreadByAdmin: false,
              }
            : conversation,
        ),
      );

      if (wasUnread) {
        setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
      }
    } catch (readError) {
      console.error("Could not load conversation:", readError);

      setError(
        readError.message || "Unterhaltung konnte nicht geladen werden.",
      );
    } finally {
      setLoadingConversation(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ARCHIVE OR RESTORE                                                         */
  /* -------------------------------------------------------------------------- */

  async function updateConversationStatus(conversationId, nextStatus) {
    if (!conversationId || !["open", "archived"].includes(nextStatus)) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/ai-chats/${encodeURIComponent(conversationId)}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Der Status konnte nicht geändert werden.",
        );
      }

      setSelectedConversation(null);

      await loadConversations();
    } catch (statusError) {
      console.error("Could not update conversation:", statusError);

      setError(
        statusError.message || "Der Status konnte nicht geändert werden.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* DELETE CONVERSATION                                                        */
  /* -------------------------------------------------------------------------- */

  async function deleteConversation(conversationId) {
    if (!conversationId) {
      return;
    }

    const confirmed = window.confirm(
      "Möchten Sie diese Unterhaltung endgültig löschen?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/ai-chats/${encodeURIComponent(conversationId)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unterhaltung konnte nicht gelöscht werden.",
        );
      }

      setSelectedConversation(null);

      await loadConversations();
    } catch (deleteError) {
      console.error("Could not delete conversation:", deleteError);

      setError(
        deleteError.message || "Unterhaltung konnte nicht gelöscht werden.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* CHANGE OPEN / ARCHIVED TAB                                                 */
  /* -------------------------------------------------------------------------- */

  function changeStatusTab(nextStatus) {
    if (status === nextStatus) {
      return;
    }

    setStatus(nextStatus);
    setPage(1);
    setSelectedConversation(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f3f4f1] p-3 text-[#181b18] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* PAGE TITLE */}
        <div className="mb-4 flex items-center gap-3 rounded-[18px] border border-black/[0.06] bg-white/70 px-4 py-4 shadow-sm sm:px-5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/[0.08] bg-[#f5f6f3]">
            <Image
              src="/chatbot.png"
              alt="AI Kunden-Unterhaltung"
              fill
              sizes="48px"
              priority
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-black tracking-[-0.025em] text-[#1d211d] sm:text-xl">
              AI-Kunden-Unterhaltungen
            </h1>

            <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
              Kundenanfragen und Antworten der Online-Beratung
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid min-h-[calc(100vh-48px)] overflow-hidden rounded-[20px] border border-black/[0.07] bg-white/70 shadow-[0_10px_40px_rgba(0,0,0,0.06)] lg:grid-cols-[370px_minmax(0,1fr)]">
          {/* ---------------------------------------------------------------- */}
          {/* LEFT CONVERSATION LIST                                           */}
          {/* ---------------------------------------------------------------- */}

          <aside className="flex min-h-[620px] flex-col border-b border-black/[0.07] lg:min-h-[calc(100vh-48px)] lg:border-b-0 lg:border-r">
            <div className="border-b border-black/[0.07] p-3">
              <div className="grid grid-cols-2 gap-2">
                <StatusButton
                  active={status === "open"}
                  onClick={() => changeStatusTab("open")}
                  icon={<Inbox />}
                  label="Offen"
                  badge={unreadCount}
                />

                <StatusButton
                  active={status === "archived"}
                  onClick={() => changeStatusTab("archived")}
                  icon={<Archive />}
                  label="Archiv"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingList ? (
                <ConversationListLoading />
              ) : conversations.length === 0 ? (
                <EmptyConversationList status={status} />
              ) : (
                conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.conversationId}
                    conversation={conversation}
                    active={
                      selectedConversation?.conversationId ===
                      conversation.conversationId
                    }
                    onClick={() =>
                      openConversation(conversation.conversationId)
                    }
                  />
                ))
              )}
            </div>

            {pagination.pages > 1 && (
              <Pagination
                page={page}
                pagination={pagination}
                onPrevious={() =>
                  setPage((currentPage) => Math.max(currentPage - 1, 1))
                }
                onNext={() =>
                  setPage((currentPage) =>
                    Math.min(currentPage + 1, pagination.pages),
                  )
                }
              />
            )}
          </aside>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT CONVERSATION DETAILS                                       */}
          {/* ---------------------------------------------------------------- */}

          <section className="min-w-0">
            {loadingConversation ? (
              <ConversationLoading />
            ) : selectedConversation ? (
              <ConversationDetails
                conversation={selectedConversation}
                actionLoading={actionLoading}
                onArchive={() =>
                  updateConversationStatus(
                    selectedConversation.conversationId,

                    selectedConversation.status === "archived"
                      ? "open"
                      : "archived",
                  )
                }
                onDelete={() =>
                  deleteConversation(selectedConversation.conversationId)
                }
              />
            ) : (
              <NoConversationSelected />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS BUTTON                                                              */
/* -------------------------------------------------------------------------- */

function StatusButton({ active, onClick, icon, label, badge = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-xl
        px-3
        text-xs
        font-bold
        transition

        ${
          active
            ? "bg-[#171b17] text-white shadow-sm"
            : "border border-black/[0.08] bg-white text-gray-600 hover:bg-[#f5f6f3]"
        }
      `}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>

      <span>{label}</span>

      {badge > 0 && (
        <span
          className={`
            flex
            min-w-5
            items-center
            justify-center
            rounded-full
            px-1.5
            py-0.5
            text-[8px]
            font-black

            ${active ? "bg-white text-[#146c2e]" : "bg-[#146c2e] text-white"}
          `}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* CONVERSATION LIST ROW                                                      */
/* -------------------------------------------------------------------------- */

function ConversationRow({ conversation, active, onClick }) {
  const customerName = conversation.customer?.name || "Website-Besucher";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        flex
        w-full
        gap-3
        border-b
        border-black/[0.06]
        p-4
        text-left
        transition

        ${active ? "bg-[#146c2e]/[0.07]" : "bg-white hover:bg-[#fafbf9]"}
      `}
    >
      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full

          ${active ? "bg-[#146c2e] text-white" : "bg-[#171b17] text-white"}
        `}
      >
        <User className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`
              truncate
              text-xs

              ${
                conversation.unreadByAdmin
                  ? "font-black text-[#171b17]"
                  : "font-bold text-[#333]"
              }
            `}
          >
            {customerName}
          </p>

          {conversation.unreadByAdmin && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#146c2e]" />
          )}

          <span className="ml-auto shrink-0 text-[8px] text-gray-400">
            {formatRelativeDate(conversation.lastMessageAt)}
          </span>
        </div>

        <p
          className={`
            mt-1.5
            line-clamp-2
            text-[10px]
            leading-4

            ${
              conversation.unreadByAdmin
                ? "font-semibold text-gray-700"
                : "font-normal text-gray-500"
            }
          `}
        >
          {conversation.lastMessage || "Keine Nachricht"}
        </p>

        {conversation.page?.title && (
          <p className="mt-1 truncate text-[8px] text-gray-400">
            {conversation.page.title}
          </p>
        )}
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* CONVERSATION DETAILS                                                       */
/* -------------------------------------------------------------------------- */

function ConversationDetails({
  conversation,
  actionLoading,
  onArchive,
  onDelete,
}) {
  const customerName = conversation.customer?.name || "Website-Besucher";

  return (
    <div className="flex min-h-[620px] flex-col lg:min-h-[calc(100vh-48px)]">
      <header className="flex min-h-[74px] flex-col gap-3 border-b border-black/[0.07] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171b17] text-white">
            <User className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-black text-[#1d211d]">
              {customerName}
            </h2>

            <p className="mt-1 text-[9px] text-gray-400">
              {formatFullDate(conversation.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onArchive}
            disabled={actionLoading}
            className="flex h-10 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 text-[10px] font-bold text-gray-700 transition hover:bg-[#f5f6f3] disabled:cursor-wait disabled:opacity-50"
          >
            {conversation.status === "archived" ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}

            <span>
              {conversation.status === "archived"
                ? "Wiederherstellen"
                : "Archivieren"}
            </span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={actionLoading}
            aria-label="Unterhaltung löschen"
            title="Unterhaltung löschen"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      <CustomerInformation conversation={conversation} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f5f6f3] p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {conversation.messages?.length > 0 ? (
            conversation.messages.map((message) => (
              <AdminMessageBubble key={message.messageId} message={message} />
            ))
          ) : (
            <div className="py-20 text-center text-xs text-gray-400">
              Keine Nachrichten vorhanden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CUSTOMER INFORMATION                                                       */
/* -------------------------------------------------------------------------- */

function CustomerInformation({ conversation }) {
  const hasPhone = Boolean(conversation.customer?.phone);

  const hasEmail = Boolean(conversation.customer?.email);

  const hasVisitedPage = Boolean(conversation.page?.url);

  if (!hasPhone && !hasEmail && !hasVisitedPage) {
    return null;
  }

  return (
    <div className="border-b border-black/[0.07] bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-gray-500">
        {hasPhone && (
          <a
            href={`tel:${conversation.customer.phone}`}
            className="flex items-center gap-1.5 transition hover:text-[#146c2e]"
          >
            <Phone className="h-3.5 w-3.5" />

            <span>{conversation.customer.phone}</span>
          </a>
        )}

        {hasEmail && (
          <a
            href={`mailto:${conversation.customer.email}`}
            className="flex items-center gap-1.5 transition hover:text-[#146c2e]"
          >
            <Mail className="h-3.5 w-3.5" />

            <span>{conversation.customer.email}</span>
          </a>
        )}

        {hasVisitedPage && (
          <a
            href={conversation.page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold transition hover:text-[#146c2e]"
          >
            <ExternalLink className="h-3.5 w-3.5" />

            <span>Besuchte Seite öffnen</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MESSAGE BUBBLE                                                             */
/* -------------------------------------------------------------------------- */

function AdminMessageBubble({ message }) {
  const isCustomer = message.role === "user";

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div className="max-w-[85%] sm:max-w-[78%]">
        <div
          className={`
            mb-1
            flex
            items-center
            gap-1.5
            px-1

            ${isCustomer ? "justify-start" : "justify-end"}
          `}
        >
          {isCustomer ? (
            <User className="h-3 w-3 text-gray-400" />
          ) : (
            <Bot className="h-3 w-3 text-[#146c2e]" />
          )}

          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400">
            {isCustomer ? "Kunde" : "Online-Beratung"}
          </span>
        </div>

        <div
          className={`
            whitespace-pre-wrap
            rounded-[18px]
            px-4
            py-3
            text-xs
            leading-5
            shadow-sm

            ${
              isCustomer
                ? "rounded-bl-[5px] border border-black/[0.06] bg-white text-[#292d29]"
                : "rounded-br-[5px] bg-[#182019] text-white"
            }
          `}
        >
          {message.content}
        </div>

        <div
          className={`
            mt-1
            flex
            items-center
            gap-1
            px-1
            text-[8px]
            text-gray-400

            ${isCustomer ? "justify-start" : "justify-end"}
          `}
        >
          <Clock3 className="h-3 w-3" />

          <span>{formatMessageTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGINATION                                                                 */
/* -------------------------------------------------------------------------- */

function Pagination({ page, pagination, onPrevious, onNext }) {
  return (
    <div className="flex items-center justify-between border-t border-black/[0.07] bg-white px-4 py-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrevious}
        aria-label="Vorherige Seite"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.08] transition hover:bg-[#f5f6f3] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-[10px] font-bold text-gray-500">
        {pagination.page} / {Math.max(pagination.pages, 1)}
      </span>

      <button
        type="button"
        disabled={page >= pagination.pages}
        onClick={onNext}
        aria-label="Nächste Seite"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.08] transition hover:bg-[#f5f6f3] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING AND EMPTY STATES                                                   */
/* -------------------------------------------------------------------------- */

function ConversationListLoading() {
  return (
    <div className="flex h-52 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#146c2e]" />
    </div>
  );
}

function ConversationLoading() {
  return (
    <div className="flex min-h-[620px] items-center justify-center lg:min-h-[calc(100vh-48px)]">
      <Loader2 className="h-7 w-7 animate-spin text-[#146c2e]" />
    </div>
  );
}

function EmptyConversationList({ status }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center px-6 text-center">
      {status === "archived" ? (
        <Archive className="h-8 w-8 text-gray-300" />
      ) : (
        <MessageCircle className="h-8 w-8 text-gray-300" />
      )}

      <p className="mt-3 text-sm font-bold text-gray-700">
        {status === "archived" ? "Kein Archiv" : "Keine Unterhaltungen"}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-400">
        {status === "archived"
          ? "Archivierte Chats erscheinen hier."
          : "Neue Kundenchats erscheinen beim nächsten Öffnen dieser Seite."}
      </p>
    </div>
  );
}

function NoConversationSelected() {
  return (
    <div className="flex min-h-[620px] flex-col items-center justify-center p-8 text-center lg:min-h-[calc(100vh-48px)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#146c2e]/10 text-[#146c2e]">
        <MessageCircle className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-base font-black text-[#222722]">
        Unterhaltung auswählen
      </h2>

      <p className="mt-2 max-w-sm text-xs leading-5 text-gray-500">
        Wählen Sie links eine Unterhaltung aus, um die Nachrichten zu lesen.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}
