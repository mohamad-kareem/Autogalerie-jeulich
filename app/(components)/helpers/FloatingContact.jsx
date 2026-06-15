"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CONTACT INFORMATION                                                        */
/* -------------------------------------------------------------------------- */

const PHONE_NUMBER = "492461916006613";
const DISPLAY_PHONE = "+49 (0)2461 916006613";

const WHATSAPP_NUMBER = "4917647313765";
const DISPLAY_WHATSAPP = "+49 176 47313765";

const EMAIL_ADDRESS = "autogalerie.jülich@web.de";

/* -------------------------------------------------------------------------- */
/* CHAT SETTINGS                                                              */
/* -------------------------------------------------------------------------- */

const MESSAGE_STORAGE_KEY = "autogalerie_ai_chat_v8";

const CONVERSATION_ID_KEY = "autogalerie_ai_conversation_id_v1";

const ASSISTANT_IMAGE = "/chatbot.png";

const WELCOME_MESSAGE = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Herzlich willkommen bei Autogalerie Jülich. Wie kann ich Ihnen heute helfen?",
  createdAt: null,
};

const QUICK_QUESTIONS = [
  "Wann haben Sie geöffnet?",
  "Kann ich eine Probefahrt vereinbaren?",
  "Ich interessiere mich für ein Fahrzeug.",
];

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function FloatingAIChat() {
  const [isMounted, setIsMounted] = useState(false);

  const [conversationId, setConversationId] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const [activeView, setActiveView] = useState("menu");

  const [isContentVisible, setIsContentVisible] = useState(true);

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [messageText, setMessageText] = useState("");

  const [isThinking, setIsThinking] = useState(false);

  const [error, setError] = useState("");

  const [storageLoaded, setStorageLoaded] = useState(false);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const openingTimerRef = useRef(null);
  const closingTimerRef = useRef(null);
  const viewTimerRef = useRef(null);
  const contentTimerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);

    try {
      let storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY);

      if (!storedConversationId) {
        storedConversationId = crypto.randomUUID();

        localStorage.setItem(CONVERSATION_ID_KEY, storedConversationId);
      }

      setConversationId(storedConversationId);

      const storedMessages = localStorage.getItem(MESSAGE_STORAGE_KEY);

      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);

        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      }
    } catch (storageError) {
      console.error("Could not load stored conversation:", storageError);
    } finally {
      setStorageLoaded(true);
    }

    return () => {
      clearWidgetTimers();
    };
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(
        MESSAGE_STORAGE_KEY,
        JSON.stringify(messages.slice(-30)),
      );
    } catch (storageError) {
      console.error("Could not save conversation:", storageError);
    }
  }, [messages, storageLoaded]);

  useEffect(() => {
    if (!isOpen || activeView !== "chat" || !isContentVisible) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isThinking, isOpen, activeView, isContentVisible]);

  useEffect(() => {
    if (!isOpen || activeView !== "chat" || !isContentVisible) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 500);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, activeView, isContentVisible]);

  function clearWidgetTimers() {
    if (openingTimerRef.current) {
      window.clearTimeout(openingTimerRef.current);
    }

    if (closingTimerRef.current) {
      window.clearTimeout(closingTimerRef.current);
    }

    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
    }

    if (contentTimerRef.current) {
      window.clearTimeout(contentTimerRef.current);
    }
  }

  function openWidget() {
    clearWidgetTimers();

    setActiveView("menu");
    setIsContentVisible(true);
    setIsPanelVisible(false);
    setIsOpen(true);

    openingTimerRef.current = window.setTimeout(() => {
      setIsPanelVisible(true);
    }, 140);
  }

  function closeWidget() {
    clearWidgetTimers();

    setIsPanelVisible(false);

    closingTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setActiveView("menu");
      setIsContentVisible(true);
    }, 1500);
  }

  function changeView(nextView) {
    if (nextView === activeView) {
      return;
    }

    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
    }

    if (contentTimerRef.current) {
      window.clearTimeout(contentTimerRef.current);
    }

    setIsContentVisible(false);

    viewTimerRef.current = window.setTimeout(() => {
      setActiveView(nextView);

      contentTimerRef.current = window.setTimeout(() => {
        setIsContentVisible(true);
      }, 40);
    }, 230);
  }

  async function sendMessage(forcedText) {
    const cleanMessage = String(forcedText ?? messageText).trim();

    if (!cleanMessage || isThinking || !conversationId) {
      return;
    }

    const clientMessageId = crypto.randomUUID();

    const customerMessage = {
      id: clientMessageId,
      role: "user",
      content: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    const conversationForApi = [...messages, customerMessage];

    setMessages(conversationForApi);
    setMessageText("");
    setError("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          conversationId,
          clientMessageId,

          messages: conversationForApi.map((message) => ({
            role: message.role,
            content: message.content,
          })),

          page: {
            url: window.location.href,
            title: document.title,
            pathname: window.location.pathname,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Die Online-Beratung konnte momentan nicht antworten.",
        );
      }

      const assistantMessage = {
        id: data.assistantMessageId || crypto.randomUUID(),

        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (sendError) {
      console.error("AI chat request failed:", sendError);

      setError(
        sendError.message || "Ihre Nachricht konnte nicht gesendet werden.",
      );
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !isThinking) {
      event.preventDefault();
      sendMessage();
    }
  }

  function clearConversation() {
    const confirmed = window.confirm(
      "Möchten Sie diese Unterhaltung wirklich löschen?",
    );

    if (!confirmed) return;

    const newConversationId = crypto.randomUUID();

    localStorage.setItem(CONVERSATION_ID_KEY, newConversationId);

    localStorage.removeItem(MESSAGE_STORAGE_KEY);

    setConversationId(newConversationId);

    setMessages([
      {
        ...WELCOME_MESSAGE,
        createdAt: null,
      },
    ]);

    setMessageText("");
    setError("");
  }

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Kontakt und Online-Beratung"
          className={`
            fixed
            bottom-0
            right-0
            z-[1000]
            flex
            h-[690px]
            max-h-[100dvh]
            w-full
            max-w-[400px]
            flex-col
            overflow-hidden
            border
            border-black/[0.08]
            bg-white
            text-[#303030]
            shadow-[0_30px_100px_rgba(0,0,0,0.28)]

            transition-transform
            duration-[1500ms]
            ease-[cubic-bezier(0.16,1,0.3,1)]
            will-change-transform

            ${
              isPanelVisible
                ? "translate-y-0"
                : "pointer-events-none translate-y-[110%]"
            }
          `}
        >
          <div
            className={`
              h-full
              w-full
              transition-[opacity,transform]
              duration-[420ms]
              ease-out

              ${
                isContentVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-3 opacity-0"
              }
            `}
          >
            {activeView === "menu" ? (
              <ContactMenu
                onClose={closeWidget}
                onOpenChat={() => changeView("chat")}
              />
            ) : (
              <ChatWindow
                messages={messages}
                messageText={messageText}
                setMessageText={setMessageText}
                isThinking={isThinking}
                error={error}
                textareaRef={textareaRef}
                messagesEndRef={messagesEndRef}
                onBack={() => changeView("menu")}
                onClose={closeWidget}
                onClear={clearConversation}
                onSend={sendMessage}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>
        </section>
      )}

      {!isOpen && <FloatingButton onClick={openWidget} />}
    </>
  );
}

