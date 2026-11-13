"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, LoaderCircle, Plug, Puzzle, Settings, Stamp, User, UserPlus } from "lucide-react";
import { detectMarketExtension, hasRecentMarketExtensionConnection } from "@/lib/market/extension";
import ProfileClient from "./ProfileClient";
import RegisterForm from "./RegisterForm";
import CompanyStampSettings from "./CompanyStampSettings";

function Block({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-4 space-y-3">
      <h2 className="flex items-center gap-2 border-b border-[#b9bfc7] pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#4f5863]">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function EinstellungenClient({ isAdmin, user }) {
  const [extensionStatus, setExtensionStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    async function checkExtension() {
      const connected = await detectMarketExtension();
      if (!active) return;
      if (connected) setExtensionStatus("connected");
      else if (hasRecentMarketExtensionConnection()) setExtensionStatus("recent");
      else setExtensionStatus("unavailable");
    }
    checkExtension();
    window.addEventListener("focus", checkExtension);
    return () => {
      active = false;
      window.removeEventListener("focus", checkExtension);
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div className="ind-plate flex items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-[#a3aab3] bg-gradient-to-b from-[#f6f7f8] to-[#dde1e5] text-[#3e454e]">
          <Settings className="h-4 w-4" />
        </span>
        <h1 className="ind-title">Einstellungen</h1>
      </div>

      <Block id="profil" icon={User} title="Mein Profil">
        <ProfileClient initialUser={user} />
      </Block>

      <Block id="firmenstempel" icon={Stamp} title="Firmenstempel">
        <CompanyStampSettings />
      </Block>

      <Block id="browser-erweiterung" icon={Puzzle} title="Browser-Erweiterung">
        <div className="card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5">
          <span className="flex size-11 items-center justify-center rounded-md border border-line bg-gradient-to-b from-white to-slate-100 text-slate-600">
            <Plug className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-tight text-ink">mobile.de-Erweiterung</h3>
            <p className="mt-1 text-[13px] leading-snug text-muted">Für Marktanalyse und Ankauf bestätigen.</p>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
            {extensionStatus === "unavailable" ? (
              <a href="/downloads/marktanalyse-extension.zip" download className="btn btn-primary">
                <Download /> Erweiterung herunterladen
              </a>
            ) : (
              <div role="status">
                {extensionStatus === "checking" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-medium text-muted">
                    <LoaderCircle className="size-3.5 motion-safe:animate-spin" aria-hidden="true" />
                    Verbindung wird geprüft …
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    {extensionStatus === "connected" ? "Verbunden" : "Zuletzt verbunden"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Block>

      {isAdmin ? (
        <Block id="benutzer" icon={UserPlus} title="Benutzer">
          <RegisterForm />
        </Block>
      ) : null}
    </div>
  );
}
