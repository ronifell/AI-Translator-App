"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

export type ThinkingLabels = {
  title: string;
  reading: string;
  thinking: string;
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-6"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={labels.title}
    >
      {/* Light scrim so the workspace stays visible underneath */}
      <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px] dark:bg-slate-950/25 dark:backdrop-blur-sm" />

      {/*
        Vertically centered block. Stream uses a fixed height so flex centering does not jump when
        JSON changes; lines wrap (no horizontal scrollbar).
      */}
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-6 py-8">
        {/* Orb + focal point — bold / high-contrast */}
        <div className="relative mb-8 shrink-0 flex h-28 w-28 items-center justify-center">
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

        <div className="mb-5 shrink-0 text-center">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 drop-shadow-sm dark:text-white">
            {labels.title}
          </h2>
          <p className="mt-2 bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-700 bg-clip-text text-sm font-bold text-transparent animate-thinking-shimmer dark:from-indigo-300 dark:via-white dark:to-indigo-300">
            {uploadPct != null ? `${labels.reading} · ${uploadPct}%` : labels.thinking}
          </p>
        </div>

        {/* Flowing JSON — fixed height (stable center); wrap long lines; no horizontal scrollbar */}
        <pre
          className="thinking-stream-box h-[min(32vh,220px)] w-full shrink-0 overflow-x-hidden overflow-y-auto border-0 bg-transparent py-2 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap break-all text-slate-600/35 dark:text-slate-400/35"
        >
          <span className="thinking-cursor mr-0.5 inline-block h-4 w-px translate-y-0.5 bg-slate-500/35 align-middle dark:bg-slate-400/35" />
          {snippet || "…"}
        </pre>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
