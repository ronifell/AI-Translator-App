"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
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
    <div className="box-border grid h-[100dvh] max-h-[100dvh] w-full grid-rows-[minmax(2.75rem,9%)_minmax(0,1fr)_minmax(1.5rem,5.5%)] overflow-hidden bg-gradient-to-b from-zinc-50 via-zinc-50 to-zinc-100/90 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-50">
      <header className="box-border flex min-h-0 w-full items-center justify-between gap-4 border-b border-zinc-200/60 bg-white/50 px-[2.5%] py-3 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/50">
        <div className="min-w-0 flex-[1_1_58%]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
            {t.nav.subtitle}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            {t.nav.brand}
          </h1>
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

      <div className="flex min-h-0 w-full flex-row gap-[1.5%] overflow-hidden px-[2%] pb-[0.75%] pt-[0.75%]">
        <aside className="flex min-h-0 w-[27%] flex-[0_0_27%] flex-col gap-3 overflow-hidden">
          <section className={`${ui.card} flex min-h-0 flex-[1.15_1_0%] flex-col overflow-hidden p-4 sm:p-5`}>
            <h2 className={ui.heading}>{t.upload.title}</h2>
            <p className={`${ui.muted} mt-2`}>{t.upload.hint}</p>
            <label className={`${ui.dropzone} mt-3 min-h-0 flex-[1_1_auto]`}>
              <input type="file" accept="application/json,.json" className="hidden" onChange={onPick} />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{t.upload.choose}</span>
              <span className={`${ui.muted} mt-2 max-w-full truncate`}>{file ? file.name : "—"}</span>
            </label>
          </section>

          <section className={`${ui.card} flex min-h-0 flex-[1.25_1_0%] flex-col overflow-hidden p-4 sm:p-5`}>
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
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                className={`mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-600 dark:text-indigo-500 ${ui.focusRing}`}
                checked={treatBiblical}
                onChange={(e) => setTreatBiblical(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.options.treatBiblical}</span>
                <span className={`${ui.muted} mt-1 block font-normal`}>{t.options.treatBiblicalHint}</span>
              </span>
            </label>
          </section>

          <div className="flex h-[12%] max-h-[15%] min-h-[7%] shrink-0 gap-2">
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

          {busy && (
            <div className={`${ui.card} max-h-[22%] shrink-0 overflow-hidden p-4`}>
              <div className={`${ui.muted} flex items-center justify-between font-medium`}>
                <span>{t.progress.uploading}</span>
                {uploadPct != null && <span>{uploadPct}%</span>}
              </div>
              <div className={`${ui.progressTrack} mt-3`}>
                <div
                  className={ui.progressFill}
                  style={{
                    width: uploadPct != null ? `${Math.max(8, uploadPct)}%` : "38%",
                  }}
                />
              </div>
              <p className={`${ui.muted} mt-3`}>{t.progress.note}</p>
            </div>
          )}

          {error && (
            <div className={`${ui.error} max-h-[18%] shrink-0 overflow-hidden`}>
              <span className="line-clamp-4">{error}</span>
            </div>
          )}
        </aside>

        <main className={`${ui.card} flex min-h-0 min-w-0 flex-[1_1_71.5%] flex-col overflow-hidden`}>
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200/80 px-3 py-2.5 sm:px-4 dark:border-zinc-800/80">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-xl bg-zinc-100/85 p-1 dark:bg-zinc-800/85">
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
              <span className={`${ui.muted} hidden font-medium sm:inline`}>
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
            {activeTab === "result" && (
              <pre className={`${ui.insetResult} min-h-0 flex-1 overflow-y-auto overflow-x-auto p-4`}>
                {resultJson ?? <span className="text-zinc-400">{t.progress.idle}</span>}
              </pre>
            )}

            {activeTab === "original" && (
              <pre className={`${ui.inset} min-h-0 flex-1 overflow-y-auto overflow-x-auto p-4`}>
                {originalJson ?? <span className="text-zinc-400">{t.progress.idle}</span>}
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
                            <span className="break-all font-mono text-[0.7rem] text-zinc-800 dark:text-zinc-300">
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
                  <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {diffSnippet ?? <span className="text-zinc-400">{t.changes.empty}</span>}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <footer
            className={`shrink-0 border-t border-zinc-200/80 px-4 py-2.5 text-center ${ui.muted} dark:border-zinc-800/80`}
          >
            {t.footer.note}
          </footer>
        </main>
      </div>

      <div
        className={`flex min-h-0 shrink-0 items-center justify-center gap-2 border-t border-zinc-200/80 px-[2%] py-2 ${ui.muted} dark:border-zinc-800/80`}
      >
        <span className="truncate">API: {API_BASE}</span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <Link href={locale === "pt" ? "/en" : "/pt"} className={`${ui.link} shrink-0 ${ui.focusRing} rounded`}>
          {locale === "pt" ? "English" : "Português (Brasil)"}
        </Link>
      </div>
    </div>
  );
}