function ContactMenu({ onClose, onOpenChat }) {
  return (
    <div className="flex h-full flex-col bg-white text-[#303030]">
      <header className="relative shrink-0 border-b border-black/[0.09] px-7 pb-8 pt-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kontaktfenster schließen"
          className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.13] bg-white text-[#303030] transition hover:bg-[#f5f5f5]"
        >
          <ChevronDown className="h-5 w-5" />
        </button>

        <div className="pr-14">
          <h2 className="mt-5 max-w-[290px] font-serif text-[32px] font-normal leading-[1.17] tracking-[-0.025em] text-[#323232]">
            Wie können wir Ihnen helfen?
          </h2>

          <p className="mt-4 max-w-[315px] text-[14px] leading-[22px] text-[#575757]">
            Wählen Sie unsere Online-Beratung oder kontaktieren Sie unser Team
            direkt.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        <ContactRow
          image={ASSISTANT_IMAGE}
          title="Online-Beratung"
          description="Erhalten Sie sofort Antworten auf Ihre Fragen."
          onClick={onOpenChat}
        />

        <ContactRow
          icon={<Phone className="h-[18px] w-[18px]" />}
          title="Anruf"
          description={DISPLAY_PHONE}
          href={`tel:+${PHONE_NUMBER}`}
        />

        <ContactRow
          icon={<MessageCircle className="h-[18px] w-[18px]" />}
          title="WhatsApp"
          description={DISPLAY_WHATSAPP}
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            "Hallo Autogalerie Jülich, ich habe eine Frage.",
          )}`}
          external
        />

        <ContactRow
          icon={<Mail className="h-[18px] w-[18px]" />}
          title="E-Mail"
          description={EMAIL_ADDRESS}
          href={`mailto:${EMAIL_ADDRESS}`}
          last
        />
      </div>

      <footer className="shrink-0 border-t border-black/[0.07] bg-[#fafafa] px-7 py-4">
        <div className="flex items-center gap-2 text-[9px] leading-4 text-[#777]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#146c2e]" />

          <span>Ihre Angaben werden vertraulich behandelt.</span>
        </div>
      </footer>
    </div>
  );
}

function ChatWindow({
  messages,
  messageText,
  setMessageText,
  isThinking,
  error,
  textareaRef,
  messagesEndRef,
  onBack,
  onClose,
  onClear,
  onSend,
  onKeyDown,
}) {
  const hasCustomerMessages = messages.some(
    (message) => message.role === "user",
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f7f7f7] text-[#303030]">
      <header className="flex h-[78px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#171717] px-4 text-white">
        <button
          type="button"
          onClick={onBack}
          aria-label="Zurück"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <AssistantAvatar size="large" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">Online-Beratung</p>

          <p className="mt-0.5 truncate text-[10px] text-white/55">
            Virtueller Assistent
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          aria-label="Neue Unterhaltung"
          title="Neue Unterhaltung"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-[17px] w-[17px]" />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Chat schließen"
          title="Chat schließen"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronDown className="h-[19px] w-[19px]" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isThinking && <ThinkingBubble />}

          <div ref={messagesEndRef} />
        </div>

        {!hasCustomerMessages && !isThinking && (
          <div className="mt-7">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999]">
              Häufige Fragen
            </p>

            <div className="space-y-2">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onSend(question)}
                  className="flex w-full items-center justify-between gap-3 border border-black/[0.08] bg-white px-4 py-3.5 text-left text-[11px] font-medium text-[#393939] transition hover:border-black/[0.18] hover:bg-[#fcfcfc]"
                >
                  <span>{question}</span>

                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-black/[0.08] bg-white p-3">
        {error && (
          <div className="mb-2 border border-red-200 bg-red-50 px-3 py-2 text-[10px] leading-4 text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex min-h-[50px] flex-1 items-end rounded-[26px] border border-black/[0.14] bg-white px-4 transition focus-within:border-black/[0.30]">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              disabled={isThinking}
              placeholder={
                isThinking ? "Antwort wird erstellt …" : "Ihre Nachricht"
              }
              className="max-h-28 min-h-[24px] w-full resize-none bg-transparent py-[13px] text-[13px] leading-5 text-[#333] outline-none placeholder:text-[#999] disabled:cursor-wait"
            />
          </div>

          <button
            type="button"
            onClick={() => onSend()}
            disabled={!messageText.trim() || isThinking}
            aria-label="Nachricht senden"
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#171717] text-white transition hover:bg-[#146c2e] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="h-[19px] w-[19px]" />
          </button>
        </div>

        <p className="mt-2 text-center text-[8px] text-[#999]">
          Persönliche Beratung: {DISPLAY_PHONE}
        </p>
      </footer>
    </div>
  );
}

function ContactRow({
  image,
  icon,
  title,
  description,
  href,
  onClick,
  external = false,
  last = false,
}) {
  const content = (
    <>
      {image ? (
        <div className="relative h-12 w-12 shrink-0">
          <Image
            src={image}
            alt="Online-Beratung"
            fill
            sizes="48px"
            className="rounded-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#333]">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-[#373737]">{title}</p>

        <p className="mt-1 truncate text-[10px] text-[#777]">{description}</p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-[#333]" />
    </>
  );

  const className = `
    flex w-full items-center gap-4 py-4 text-left transition
    hover:translate-x-0.5
    ${last ? "" : "border-b border-black/[0.09]"}
  `;

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function AssistantAvatar({ size = "small" }) {
  const sizeClass = size === "large" ? "h-11 w-11" : "h-9 w-9";

  return (
    <div className={`relative shrink-0 ${sizeClass}`}>
      <Image
        src={ASSISTANT_IMAGE}
        alt="Virtueller Assistent"
        fill
        sizes={size === "large" ? "44px" : "36px"}
        className="rounded-full object-cover"
      />
    </div>
  );
}

function MessageBubble({ message }) {
  const isCustomer = message.role === "user";

  let formattedTime = "";

  if (message.createdAt) {
    const date = new Date(message.createdAt);

    if (!Number.isNaN(date.getTime())) {
      formattedTime = date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return (
    <div
      className={`flex items-end gap-2 ${
        isCustomer ? "justify-end" : "justify-start"
      }`}
    >
      {!isCustomer && <AssistantAvatar />}

      <div className="max-w-[78%]">
        <div
          className={`
            whitespace-pre-wrap px-4 py-3 text-[12px] leading-[19px]
            ${
              isCustomer
                ? "rounded-[17px] rounded-br-[4px] bg-[#191919] text-white"
                : "rounded-[17px] rounded-bl-[4px] border border-black/[0.07] bg-white text-[#333]"
            }
          `}
        >
          {message.content}
        </div>

        {formattedTime && (
          <div
            className={`mt-1 flex items-center gap-1 px-1 text-[8px] text-[#999] ${
              isCustomer ? "justify-end" : "justify-start"
            }`}
          >
            <span>{formattedTime}</span>

            {isCustomer && <CheckCheck className="h-3 w-3" />}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar />

      <div className="flex h-11 items-center gap-1 rounded-[17px] rounded-bl-[4px] border border-black/[0.07] bg-white px-4">
        <TypingDot delay="0ms" />
        <TypingDot delay="180ms" />
        <TypingDot delay="360ms" />
      </div>
    </div>
  );
}

function TypingDot({ delay }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#555]"
      style={{
        animationDelay: delay,
      }}
    />
  );
}

function FloatingButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kontakt öffnen"
      className="fixed bottom-5 right-4 z-[999] flex h-[62px] w-[62px] items-center justify-center rounded-full border-[3px] border-white bg-[#171717] text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#146c2e] sm:bottom-7 sm:right-7"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
