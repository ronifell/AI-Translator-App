"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n";

import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

type Messages = typeof en;

const dictionaries: Record<Locale, Messages> = { en, pt };

type ChangeRow = { path: string; before: string; after: string };

const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "http://127.0.0.1:8000";

function uploadFormData(
  url: string,
  formData: FormData,
  onUploadProgress: (pct: number | null) => void,
): Promise<{ ok: boolean; status: number; json?: unknown; text?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onUploadProgress(Math.round((100 * e.loaded) / e.total));
      } else {
        onUploadProgress(null);
      }
    };
    xhr.onload = () => {
      const text = xhr.responseText;
      try {
        const json = JSON.parse(text) as unknown;
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
      } catch {
        resolve({ ok: false, status: xhr.status, text });
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(formData);
  });
}

export function ReviewWorkspace({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];

  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("pt-BR");
  const [treatBiblical, setTreatBiblical] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [originalJson, setOriginalJson] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<string | null>(null);
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [activeTab, setActiveTab] = useState<"result" | "changes" | "original">("result");
  const [diffIdx, setDiffIdx] = useState(0);
  const [diffMode, setDiffMode] = useState<"before" | "after">("after");

  const changeCount = changes.length;

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setError(null);
    setOriginalJson(null);
    setResultJson(null);
    setChanges([]);
  };

  const readOriginal = useCallback(async () => {
    if (!file) return;
    const text = await file.text();
    setOriginalJson(text);
    try {
      JSON.parse(text);
    } catch {
      setError(t.errors.invalidJson);
    }
  }, [file, t.errors.invalidJson]);

  const runReview = useCallback(async () => {
    if (!file) {
      setError(t.errors.noFile);
      return;
    }
    setError(null);
    setBusy(true);
    setUploadPct(0);
    setResultJson(null);
    setChanges([]);
    try {
      await readOriginal();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target_language", targetLanguage);
      fd.append("treat_biblical_texto_as_google", treatBiblical ? "true" : "false");
      const res = await uploadFormData(`${API_BASE}/api/review/upload`, fd, (p) => {
        setUploadPct(p);
      });
      if (!res.ok || !res.json || typeof res.json !== "object") {
        const detail =
          res.json && typeof res.json === "object" && "detail" in res.json
            ? String((res.json as { detail?: unknown }).detail)
            : res.text ?? t.errors.network;
        throw new Error(detail);
      }
      const data = res.json as {
        result: unknown;
        changes: ChangeRow[];
        change_count: number;
      };
      setResultJson(JSON.stringify(data.result, null, 2));
      setChanges(Array.isArray(data.changes) ? data.changes : []);
      setActiveTab("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errors.network);
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }, [file, readOriginal, targetLanguage, treatBiblical, t]);

  const downloadResult = useCallback(() => {
    if (!resultJson || !file) return;
    const blob = new Blob([resultJson], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    const base = file.name.replace(/\.json$/i, "");
    a.href = URL.createObjectURL(blob);
    a.download = `${base}.reviewed.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [file, resultJson]);

  const clearAll = useCallback(() => {
    setFile(null);
    setOriginalJson(null);
    setResultJson(null);
    setChanges([]);
    setError(null);
  }, []);

  const diffSnippet = useMemo(() => {
    const row = changes[diffIdx];
    if (!row) return null;
    const text = diffMode === "before" ? row.before : row.after;
    const max = 12000;
    return text.length > max ? `${text.slice(0, max)}\n…` : text;
  }, [changes, diffIdx, diffMode]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-10 flex flex-col gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">
            {t.nav.subtitle}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t.nav.brand}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{t.meta.description}</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <label className="text-xs font-medium text-slate-500">{t.locale.label}</label>
          <div className="flex rounded-lg border border-slate-700 bg-slate-900/80 p-1">
            <Link
              href="/pt"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                locale === "pt"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.locale.pt}
            </Link>
            <Link
              href="/en"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                locale === "en"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.locale.en}
            </Link>
          </div>
        </div>
      </header>

      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-semibold text-white">{t.upload.title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{t.upload.hint}</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950/50 px-4 py-8 text-center transition hover:border-emerald-500/50 hover:bg-slate-900/80">
              <input type="file" accept="application/json,.json" className="hidden" onChange={onPick} />
              <span className="text-sm font-medium text-emerald-400">{t.upload.choose}</span>
              <span className="mt-2 truncate text-xs text-slate-500">
                {file ? file.name : "—"}
              </span>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-semibold text-white">{t.options.title}</h2>
            <label className="mt-4 block text-xs font-medium text-slate-400">{t.options.targetLang}</label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500/0 transition focus:ring-2"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option value="pt-BR">pt-BR</option>
              <option value="en">en</option>
              <option value="es">es</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">{t.options.targetLangHint}</p>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                checked={treatBiblical}
                onChange={(e) => setTreatBiblical(e.target.checked)}
              />
              <span>
                <span className="font-medium text-white">{t.options.treatBiblical}</span>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {t.options.treatBiblicalHint}
                </span>
              </span>
            </label>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              disabled={busy || !file}
              onClick={() => void runReview()}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? t.progress.uploading : t.actions.start}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              {t.actions.clear}
            </button>
          </div>

          {busy && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.progress.uploading}</span>
                {uploadPct != null && <span>{uploadPct}%</span>}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                  style={{
                    width: uploadPct != null ? `${Math.max(8, uploadPct)}%` : "45%",
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">{t.progress.note}</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </aside>

        <main className="flex min-h-[480px] flex-col rounded-2xl border border-slate-800 bg-slate-900/30 shadow-inner shadow-black/30">
          <div className="flex flex-wrap gap-2 border-b border-slate-800 px-4 py-3">
            {(
              [
                ["result", t.tabs.result],
                ["changes", t.tabs.changes],
                ["original", t.tabs.original],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {t.changes.count.replace("{count}", String(changeCount))}
              </span>
              <button
                type="button"
                disabled={!resultJson}
                onClick={downloadResult}
                className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.actions.download}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            {activeTab === "result" && (
              <pre className="max-h-[560px] flex-1 overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs leading-relaxed text-emerald-100/90 ring-1 ring-slate-800">
                {resultJson ?? (
                  <span className="text-slate-600">{t.progress.idle}</span>
                )}
              </pre>
            )}

            {activeTab === "original" && (
              <pre className="max-h-[560px] flex-1 overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-300 ring-1 ring-slate-800">
                {originalJson ?? (
                  <span className="text-slate-600">{t.progress.idle}</span>
                )}
              </pre>
            )}

            {activeTab === "changes" && (
              <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
                <div className="lg:w-2/5">
                  {changes.length === 0 ? (
                    <p className="text-sm text-slate-500">{t.changes.empty}</p>
                  ) : (
                    <ul className="max-h-[520px] space-y-1 overflow-auto pr-1 text-xs">
                      {changes.map((c, i) => (
                        <li key={`${c.path}-${i}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setDiffIdx(i);
                              setDiffMode("after");
                            }}
                            className={`w-full rounded-lg px-2 py-2 text-left transition ${
                              diffIdx === i
                                ? "bg-emerald-900/40 text-emerald-100"
                                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                            }`}
                          >
                            <span className="break-all font-mono text-[11px] text-slate-300">{c.path}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-slate-950/80 p-4 ring-1 ring-slate-800">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">{t.diff.toggle}</span>
                    <div className="flex rounded-lg border border-slate-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => setDiffMode("before")}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          diffMode === "before" ? "bg-slate-700 text-white" : "text-slate-500"
                        }`}
                      >
                        {t.diff.showOriginal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffMode("after")}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          diffMode === "after" ? "bg-slate-700 text-white" : "text-slate-500"
                        }`}
                      >
                        {t.diff.showCorrected}
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-[460px] flex-1 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-200">
                    {diffSnippet ?? (
                      <span className="text-slate-600">{t.changes.empty}</span>
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-600">
            {t.footer.note}
          </footer>
        </main>
      </div>

      <p className="mt-8 text-center text-[11px] text-slate-600">
        API: {API_BASE} ·{" "}
        <Link
          href={locale === "pt" ? "/en" : "/pt"}
          className="text-emerald-500/90 hover:underline"
        >
          {locale === "pt" ? "English" : "Português (Brasil)"}
        </Link>
      </p>
    </div>
  );
}
