"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiX, FiCamera, FiLogOut, FiKey, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

/** Einstellungen – profile and security in one steel panel (portal design). */
const SettingsModal = ({ user, onClose, onSave }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    image: user?.image || "",
  });

  const [previewImage, setPreviewImage] = useState(
    user?.image || "/default-avatar.png"
  );

  const [saving, setSaving] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoutEverywhere = async () => {
    setLoggingOutAll(true);
    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!response.ok) throw new Error();
      toast.success("Auf allen Geräten abgemeldet.");
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Abmelden auf allen Geräten fehlgeschlagen.");
      setLoggingOutAll(false);
      setConfirmLogoutAll(false);
    }
  };

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      image: user?.image || "",
    });
    setPreviewImage(user?.image || "/default-avatar.png");
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const adminId = user?._id || user?.id;

      if (!adminId) {
        toast.error("Admin-ID fehlt!");
        return;
      }

      const response = await fetch(`/api/admins/${adminId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          image: formData.image,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(
          err?.error || "Profil konnte nicht aktualisiert werden"
        );
      }

      const updatedUser = await response.json();
      onSave(updatedUser);

      toast.success("Profil erfolgreich aktualisiert!");
    } catch (error) {
      toast.error(error.message || "Es ist ein Fehler aufgetreten");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    onClose();
    router.push("/forgotpassword");
  };

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const initials =
    String(formData.name || user?.name || "")
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      className="dash-shell fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0f14]/45 px-3 backdrop-blur-[2px] sm:px-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[4px] border border-[#b9bfc7] bg-white shadow-[0_18px_50px_-12px_rgba(11,15,20,0.45)]">
        <div className="ind-plate flex items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="ind-title">Einstellungen</h2>
            <p className="text-[12px] text-muted">Profil und Sicherheit</p>
          </div>
          <button type="button" onClick={onClose} className="ind-icon-btn" aria-label="Schließen">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Persönliche Daten */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#3e454e]">Persönliche Daten</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                {formData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="" className="h-14 w-14 rounded-[4px] border border-[#b9bfc7] object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-[4px] border border-[#262b31] bg-gradient-to-b from-[#4b535d] to-[#343a42] text-base font-bold text-white">
                    {initials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-[3px] border border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white"
                  aria-label="Profilbild ändern"
                  title="Profilbild ändern"
                >
                  <FiCamera className="h-3 w-3" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{formData.name || "Benutzer"}</p>
                <p className="truncate text-[12px] text-muted">{user?.email}</p>
              </div>
            </div>
            <div>
              <label htmlFor="pe-name" className="label">
                Name
              </label>
              <input id="pe-name" type="text" name="name" value={formData.name} onChange={handleChange} className="field" placeholder="Ihr Name" />
            </div>
            <div>
              <span className="label">E-Mail-Adresse (Login)</span>
              <div className="flex h-[2.125rem] items-center gap-2 rounded-[4px] border border-line bg-canvas px-2.5 text-[13px] text-muted">
                <FiLock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user?.email || "–"}</span>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Speichern …" : "Speichern"}
            </button>
          </form>

          {/* Sicherheit */}
          <div className="space-y-2 border-t border-[#e3e6ea] pt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#3e454e]">Sicherheit</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleChangePassword} className="btn btn-secondary btn-sm">
                <FiKey /> Passwort zurücksetzen
              </button>
              {confirmLogoutAll ? (
                <>
                  <button type="button" onClick={() => setConfirmLogoutAll(false)} disabled={loggingOutAll} className="btn btn-secondary btn-sm">
                    Abbrechen
                  </button>
                  <button type="button" onClick={handleLogoutEverywhere} disabled={loggingOutAll} className="ind-btn ind-btn-danger btn-sm">
                    {loggingOutAll ? "Wird abgemeldet …" : "Ja, überall abmelden"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmLogoutAll(true)} className="btn btn-secondary btn-sm text-rose-700">
                  <FiLogOut /> Auf allen Geräten abmelden
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#dfe2e6] bg-[#f7f8f9] px-4 py-2.5">
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-secondary btn-sm">
            <FiLogOut /> Abmelden
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
