"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
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

const card =
  "rounded-[min(0.75vw,0.65rem)] border border-zinc-200/90 bg-white/95 shadow-[0_1px_0_0_rgba(15,23,42,0.05)] dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-none";

const labelText =
  "text-[length:clamp(0.65rem,0.95vw,0.8125rem)] font-medium text-zinc-500 dark:text-zinc-400";

const inputBase =
  "w-full rounded-[min(0.5vw,0.45rem)] border border-zinc-200/95 bg-white/90 px-[4%] py-[3.5%] text-[length:clamp(0.7rem,1vw,0.875rem)] text-zinc-900 outline-none ring-indigo-500/0 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100";

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

  const tabBtn = (active: boolean) =>
    `rounded-[min(0.45vw,0.4rem)] px-[3.5%] py-[2.2%] text-[length:clamp(0.68rem,0.95vw,0.8125rem)] font-medium transition ${
      active
        ? "bg-white text-indigo-900 shadow-sm dark:bg-zinc-800 dark:text-indigo-100"
        : "text-zinc-500 hover:bg-zinc-100/90 dark:text-zinc-500 dark:hover:bg-zinc-800/80"
    }`;

  return (
    <div className="box-border grid h-[100dvh] max-h-[100dvh] w-full grid-rows-[minmax(2.75rem,9%)_minmax(0,1fr)_minmax(1.5rem,5.5%)] overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="box-border flex min-h-0 w-full items-center justify-between gap-[2%] border-b border-zinc-200/90 px-[2.5%] py-[1.2%] dark:border-zinc-800/90">
        <div className="min-w-0 flex-[1_1_58%]">
          <p className="text-[length:clamp(0.58rem,0.85vw,0.7rem)] font-semibold uppercase tracking-[0.14em] text-indigo-600/90 dark:text-indigo-400/95">
            {t.nav.subtitle}
          </p>
          <h1 className="truncate text-[length:clamp(1.05rem,1.75vw,1.4rem)] font-semibold tracking-tight text-zinc-900 dark:text-white">
            {t.nav.brand}
          </h1>
        </div>

        <div className="flex min-h-0 w-[38%] max-w-[42%] shrink-0 items-center justify-end gap-[4%]">
          <div className="w-[44%] min-w-0">
            <ThemeToggle
              labelLight={t.theme.light}
              labelDark={t.theme.dark}
              ariaLabel={t.theme.aria}
            />
          </div>
          <div className="flex min-w-0 w-[52%] flex-col items-end gap-[8%]">
            <span className={`${labelText} text-right`}>{t.locale.label}</span>
            <div className="flex w-full rounded-[min(0.55vw,0.45rem)] border border-zinc-200/90 bg-white/90 p-[2%] dark:border-zinc-700 dark:bg-zinc-900/80">
              <Link
                href="/pt"
                className={`flex-[1_1_50%] rounded-[min(0.35vw,0.3rem)] px-[6%] py-[5%] text-center text-[length:clamp(0.65rem,0.9vw,0.78rem)] font-medium transition ${
                  locale === "pt"
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {t.locale.pt}
              </Link>
              <Link
                href="/en"
                className={`flex-[1_1_50%] rounded-[min(0.35vw,0.3rem)] px-[6%] py-[5%] text-center text-[length:clamp(0.65rem,0.9vw,0.78rem)] font-medium transition ${
                  locale === "en"
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {t.locale.en}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-row gap-[1.5%] overflow-hidden px-[2%] pb-[0.75%] pt-[0.75%]">
        <aside className="flex min-h-0 w-[27%] flex-[0_0_27%] flex-col gap-[1.5%] overflow-hidden">
          <section className={`${card} flex min-h-0 flex-[1.15_1_0%] flex-col overflow-hidden p-[4.5%]`}>
            <h2 className="text-[length:clamp(0.78rem,1.05vw,0.9rem)] font-semibold text-zinc-900 dark:text-zinc-100">
              {t.upload.title}
            </h2>
            <p className="mt-[3%] text-[length:clamp(0.62rem,0.88vw,0.75rem)] leading-snug text-zinc-500 dark:text-zinc-400">
              {t.upload.hint}
            </p>
            <label className="mt-[4%] flex min-h-0 flex-[1_1_auto] cursor-pointer flex-col items-center justify-center rounded-[min(0.65vw,0.55rem)] border border-dashed border-zinc-300/95 bg-zinc-50/90 px-[4%] py-[6%] text-center transition hover:border-indigo-400/60 hover:bg-white dark:border-zinc-600 dark:bg-zinc-950/40 dark:hover:border-indigo-500/50">
              <input type="file" accept="application/json,.json" className="hidden" onChange={onPick} />
              <span className="text-[length:clamp(0.72rem,1vw,0.85rem)] font-semibold text-indigo-600 dark:text-indigo-400">
                {t.upload.choose}
              </span>
              <span className="mt-[3%] max-w-full truncate text-[length:clamp(0.6rem,0.85vw,0.72rem)] text-zinc-500">
                {file ? file.name : "—"}
              </span>
            </label>
          </section>

          <section className={`${card} flex min-h-0 flex-[1.25_1_0%] flex-col overflow-hidden p-[4.5%]`}>
            <h2 className="text-[length:clamp(0.78rem,1.05vw,0.9rem)] font-semibold text-zinc-900 dark:text-zinc-100">
              {t.options.title}
            </h2>
            <label className={`${labelText} mt-[4%]`}>{t.options.targetLang}</label>
            <select className={`${inputBase} mt-[2.5%]`} value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
              <option value="pt-BR">pt-BR</option>
              <option value="en">en</option>
              <option value="es">es</option>
            </select>
            <p className="mt-[3%] text-[length:clamp(0.58rem,0.82vw,0.72rem)] leading-snug text-zinc-500 dark:text-zinc-500">
              {t.options.targetLangHint}
            </p>
            <label className="mt-[5%] flex cursor-pointer items-start gap-[3%] text-[length:clamp(0.68rem,0.95vw,0.8rem)] text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                className="mt-[1%] h-[3.5vmin] w-[3.5vmin] min-h-[0.9rem] min-w-[0.9rem] max-h-[1.1rem] max-w-[1.1rem] rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600"
                checked={treatBiblical}
                onChange={(e) => setTreatBiblical(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.options.treatBiblical}</span>
                <span className="mt-[2%] block text-[length:clamp(0.58rem,0.82vw,0.72rem)] font-normal text-zinc-500 dark:text-zinc-500">
                  {t.options.treatBiblicalHint}
                </span>
              </span>
            </label>
          </section>

          <div className="flex h-[12%] max-h-[15%] min-h-[7%] shrink-0 gap-[3%]">
            <button
              type="button"
              disabled={busy || !file}
              onClick={() => void runReview()}
              className="flex flex-[1_1_58%] items-center justify-center rounded-[min(0.55vw,0.45rem)] bg-indigo-600 px-[3%] py-[3%] text-[length:clamp(0.68rem,0.95vw,0.82rem)] font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {busy ? t.progress.uploading : t.actions.start}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex flex-[1_1_38%] items-center justify-center rounded-[min(0.55vw,0.45rem)] border border-zinc-200/95 bg-white px-[3%] py-[3%] text-[length:clamp(0.68rem,0.95vw,0.82rem)] font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t.actions.clear}
            </button>
          </div>

          {busy && (
            <div className={`${card} max-h-[22%] shrink-0 overflow-hidden p-[3.5%]`}>
              <div className="flex items-center justify-between text-[length:clamp(0.6rem,0.85vw,0.72rem)] text-zinc-500">
                <span>{t.progress.uploading}</span>
                {uploadPct != null && <span>{uploadPct}%</span>}
              </div>
              <div className="mt-[3%] h-[18%] min-h-[0.35rem] overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-300 dark:from-indigo-500 dark:to-violet-400"
                  style={{
                    width: uploadPct != null ? `${Math.max(8, uploadPct)}%` : "38%",
                  }}
                />
              </div>
              <p className="mt-[3%] text-[length:clamp(0.55rem,0.78vw,0.68rem)] text-zinc-500">{t.progress.note}</p>
            </div>
          )}

          {error && (
            <div
              className="max-h-[18%] shrink-0 overflow-hidden rounded-[min(0.55vw,0.45rem)] border border-red-200/90 bg-red-50/95 px-[3.5%] py-[3%] text-[length:clamp(0.65rem,0.9vw,0.78rem)] text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
            >
              <span className="line-clamp-4">{error}</span>
            </div>
          )}
        </aside>

        <main className={`${card} flex min-h-0 min-w-0 flex-[1_1_71.5%] flex-col overflow-hidden`}>
          <div className="flex shrink-0 flex-wrap items-center gap-[2%] border-b border-zinc-200/90 px-[2.5%] py-[1.8%] dark:border-zinc-800/90">
            {(
              [
                ["result", t.tabs.result],
                ["changes", t.tabs.changes],
                ["original", t.tabs.original],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={tabBtn(activeTab === id)}>
                {label}
              </button>
            ))}
            <div className="ml-auto flex min-w-0 items-center gap-[3%]">
              <span className="truncate text-[length:clamp(0.6rem,0.85vw,0.72rem)] text-zinc-500">
                {t.changes.count.replace("{count}", String(changeCount))}
              </span>
              <button
                type="button"
                disabled={!resultJson}
                onClick={downloadResult}
                className="shrink-0 rounded-[min(0.45vw,0.4rem)] bg-indigo-600 px-[3.5%] py-[2.2%] text-[length:clamp(0.6rem,0.82vw,0.72rem)] font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500"
              >
                {t.actions.download}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-[2%]">
            {activeTab === "result" && (
              <pre className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-[min(0.55vw,0.45rem)] bg-zinc-50/95 p-[2.5%] font-mono text-[length:clamp(0.58rem,0.88vw,0.78rem)] leading-relaxed text-indigo-950 ring-1 ring-zinc-200/90 dark:bg-zinc-950/80 dark:text-emerald-100/95 dark:ring-zinc-800">
                {resultJson ?? <span className="text-zinc-400">{t.progress.idle}</span>}
              </pre>
            )}

            {activeTab === "original" && (
              <pre className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-[min(0.55vw,0.45rem)] bg-zinc-50/95 p-[2.5%] font-mono text-[length:clamp(0.58rem,0.88vw,0.78rem)] leading-relaxed text-zinc-800 ring-1 ring-zinc-200/90 dark:bg-zinc-950/80 dark:text-zinc-300 dark:ring-zinc-800">
                {originalJson ?? <span className="text-zinc-400">{t.progress.idle}</span>}
              </pre>
            )}

            {activeTab === "changes" && (
              <div className="flex min-h-0 flex-1 gap-[2%] overflow-hidden">
                <div className="min-h-0 w-[38%] flex-[0_0_38%] overflow-hidden">
                  {changes.length === 0 ? (
                    <p className="text-[length:clamp(0.68rem,0.95vw,0.8rem)] text-zinc-500">{t.changes.empty}</p>
                  ) : (
                    <ul className="h-full overflow-y-auto overflow-x-hidden pr-[2%] text-[length:clamp(0.58rem,0.85vw,0.75rem)]">
                      {changes.map((c, i) => (
                        <li key={`${c.path}-${i}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setDiffIdx(i);
                              setDiffMode("after");
                            }}
                            className={`mb-[2%] w-full rounded-[min(0.45vw,0.4rem)] px-[3%] py-[2.5%] text-left transition ${
                              diffIdx === i
                                ? "bg-indigo-100/95 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-100"
                                : "text-zinc-600 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                            }`}
                          >
                            <span className="break-all font-mono text-[length:clamp(0.55rem,0.8vw,0.7rem)] text-zinc-800 dark:text-zinc-300">
                              {c.path}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex min-h-0 min-w-0 flex-[1_1_60%] flex-col overflow-hidden rounded-[min(0.55vw,0.45rem)] bg-zinc-50/95 p-[2.5%] ring-1 ring-zinc-200/90 dark:bg-zinc-950/70 dark:ring-zinc-800">
                  <div className="mb-[2%] flex shrink-0 flex-wrap items-center gap-[3%]">
                    <span className="text-[length:clamp(0.6rem,0.85vw,0.72rem)] font-medium text-zinc-500">{t.diff.toggle}</span>
                    <div className="flex rounded-[min(0.45vw,0.4rem)] border border-zinc-200/90 p-[1%] dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setDiffMode("before")}
                        className={`rounded-[min(0.3vw,0.25rem)] px-[4%] py-[2.5%] text-[length:clamp(0.58rem,0.82vw,0.72rem)] font-medium ${
                          diffMode === "before"
                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                            : "text-zinc-500"
                        }`}
                      >
                        {t.diff.showOriginal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffMode("after")}
                        className={`rounded-[min(0.3vw,0.25rem)] px-[4%] py-[2.5%] text-[length:clamp(0.58rem,0.82vw,0.72rem)] font-medium ${
                          diffMode === "after"
                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                            : "text-zinc-500"
                        }`}
                      >
                        {t.diff.showCorrected}
                      </button>
                    </div>
                  </div>
                  <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-[length:clamp(0.58rem,0.88vw,0.78rem)] leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {diffSnippet ?? <span className="text-zinc-400">{t.changes.empty}</span>}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-zinc-200/90 px-[2.5%] py-[1.2%] text-center text-[length:clamp(0.55rem,0.78vw,0.68rem)] text-zinc-500 dark:border-zinc-800/90 dark:text-zinc-500">
            {t.footer.note}
          </footer>
        </main>
      </div>

      <div className="flex min-h-0 shrink-0 items-center justify-center gap-[1.5%] border-t border-zinc-200/90 px-[2%] py-[0.9%] text-[length:clamp(0.55rem,0.78vw,0.68rem)] text-zinc-500 dark:border-zinc-800/90 dark:text-zinc-500">
        <span className="truncate">
          API: {API_BASE}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <Link href={locale === "pt" ? "/en" : "/pt"} className="shrink-0 font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          {locale === "pt" ? "English" : "Português (Brasil)"}
        </Link>
      </div>
    </div>
  );
}
