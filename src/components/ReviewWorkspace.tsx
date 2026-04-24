"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ReviewThinkingOverlay } from "@/components/ReviewThinkingOverlay";
import type { Locale } from "@/lib/i18n";
import {
  ui,
  uiChangeRow,
  uiDiffToggle,
  uiMainTab,
  uiSegmentItem,
} from "@/lib/ui";

import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

type Messages = typeof en;

const dictionaries: Record<Locale, Messages> = { en, pt };

type ChangeRow = { path: string; before: string; after: string };
type LiveChangePreview = { path: string; before_preview: string; after_preview: string };

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ReviewWorkspace({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];

  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("pt-BR");
  const [treatBiblical, setTreatBiblical] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thinkingSample, setThinkingSample] = useState("");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [backendPct, setBackendPct] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [recentLiveChanges, setRecentLiveChanges] = useState<LiveChangePreview[]>([]);
  const [processingSpeed, setProcessingSpeed] = useState<number | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
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
    setBackendPct(null);
    setCurrentPath(null);
    setRecentLiveChanges([]);
    setProcessingSpeed(null);
    setEtaSeconds(null);
  };

  const readOriginal = useCallback(async (): Promise<string> => {
    if (!file) return "";
    const text = await file.text();
    setOriginalJson(text);
    try {
      JSON.parse(text);
    } catch {
      setError(t.errors.invalidJson);
    }
    return text;
  }, [file, t.errors.invalidJson]);

  const runReview = useCallback(async () => {
    if (!file) {
      setError(t.errors.noFile);
      return;
    }
    setError(null);
    setResultJson(null);
    setChanges([]);
    try {
      const rawJson = await readOriginal();
      setThinkingSample(rawJson);
      setBusy(true);
      setUploadPct(0);
      setBackendPct(null);
      setCurrentPath(null);
      setRecentLiveChanges([]);
      setProcessingSpeed(null);
      setEtaSeconds(null);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target_language", targetLanguage);
      fd.append("treat_biblical_texto_as_google", treatBiblical ? "true" : "false");
      const res = await uploadFormData(`${API_BASE}/api/review/upload/async`, fd, (p) => {
        setUploadPct(p);
      });
      if (!res.ok || !res.json || typeof res.json !== "object") {
        const detail =
          res.json && typeof res.json === "object" && "detail" in res.json
            ? String((res.json as { detail?: unknown }).detail)
            : res.text ?? t.errors.network;
        throw new Error(detail);
      }
      setUploadPct(100);
      const enqueue = res.json as { job_id?: unknown };
      const jobId = typeof enqueue.job_id === "string" ? enqueue.job_id : null;
      if (!jobId) {
        throw new Error(t.errors.network);
      }

      const startedAtMs = Date.now();
      while (true) {
        const statusResp = await fetch(`${API_BASE}/api/review/jobs/${jobId}`, { cache: "no-store" });
        const statusJson = (await statusResp.json()) as {
          detail?: string;
          status?: string;
          error?: string | null;
          progress_pct?: number;
          total_units?: number | null;
          completed_units?: number | null;
          current_path?: string | null;
          recent_changes?: LiveChangePreview[];
        };
        if (!statusResp.ok) {
          throw new Error(statusJson.detail ?? t.errors.network);
        }
        setBackendPct(typeof statusJson.progress_pct === "number" ? statusJson.progress_pct : null);
        setCurrentPath(typeof statusJson.current_path === "string" ? statusJson.current_path : null);
        setRecentLiveChanges(Array.isArray(statusJson.recent_changes) ? statusJson.recent_changes : []);
        const completedUnits =
          typeof statusJson.completed_units === "number" ? statusJson.completed_units : null;
        const totalUnits = typeof statusJson.total_units === "number" ? statusJson.total_units : null;
        if (completedUnits !== null && completedUnits > 0) {
          const elapsedSec = Math.max((Date.now() - startedAtMs) / 1000, 0.001);
          const unitsPerSec = completedUnits / elapsedSec;
          setProcessingSpeed(unitsPerSec);
          if (totalUnits !== null && totalUnits >= completedUnits && unitsPerSec > 0) {
            setEtaSeconds((totalUnits - completedUnits) / unitsPerSec);
          } else {
            setEtaSeconds(null);
          }
        }

        if (statusJson.status === "failed") {
          throw new Error(statusJson.error ?? statusJson.detail ?? t.errors.network);
        }
        if (statusJson.status === "completed") {
          break;
        }
        await wait(1200);
      }

      const resultResp = await fetch(`${API_BASE}/api/review/jobs/${jobId}/result`, { cache: "no-store" });
      const data = (await resultResp.json()) as {
        detail?: string;
        result: unknown;
        changes: ChangeRow[];
        change_count: number;
      };
      if (!resultResp.ok) {
        throw new Error(data.detail ?? t.errors.network);
      }
      setResultJson(JSON.stringify(data.result, null, 2));
      setChanges(Array.isArray(data.changes) ? data.changes : []);
      setActiveTab("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errors.network);
    } finally {
      setBusy(false);
      setUploadPct(null);
      setBackendPct(null);
      setCurrentPath(null);
      setRecentLiveChanges([]);
      setProcessingSpeed(null);
      setEtaSeconds(null);
      setThinkingSample("");
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
    <div className="relative box-border grid h-[100dvh] max-h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Ambient mesh — reads “designed”, not flat gray */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[15%] -top-[45%] h-[85vmin] w-[85vmin] rounded-full bg-gradient-to-br from-indigo-400/35 via-violet-400/20 to-transparent blur-3xl dark:from-indigo-600/25 dark:via-violet-600/15" />
        <div className="absolute -bottom-[35%] -right-[15%] h-[75vmin] w-[75vmin] rounded-full bg-gradient-to-tl from-cyan-400/25 via-teal-400/10 to-transparent blur-3xl dark:from-cyan-500/18 dark:via-teal-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_0%,transparent_35%,transparent_65%,rgba(248,250,252,0.65)_100%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,transparent_40%,transparent_60%,rgba(15,23,42,0.85)_100%)]" />
      </div>

      <header className="relative z-10 box-border flex min-h-[4rem] w-full shrink-0 items-center justify-between gap-4 border-b border-white/60 bg-white/65 px-[clamp(1rem,3vw,2rem)] py-3.5 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/55">
        <div className="flex min-w-0 flex-[1_1_58%] items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 shadow-lg shadow-indigo-600/35 ring-2 ring-white/40 dark:shadow-indigo-950/60 dark:ring-white/15">
            <svg className="h-6 w-6 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" aria-hidden>
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              {t.nav.subtitle}
            </p>
            <h1 className="truncate bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 bg-clip-text text-lg font-bold tracking-tight text-transparent dark:from-white dark:via-slate-100 dark:to-indigo-200 sm:text-xl">
              {t.nav.brand}
            </h1>
          </div>
        </div>

        <div className="flex min-h-0 max-w-full shrink-0 flex-row items-stretch justify-end gap-3 sm:max-w-[min(100%,36rem)] sm:gap-4">
          <div className="flex min-h-[2.5rem] min-w-0 flex-[1_1_0] basis-0 sm:max-w-[17rem]">
            <ThemeToggle
              labelLight={t.theme.light}
              labelDark={t.theme.dark}
              ariaLabel={t.theme.aria}
            />
          </div>
          <div
            role="group"
            aria-label={t.locale.label}
            className={`flex min-h-[2.5rem] w-full min-w-0 flex-[1_1_0] basis-0 items-stretch sm:max-w-[17rem] ${ui.segmented}`}
          >
            <Link
              href="/pt"
              className={`${uiSegmentItem(locale === "pt")} ${ui.focusRing}`}
            >
              {t.locale.pt}
            </Link>
            <Link
              href="/en"
              className={`${uiSegmentItem(locale === "en")} ${ui.focusRing}`}
            >
              {t.locale.en}
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-row gap-5 overflow-hidden px-[clamp(1rem,2.5vw,2rem)] pb-4 pt-4">
        <aside className="flex min-h-0 w-[min(100%,26rem)] flex-[0_0_min(100%,26rem)] flex-col gap-4 overflow-hidden lg:w-[27%] lg:flex-[0_0_27%]">
          <section className={`${ui.card} flex min-h-0 flex-[1.15_1_0%] flex-col overflow-hidden p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className={ui.heading}>{t.upload.title}</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/90 dark:text-indigo-300">
                JSON
              </span>
            </div>
            <p className={`${ui.muted} mt-2`}>{t.upload.hint}</p>
            <label className={`${ui.dropzone} mt-4 min-h-0 flex-[1_1_auto]`}>
              <input type="file" accept="application/json,.json" className="hidden" onChange={onPick} />
              <span className="text-sm font-bold text-indigo-600 transition group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                {t.upload.choose}
              </span>
              <span className={`${ui.muted} mt-2 max-w-full truncate font-[family-name:var(--font-geist-mono)] text-[0.75rem]`}>
                {file ? file.name : "—"}
              </span>
            </label>
          </section>

          <section className={`${ui.card} flex min-h-0 flex-[1.25_1_0%] flex-col overflow-hidden p-5 sm:p-6`}>
            <h2 className={ui.heading}>{t.options.title}</h2>
            <label className={`${ui.label} mt-4 block`}>{t.options.targetLang}</label>
            <select
              className={`${ui.field} mt-2 ${ui.focusRing}`}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option value="pt-BR">pt-BR</option>
              <option value="en">en</option>
              <option value="es">es</option>
            </select>
            <p className={`${ui.muted} mt-2`}>{t.options.targetLangHint}</p>
            <label className="mt-4 flex cursor-pointer items-start gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-white dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900/60">
              <input
                type="checkbox"
                className={`mt-0.5 size-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/35 dark:border-slate-600 dark:text-indigo-500 ${ui.focusRing}`}
                checked={treatBiblical}
                onChange={(e) => setTreatBiblical(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">{t.options.treatBiblical}</span>
                <span className={`${ui.muted} mt-1 block font-normal leading-snug`}>{t.options.treatBiblicalHint}</span>
              </span>
            </label>
          </section>

          <div className="flex min-h-[3.25rem] shrink-0 gap-3">
            <button
              type="button"
              disabled={busy || !file}
              onClick={() => void runReview()}
              className={`${ui.btnPrimary} ${ui.focusRing}`}
            >
              {busy ? t.progress.uploading : t.actions.start}
            </button>
            <button type="button" onClick={clearAll} className={`${ui.btnSecondary} ${ui.focusRing}`}>
              {t.actions.clear}
            </button>
          </div>

          {error && (
            <div className={`${ui.error} max-h-[18%] shrink-0 overflow-hidden`}>
              <span className="line-clamp-4">{error}</span>
            </div>
          )}
        </aside>

        <main className={`${ui.card} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}>
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200/70 bg-gradient-to-r from-white/40 to-indigo-50/30 px-4 py-3 dark:border-slate-700/70 dark:from-slate-900/40 dark:to-indigo-950/30 sm:px-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-2xl bg-slate-100/95 p-1 shadow-inner shadow-slate-900/[0.04] dark:bg-slate-950/90 dark:shadow-black/40">
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
                  className={`${uiMainTab(activeTab === id)} ${ui.focusRing}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-3">
              <span
                className={`hidden rounded-full bg-white/95 px-3 py-1 text-[0.75rem] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-800/95 dark:text-slate-300 dark:ring-slate-600 sm:inline`}
              >
                {t.changes.count.replace("{count}", String(changeCount))}
              </span>
              <button
                type="button"
                disabled={!resultJson}
                onClick={downloadResult}
                className={`${ui.btnPrimarySm} ${ui.focusRing}`}
              >
                {t.actions.download}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
            {activeTab === "result" && (
              <pre
                className={`${ui.insetResult} min-h-0 flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-5 border-indigo-200/50 bg-gradient-to-b from-white to-indigo-50/50 text-indigo-950 dark:border-indigo-500/30 dark:from-slate-950 dark:to-indigo-950/50 dark:text-zinc-100`}
              >
                {resultJson ?? (
                  <span className="text-slate-500 dark:text-slate-400">{t.progress.idle}</span>
                )}
              </pre>
            )}

            {activeTab === "original" && (
              <pre
                className={`${ui.inset} min-h-0 flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-5 border-slate-200/90 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200`}
              >
                {originalJson ?? (
                  <span className="text-slate-500 dark:text-slate-400">{t.progress.idle}</span>
                )}
              </pre>
            )}

            {activeTab === "changes" && (
              <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
                <div className="min-h-0 w-[38%] flex-[0_0_38%] overflow-hidden">
                  {changes.length === 0 ? (
                    <p className={`${ui.muted} text-sm`}>{t.changes.empty}</p>
                  ) : (
                    <ul className="h-full overflow-y-auto overflow-x-hidden pr-1 text-xs">
                      {changes.map((c, i) => (
                        <li key={`${c.path}-${i}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setDiffIdx(i);
                              setDiffMode("after");
                            }}
                            className={`${uiChangeRow(diffIdx === i)} ${ui.focusRing}`}
                          >
                            <span className="break-all font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-slate-800 dark:text-slate-300">
                              {c.path}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div
                  className={`${ui.inset} flex min-h-0 min-w-0 flex-[1_1_60%] flex-col overflow-hidden p-4`}
                >
                  <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
                    <span className={`${ui.label}`}>{t.diff.toggle}</span>
                    <div className={`flex min-w-0 ${ui.segmented}`}>
                      <button
                        type="button"
                        onClick={() => setDiffMode("before")}
                        className={`${uiDiffToggle(diffMode === "before")} ${ui.focusRing}`}
                      >
                        {t.diff.showOriginal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffMode("after")}
                        className={`${uiDiffToggle(diffMode === "after")} ${ui.focusRing}`}
                      >
                        {t.diff.showCorrected}
                      </button>
                    </div>
                  </div>
                  <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed text-slate-800 dark:text-slate-100">
                    {diffSnippet ?? (
                      <span className="text-slate-500 dark:text-slate-400">{t.changes.empty}</span>
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <footer
            className={`shrink-0 border-t border-slate-200/70 bg-slate-50/50 px-4 py-3 text-center ${ui.muted} dark:border-slate-700/70 dark:bg-slate-950/40`}
          >
            {t.footer.note}
          </footer>
        </main>
      </div>

      <div
        className={`relative z-10 flex min-h-10 shrink-0 items-center justify-center gap-2 border-t border-white/50 bg-white/50 px-[clamp(1rem,3vw,2rem)] py-2.5 text-[0.75rem] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40 ${ui.muted}`}
      >
        <span className="truncate font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-slate-500 dark:text-slate-500">
          API: {API_BASE}
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <Link href={locale === "pt" ? "/en" : "/pt"} className={`${ui.link} shrink-0 ${ui.focusRing} rounded`}>
          {locale === "pt" ? "English" : "Português (Brasil)"}
        </Link>
      </div>

      {busy && (
        <ReviewThinkingOverlay
          open={busy}
          jsonSample={thinkingSample}
          uploadPct={uploadPct}
          backendPct={backendPct}
          currentPath={currentPath}
          recentChanges={recentLiveChanges}
          processingSpeed={processingSpeed}
          etaSeconds={etaSeconds}
          labels={{
            title: t.thinking.title,
            reading: t.thinking.reading,
            thinking: t.thinking.thinking,
            currentPath: t.thinking.currentPath,
            noPath: t.thinking.noPath,
            recentChanges: t.thinking.recentChanges,
            noRecentChanges: t.thinking.noRecentChanges,
            speed: t.thinking.speed,
            eta: t.thinking.eta,
          }}
        />
      )}
    </div>
  );
}
