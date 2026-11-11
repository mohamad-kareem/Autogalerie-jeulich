"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

// accounts need at least 8 characters (models/Admin.js)
const PASSWORD_MIN = 8;

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setOk(null);

    const password = form.password.trim();

    if (password.length < PASSWORD_MIN) {
      setOk(false);
      setMsg(`Das Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.`);
      setLoading(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("email", form.email.toLowerCase().trim());
      body.append("password", password);
      body.append("role", form.role);
      const res = await fetch("/api/register", { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setOk(false);
        setMsg(res.status === 409 ? "Diese E-Mail-Adresse ist schon registriert." : data.error || data.message || "Registrierung fehlgeschlagen.");
        return;
      }

      setOk(true);
      setMsg("Benutzer wurde erfolgreich erstellt.");
      setForm({ name: "", email: "", password: "", role: "user" });
      router.refresh();
    } catch {
      setOk(false);
      setMsg("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm">
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UserPlus className="h-4 w-4 text-[#5a636e]" />
          Benutzer erstellen
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted">Nur Administratoren können neue Konten anlegen.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Vollständiger Name
            </label>
            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className="field" required />
          </div>

          <div>
            <label htmlFor="email" className="label">
              E-Mail-Adresse
            </label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="field" required />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="field"
              required
            />
            <p className="mt-1.5 text-xs text-muted">Mindestens 8 Zeichen.</p>
          </div>

          <div>
            <label htmlFor="role" className="label">
              Rolle
            </label>
            <select id="role" name="role" value={form.role} onChange={handleChange} className="field">
              <option value="user">Mitarbeiter</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Wird erstellt …" : "Konto erstellen"}
          </button>

          {msg ? (
            <div
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm ${
                ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {msg}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
