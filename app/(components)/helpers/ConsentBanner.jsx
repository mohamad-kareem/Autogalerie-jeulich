"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "aj_consent_banner_v12";

const styles = `
  @keyframes cb-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes cb-backdrop-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes cb-card-in {
    from { opacity: 0; transform: translateY(32px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes cb-card-out {
    from { opacity: 1; transform: translateY(0)    scale(1); }
    to   { opacity: 0; transform: translateY(24px) scale(0.97); }
  }
  @keyframes cb-icon-in {
    0%   { opacity: 0; transform: scale(0.5) rotate(-15deg); }
    65%  { opacity: 1; transform: scale(1.1) rotate(4deg); }
    100% { opacity: 1; transform: scale(1)   rotate(0deg); }
  }

  .cb-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(10, 10, 10, 0.35);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .cb-backdrop.entering { animation: cb-backdrop-in  0.3s ease both; }
  .cb-backdrop.leaving  { animation: cb-backdrop-out 0.28s ease both; }

.cb-card {
    width: 100%;
    background: rgba(10, 20, 14, 0.72);
    backdrop-filter: blur(48px) saturate(2);
    -webkit-backdrop-filter: blur(48px) saturate(2);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0;
    padding: 28px 24px 36px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media (min-width: 640px) {
    .cb-card { padding: 28px 32px 36px; }
  }
  .cb-card.entering { animation: cb-card-in  0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both; }
  .cb-card.leaving  { animation: cb-card-out 0.28s cubic-bezier(0.55, 0, 0.45, 1) both; }

  .cb-inner {
    max-width: 1180px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media (min-width: 1024px) {
    .cb-inner {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 48px;
    }
  }

  .cb-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
  }

  .cb-icon-wrap {
    width: 42px; height: 42px;
    border-radius: 10px;
    background: rgba(20, 108, 46, 0.25);
    border: 1px solid rgba(20, 108, 46, 0.4);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #4ade80;
  }
  .cb-icon-wrap.entering {
    animation: cb-icon-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
  }

  .cb-text h2 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.2px;
    line-height: 1.3;
  }
  .cb-text p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.65;
  }
  .cb-text a {
    color: #4ade80;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }
  .cb-text a:hover { color: #86efac; }

  .cb-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  @media (min-width: 640px) {
    .cb-actions { flex-direction: row; align-items: center; }
  }

  .cb-btn-deny {
    height: 42px;
    padding: 0 18px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
  }
  .cb-btn-deny:hover  {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.65);
  }
  .cb-btn-deny:active { transform: scale(0.97); }

  .cb-btn-ess {
    height: 42px;
    padding: 0 18px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }
  .cb-btn-ess:hover  {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.28);
  }
  .cb-btn-ess:active { transform: scale(0.97); }

  .cb-btn-all {
    height: 42px;
    padding: 0 22px;
    border-radius: 10px;
    border: none;
    background: #146c2e;
    color: #fff;
    font-size: 13px; font-weight: 700;
    cursor: pointer; white-space: nowrap;
    letter-spacing: -0.1px;
    transition: background 0.18s, transform 0.1s;
  }
  .cb-btn-all:hover  { background: #0e4d20; }
  .cb-btn-all:active { transform: scale(0.98); }
`;

export default function ConsentBanner() {
  const [animState, setAnimState] = useState("hidden");
  const backdropRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) open();
    } catch {
      open();
    }
  }, []);

  function open() {
    const t = setTimeout(() => setAnimState("entering"), 120);
    return () => clearTimeout(t);
  }

  useEffect(() => {
    if (animState !== "entering") return;
    const el = cardRef.current;
    if (!el) return;
    const onEnd = () => setAnimState("visible");
    el.addEventListener("animationend", onEnd, { once: true });
    return () => el.removeEventListener("animationend", onEnd);
  }, [animState]);

  useEffect(() => {
    if (animState !== "leaving") return;
    const el = backdropRef.current;
    if (!el) return;
    const onEnd = () => setAnimState("hidden");
    el.addEventListener("animationend", onEnd, { once: true });
    return () => el.removeEventListener("animationend", onEnd);
  }, [animState]);

  function closeAndStore(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {}
    setAnimState("leaving");
  }

  if (animState === "hidden") return null;

  const isEntering = animState === "entering";
  const isLeaving = animState === "leaving";

  return (
    <>
      <style>{styles}</style>

      <div
        ref={backdropRef}
        className={`cb-backdrop ${isEntering ? "entering" : ""} ${isLeaving ? "leaving" : ""}`}
      >
        <div
          ref={cardRef}
          className={`cb-card ${isEntering ? "entering" : ""} ${isLeaving ? "leaving" : ""}`}
        >
          <div className="cb-inner">
            <div className="cb-top">
              <div
                className={`cb-icon-wrap ${isEntering ? "entering" : ""}`}
                aria-hidden="true"
              >
                <ShieldCheck size={20} />
              </div>
              <div className="cb-text">
                <h2>Wir respektieren Ihre Privatsphäre</h2>
                <p>
                  Wir nutzen Cookies für Analysen und ein besseres Erlebnis.
                  Mehr dazu in unserer{" "}
                  <Link href="/Datenschutz">Datenschutzerklärung</Link>.
                </p>
              </div>
            </div>

            <div className="cb-actions">
              <button
                className="cb-btn-deny"
                onClick={() => closeAndStore("denied")}
              >
                Ablehnen
              </button>
              <button
                className="cb-btn-ess"
                onClick={() => closeAndStore("essential")}
              >
                Nur notwendige
              </button>
              <button
                className="cb-btn-all"
                onClick={() => closeAndStore("all")}
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
