"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

export type ThinkingLabels = {
  title: string;
  reading: string;
  thinking: string;
  hint: string;
};

type Props = {
  open: boolean;
  jsonSample: string;
  uploadPct: number | null;
  labels: ThinkingLabels;
};

/** Sliding-window “streaming read” over JSON text for a ChatGPT-like effect */
function useStreamingSnippet(source: string, active: boolean, windowLen: number, stepMs: number) {
  const [start, setStart] = useState(0);

  useEffect(() => {
    setStart(0);
  }, [source]);

  useEffect(() => {
    if (!active || !source.length) return;
    const len = Math.min(source.length, 32000);
    const maxStart = Math.max(len - windowLen, 0);
    const id = window.setInterval(() => {
      setStart((s) => {
        const next = s + 4;
        return next > maxStart ? 0 : next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [active, source, windowLen, stepMs]);

  return useMemo(() => {
    if (!source) return "";
    return source.slice(start, start + windowLen);
  }, [source, start, windowLen]);
}

export function ReviewThinkingOverlay({ open, jsonSample, uploadPct, labels }: Props) {
  const [mounted, setMounted] = useState(false);
  const snippet = useStreamingSnippet(jsonSample, open, 220, 42);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={labels.title}
    >
      <div className="absolute inset-0 bg-zinc-900/55 backdrop-blur-md dark:bg-black/65" />

      <div className="relative flex w-full max-w-xl flex-col items-center">
        {/* Orb + pulse rings — ChatGPT-style focal point */}
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 animate-thinking-breathe rounded-full bg-gradient-to-br from-indigo-400/40 via-violet-500/35 to-fuchsia-400/40 blur-xl dark:from-indigo-500/45 dark:via-violet-500/40 dark:to-fuchsia-500/45" />
          <div className="absolute inset-2 rounded-full border border-white/30 dark:border-white/10" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 ring-4 ring-white/25 dark:shadow-indigo-900/50 dark:ring-white/10">
            <span className="thinking-dot flex gap-1">
              <span className="inline-block size-2 rounded-full bg-white/95 shadow-sm" />
              <span className="inline-block size-2 rounded-full bg-white/95 shadow-sm [animation-delay:150ms]" />
              <span className="inline-block size-2 rounded-full bg-white/95 shadow-sm [animation-delay:300ms]" />
            </span>
          </div>
        </div>

        <div className="mb-5 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm dark:text-zinc-50">
            {labels.title}
          </h2>
          <p className="mt-2 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-sm font-medium text-transparent animate-thinking-shimmer dark:from-zinc-500 dark:via-zinc-100 dark:to-zinc-500">
            {uploadPct != null ? `${labels.reading} · ${uploadPct}%` : labels.thinking}
          </p>
        </div>

        {/* JSON stream preview */}
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/75 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-950/90">
          <div className="border-b border-white/10 px-4 py-2.5 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-400">
                JSON
              </span>
            </div>
          </div>
          <pre className="max-h-[min(28vh,220px)] min-h-[120px] overflow-hidden p-4 font-mono text-[0.7rem] leading-relaxed text-emerald-100/95 [text-shadow:0_0_20px_rgba(16,185,129,0.15)] dark:text-emerald-200/90">
            <span className="thinking-cursor mr-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-emerald-400/90 align-middle" />
            {snippet || "…"}
          </pre>
        </div>

        <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-zinc-300 dark:text-zinc-400">
          {labels.hint}
        </p>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
