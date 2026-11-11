"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CONTACT INFORMATION                                                        */
/* -------------------------------------------------------------------------- */

const PHONE_NUMBER = "492461916006613";
const DISPLAY_PHONE = "+49 (0)2461 916006613";

const WHATSAPP_NUMBER = "4917647313765";
const DISPLAY_WHATSAPP = "+49 176 47313765";

const EMAIL_ADDRESS = "autogalerie.jülich@web.de";

/** what the removed AI chat kept in the visitor's browser – cleared once */
const OLD_CHAT_KEYS = ["autogalerie_ai_chat_v8", "autogalerie_ai_conversation_id_v1"];

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function FloatingContact() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const openingTimerRef = useRef(null);
  const closingTimerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      for (const key of OLD_CHAT_KEYS) localStorage.removeItem(key);
    } catch {
      /* storage blocked */
    }
    return () => clearWidgetTimers();
  }, []);

  function clearWidgetTimers() {
    if (openingTimerRef.current) window.clearTimeout(openingTimerRef.current);
    if (closingTimerRef.current) window.clearTimeout(closingTimerRef.current);
  }

  function openWidget() {
    clearWidgetTimers();
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
    }, 1500);
  }

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Kontakt"
          className={`
            fixed
            bottom-0
            right-0
            z-[1000]
            flex
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
          <ContactMenu onClose={closeWidget} />
        </section>
      )}

      {!isOpen && <FloatingButton onClick={openWidget} />}
    </>
  );
}

function ContactMenu({ onClose }) {
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
            Kontaktieren Sie unser Team direkt – per Telefon, WhatsApp oder
            E-Mail.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-2">
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

function ContactRow({
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#333]">
        {icon}
      </div>

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
