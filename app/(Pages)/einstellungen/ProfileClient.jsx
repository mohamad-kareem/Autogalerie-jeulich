"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertTriangle, Camera, Check, KeyRound, Loader2, LocateFixed, Lock, LogOut, Shield, User } from "lucide-react";
import { initialsOf } from "@/app/(components)/UserMenu";
import { confirmDialog } from "@/app/(components)/ConfirmHost";

export default function ProfileClient({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const hasLocation = initialUser.companyLocation !== undefined;
  const [location, setLocation] = useState(initialUser.companyLocation || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }
  const fileRef = useRef(null);

  /** profile picture (Autogalerie) – saved right away */
  function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (await save({ image: String(reader.result || "") }, "image")) setMsg({ ok: true, text: "Profilbild gespeichert." });
    };
    reader.readAsDataURL(file);
  }

  /** "Auf allen Geräten abmelden" (Autogalerie) */
  async function logoutEverywhere() {
    if (!(await confirmDialog({ title: "Überall abmelden", message: "Auf allen Geräten abmelden? Danach muss man sich überall neu anmelden.", confirmLabel: "Überall abmelden" }))) return;
    setBusy("logout-all");
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/login" });
    } catch {
      setMsg({ ok: false, text: "Abmelden auf allen Geräten fehlgeschlagen." });
      setBusy("");
    }
  }

  async function save(payload, key) {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Speichern fehlgeschlagen." });
        return false;
      }
      setUser((u) => ({ ...u, ...data.user }));
      router.refresh();
      return true;
    } catch {
      setMsg({ ok: false, text: "Keine Verbindung zum Server." });
      return false;
    } finally {
      setBusy("");
    }
  }

  /** browser location → address (OpenStreetMap) – still needs "Speichern" */
  function locateMe() {
    if (!navigator.geolocation) {
      setMsg({ ok: false, text: "Dieser Browser kann den Standort nicht bestimmen." });
      return;
    }
    setBusy("locate");
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.address) throw new Error(data.error || "Zu diesem Standort wurde keine Adresse gefunden.");
          setLocation(data.address);
          // a PC without GPS only knows its position roughly (Wi-Fi / internet line)
          const acc = Math.round(pos.coords.accuracy || 0);
          setMsg(
            acc > 60
              ? { ok: false, text: `Der Standort ist nur ungefähr (± ${acc} m) – bitte Straße und Hausnummer prüfen und dann speichern.` }
              : { ok: true, text: "Standort übernommen – bitte prüfen und speichern." },
          );
        } catch (err) {
          setMsg({ ok: false, text: err.message });
        } finally {
          setBusy("");
        }
      },
      (err) => {
        setBusy("");
        setMsg({ ok: false, text: err.code === 1 ? "Standort-Zugriff wurde nicht erlaubt (Browser-Einstellung)." : "Der Standort konnte nicht bestimmt werden." });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function saveAccount(e) {
    e.preventDefault();
    const ok = await save(
      {
        name: name.trim(),
        ...(hasLocation ? { companyLocation: location.trim() } : {}),
      },
      "account",
    );
    if (ok) setMsg({ ok: true, text: "Profil gespeichert." });
  }

  async function savePassword(e) {
    e.preventDefault();
    if (newPassword !== repeatPassword) {
      setMsg({
        ok: false,
        text: "Die neuen Passwörter stimmen nicht überein.",
      });
      return;
    }
    const ok = await save({ currentPassword, newPassword }, "password");
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setMsg({ ok: true, text: "Passwort geändert." });
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Identity card */}
      <div className="card flex flex-wrap items-center gap-4 px-4 py-3">
        <span className="relative">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-12 w-12 rounded-[4px] border border-[#b9bfc7] object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-[#262b31] bg-gradient-to-b from-[#4b535d] to-[#343a42] text-base font-bold text-white">
              {initialsOf(user.name) || "?"}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy === "image"}
            className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-[3px] border border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white"
            aria-label="Profilbild ändern"
            title="Profilbild ändern"
          >
            {busy === "image" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-ink">{user.name}</h2>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
        <span className="chip bg-canvas text-muted">
          <Shield className="h-3 w-3" />
          {user.role === "admin" ? "Administrator" : "Mitarbeiter"}
        </span>
        <button type="button" onClick={logoutEverywhere} disabled={busy === "logout-all"} className="btn btn-secondary btn-sm text-rose-700">
          {busy === "logout-all" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Auf allen Geräten abmelden
        </button>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-secondary btn-sm">
          <LogOut className="h-3.5 w-3.5" />
          Abmelden
        </button>
      </div>

      {msg ? (
        <div
          role="status"
          className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] ${
            msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {msg.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Account data */}
        <form onSubmit={saveAccount} className="card p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <User className="h-4 w-4 text-[#5a636e]" />
            Persönliche Daten
          </h2>

          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="field" required />
            </div>
            <div>
              <span className="label">E-Mail-Adresse (Login)</span>
              <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-[13px] text-muted">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">Die Login-Adresse kann nicht geändert werden.</p>
            </div>
            {hasLocation ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="company-location" className="label">
                    Firmenstandort
                  </label>
                  <button
                    type="button"
                    onClick={locateMe}
                    disabled={busy === "locate"}
                    className="mb-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-700 hover:text-brand-800 disabled:opacity-60"
                    title="Adresse aus dem aktuellen Standort übernehmen"
                  >
                    {busy === "locate" ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                    Aktueller Standort
                  </button>
                </div>
                <input
                  id="company-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="field"
                  placeholder="Straße Nr., PLZ Ort"
                  autoComplete="street-address"
                />
                <p className="mt-1 text-[11px] text-muted">Die Fahrzeit zu allen Abholungen wird ab dieser Adresse berechnet.</p>
              </div>
            ) : null}
          </div>

          <button type="submit" disabled={busy === "account"} className="btn btn-primary btn-sm mt-4">
            {busy === "account" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Speichern
          </button>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="card p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4 text-[#5a636e]" />
            Passwort ändern
          </h2>

          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="pw-old" className="label">
                Aktuelles Passwort
              </label>
              <input
                id="pw-old"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="field"
                required
              />
            </div>
            <div>
              <label htmlFor="pw-new" className="label">
                Neues Passwort
              </label>
              <input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field"
                minLength={8}
                required
              />
              <p className="mt-1 text-[11px] text-muted">Mindestens 8 Zeichen.</p>
            </div>
            <div>
              <label htmlFor="pw-repeat" className="label">
                Neues Passwort wiederholen
              </label>
              <input
                id="pw-repeat"
                type="password"
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="field"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={busy === "password"} className="btn btn-primary btn-sm mt-4">
            {busy === "password" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Passwort ändern
          </button>
        </form>
      </div>
    </div>
  );
}
