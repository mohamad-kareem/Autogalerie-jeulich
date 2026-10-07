"use client";

/**
 * Expertenwissen — 100 questions for the dealer. Every answer is saved at
 * once and given to the deep analysis ("Tief") as this business's own rules.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiLoader } from "react-icons/fi";

import { EXPERT_CATEGORIES, EXPERT_QUESTIONS } from "@/lib/market/expertQuestions";

function QuestionCard({ question, saved, dark, onSave }) {
  const [text, setText] = useState(saved?.answer || "");
  const [state, setState] = useState("idle"); // idle | saving | saved

  useEffect(() => {
    setText(saved?.answer || "");
  }, [saved?.answer]);

  const dirty = text.trim() !== (saved?.answer || "").trim();

  const save = async () => {
    if (!dirty) return;
    setState("saving");
    const ok = await onSave(question.id, text);
    setState(ok ? "saved" : "idle");
    if (ok) setTimeout(() => setState("idle"), 1_500);
  };

  const answered = Boolean((saved?.answer || "").trim());

  return (
    <li className={`py-3 ${dark ? "border-slate-800" : "border-slate-100"}`}>
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 inline-flex h-5 w-8 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums ${
            answered
              ? dark
                ? "bg-emerald-950/60 text-emerald-300"
                : "bg-emerald-50 text-emerald-700"
              : dark
                ? "bg-slate-800 text-slate-400"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {question.id}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug">{question.question}</p>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={save}
            rows={answered || text ? 3 : 2}
            placeholder={question.hint || "Antwort eingeben …"}
            className={`mt-1.5 w-full resize-y rounded border px-2.5 py-1.5 text-[13px] leading-relaxed outline-none focus:ring-2 ${
              dark
                ? "border-slate-700 bg-slate-950 placeholder:text-slate-600 focus:ring-sky-500/30"
                : "border-slate-300 bg-white placeholder:text-slate-400 focus:ring-sky-200"
            }`}
          />
          <div className={`mt-0.5 flex h-4 items-center justify-between text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            <span>
              {saved?.updatedAt
                ? `Gespeichert ${new Date(saved.updatedAt).toLocaleDateString("de-DE")}${saved.updatedBy ? ` · ${saved.updatedBy}` : ""}`
                : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              {state === "saving" ? (
                <>
                  <FiLoader className="animate-spin" /> speichert …
                </>
              ) : state === "saved" ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <FiCheck /> gespeichert
                </span>
              ) : dirty ? (
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={save} className="font-semibold text-sky-600 hover:underline">
                  Speichern
                </button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ExpertKnowledge({ dark }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("A");
  const [onlyOpen, setOnlyOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/market-analysis/expert");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error);
        if (active) setAnswers(data.answers || {});
      } catch (error) {
        toast.error(error?.message || "Antworten konnten nicht geladen werden.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (questionId, answer) => {
    try {
      const response = await fetch("/api/market-analysis/expert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error);
      setAnswers((current) => {
        const next = { ...current };
        if (data.answer) next[questionId] = { answer: data.answer, updatedAt: data.updatedAt, updatedBy: data.updatedBy };
        else delete next[questionId];
        return next;
      });
      return true;
    } catch (error) {
      toast.error(error?.message || "Speichern fehlgeschlagen.");
      return false;
    }
  }, []);

  const isAnswered = useCallback((id) => Boolean((answers[id]?.answer || "").trim()), [answers]);
  const total = EXPERT_QUESTIONS.filter((question) => isAnswered(question.id)).length;

  const counts = useMemo(() => {
    const result = {};
    for (const cat of EXPERT_CATEGORIES) {
      const list = EXPERT_QUESTIONS.filter((question) => question.category === cat.id);
      result[cat.id] = { done: list.filter((question) => isAnswered(question.id)).length, all: list.length };
    }
    return result;
  }, [isAnswered]);

  const visible = EXPERT_QUESTIONS.filter(
    (question) => question.category === category && (!onlyOpen || !isAnswered(question.id)),
  );
  const current = EXPERT_CATEGORIES.find((cat) => cat.id === category);

  const panel = `rounded-lg border ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`;
  const muted = dark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* categories */}
      <aside className={`${panel} min-w-0 p-3 lg:sticky lg:top-4`}>
        <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>Fortschritt</p>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-lg font-bold tabular-nums">{total} / {EXPERT_QUESTIONS.length}</span>
          <span className={`text-[11px] ${muted}`}>beantwortet</span>
        </div>
        <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${total}%` }} />
        </div>

        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {EXPERT_CATEGORIES.map((cat) => {
            const active = cat.id === category;
            const done = counts[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex shrink-0 items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
                  active
                    ? dark
                      ? "bg-slate-800 font-semibold text-slate-100"
                      : "bg-slate-100 font-semibold text-slate-900"
                    : dark
                      ? "text-slate-400 hover:bg-slate-800/60"
                      : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  <span className={`mr-1.5 font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>{cat.id}</span>
                  {cat.title}
                </span>
                <span className={`shrink-0 tabular-nums ${done.done === done.all ? "text-emerald-600" : dark ? "text-slate-500" : "text-slate-400"}`}>
                  {done.done}/{done.all}
                </span>
              </button>
            );
          })}
        </nav>

        <p className={`mt-3 border-t pt-3 text-[11px] leading-relaxed ${dark ? "border-slate-800" : "border-slate-100"} ${muted}`}>
          Die Antworten nutzt die <span className="font-semibold">Tiefe Analyse</span> als eure Regeln und Erfahrung – je genauer (Motor, km, Kosten in €), desto besser die Bewertung. Jede Antwort wird beim Verlassen des Feldes gespeichert.
        </p>
      </aside>

      {/* questions */}
      <section className={`${panel} min-w-0 px-4 pb-2 pt-3`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${dark ? "border-slate-800" : "border-slate-100"}`}>
          <h2 className="text-sm font-bold">
            {current?.id} · {current?.title}
          </h2>
          <label className={`flex cursor-pointer items-center gap-1.5 text-[11px] ${muted}`}>
            <input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} className="size-3.5 accent-slate-600" />
            Nur offene Fragen
          </label>
        </div>

        {loading ? (
          <p className={`flex items-center gap-2 py-8 text-xs ${muted}`}>
            <FiLoader className="animate-spin" /> Antworten werden geladen …
          </p>
        ) : visible.length ? (
          <ul className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
            {visible.map((question) => (
              <QuestionCard key={question.id} question={question} saved={answers[question.id]} dark={dark} onSave={save} />
            ))}
          </ul>
        ) : (
          <p className={`py-8 text-center text-xs ${muted}`}>Alle Fragen dieses Bereichs sind beantwortet.</p>
        )}

        <div className="flex justify-between py-2">
          <button
            type="button"
            disabled={category === EXPERT_CATEGORIES[0].id}
            onClick={() => setCategory(EXPERT_CATEGORIES[EXPERT_CATEGORIES.findIndex((cat) => cat.id === category) - 1].id)}
            className={`text-xs font-semibold disabled:opacity-30 ${muted} hover:underline`}
          >
            ← Zurück
          </button>
          <button
            type="button"
            disabled={category === EXPERT_CATEGORIES[EXPERT_CATEGORIES.length - 1].id}
            onClick={() => {
              setCategory(EXPERT_CATEGORIES[EXPERT_CATEGORIES.findIndex((cat) => cat.id === category) + 1].id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xs font-semibold text-sky-600 hover:underline disabled:opacity-30"
          >
            Nächster Bereich →
          </button>
        </div>
      </section>
    </div>
  );
}
