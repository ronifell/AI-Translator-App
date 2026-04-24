"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

export type ThinkingLabels = {
  title: string;
  reading: string;
  thinking: string;
  currentPath: string;
  noPath: string;
  recentChanges: string;
  noRecentChanges: string;
  speed: string;
  eta: string;
};

type LiveChange = {
  path: string;
  before_preview: string;
  after_preview: string;
};

type Props = {
  open: boolean;
  jsonSample: string;
  uploadPct: number | null;
  backendPct: number | null;
  currentPath: string | null;
  recentChanges: LiveChange[];
  processingSpeed: number | null;
  etaSeconds: number | null;
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
    const len = source.length;
    const maxStart = Math.max(len - windowLen, 0);
    // Adaptive stride: short text moves slowly, large JSON still reaches end in a practical time.
    const stride = Math.max(4, Math.ceil(len / 1800));
    const id = window.setInterval(() => {
      setStart((s) => {
        const next = s + stride;
        // Loop back to the start so the flow never looks "stuck"
        // on huge jobs where processing continues for a long time.
        return next > maxStart ? 0 : next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [active, source, windowLen, stepMs]);

  const snippet = useMemo(() => {
    if (!source) return "";
    return source.slice(start, start + windowLen);
  }, [source, start, windowLen]);

  return { snippet, start };
}

function countLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function upperBound(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function ReviewThinkingOverlay({
  open,
  jsonSample,
  uploadPct,
  backendPct,
  currentPath,
  recentChanges,
  processingSpeed,
  etaSeconds,
  labels,
}: Props) {
  const etaLabel = useMemo(() => {
    if (etaSeconds === null || !Number.isFinite(etaSeconds) || etaSeconds < 0) return "—";
    const secs = Math.round(etaSeconds);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }, [etaSeconds]);

  const [mounted, setMounted] = useState(false);
  const { snippet, start } = useStreamingSnippet(jsonSample, open, 220, 42);
  const [animatedPct, setAnimatedPct] = useState(0);
  const lineStarts = useMemo(() => countLineStarts(jsonSample), [jsonSample]);
  const totalLines = lineStarts.length;
  const readLine = useMemo(() => {
    if (!totalLines) return 0;
    return Math.max(1, upperBound(lineStarts, start));
  }, [lineStarts, start, totalLines]);
  const lineReadPct = useMemo(() => {
    if (!totalLines) return 0;
    return (readLine / totalLines) * 100;
  }, [readLine, totalLines]);

  const resolvedPct = useMemo(() => {
    if (typeof backendPct === "number") return backendPct;
    if (typeof uploadPct === "number" && uploadPct < 100) return uploadPct;
    return lineReadPct;
  }, [backendPct, uploadPct, lineReadPct]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setAnimatedPct(0);
      return;
    }

    const id = window.setInterval(() => {
      setAnimatedPct((prev) => {
        const target = Math.max(0, Math.min(100, resolvedPct));
        if (Math.abs(prev - target) < 0.05) return target;

        // Animate toward real line-read progress from the flowing JSON stream.
        const step = Math.max(0.35, Math.abs(target - prev) * 0.28);
        if (target > prev) return Math.min(target, prev + step);
        return Math.max(target, prev - step);
      });
    }, 80);

    return () => window.clearInterval(id);
  }, [open, resolvedPct]);

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
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-8">
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
          <div className="mx-auto mt-3 w-[min(22rem,70vw)]">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-300/60 dark:bg-slate-700/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-[width] duration-150 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, animatedPct))}%` }}
              />
            </div>
            <p className="mt-1.5 text-center font-mono text-[0.75rem] font-semibold text-slate-700 dark:text-slate-200">
              {animatedPct.toFixed(2)}%
            </p>
          </div>
          <p className="mt-2 max-w-[min(42rem,92vw)] truncate text-xs font-medium text-slate-700 dark:text-slate-200">
            {labels.currentPath}{" "}
            <span className="font-mono text-[0.68rem] text-slate-600 dark:text-slate-300">
              {currentPath ?? labels.noPath}
            </span>
          </p>
          <p className="mt-1 text-[0.72rem] font-medium text-slate-600 dark:text-slate-300">
            {labels.speed}{" "}
            <span className="font-mono">
              {processingSpeed !== null && Number.isFinite(processingSpeed)
                ? `${processingSpeed.toFixed(2)} u/s`
                : "—"}
            </span>
            {" · "}
            {labels.eta} <span className="font-mono">{etaLabel}</span>
          </p>
        </div>

        {/* Flowing JSON — fixed height (stable center); wrap long lines; no horizontal scrollbar */}
        <pre
          className="thinking-stream-box h-[min(32vh,220px)] w-full shrink-0 overflow-x-hidden overflow-y-auto border-0 bg-transparent py-2 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap break-all text-slate-600/35 dark:text-slate-400/35"
        >
          <span className="thinking-cursor mr-0.5 inline-block h-4 w-px translate-y-0.5 bg-slate-500/35 align-middle dark:bg-slate-400/35" />
          {snippet || "…"}
        </pre>

        <div className="mt-4 w-full rounded-2xl border border-slate-200/80 bg-white/65 p-3 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/45">
          <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{labels.recentChanges}</p>
          {recentChanges.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{labels.noRecentChanges}</p>
          ) : (
            <ul className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {recentChanges.map((item) => (
                <li key={item.path} className="rounded-lg border border-slate-200/80 bg-white/80 p-2 dark:border-slate-700/70 dark:bg-slate-950/55">
                  <p className="truncate font-mono text-[0.65rem] font-semibold text-indigo-700 dark:text-indigo-300">
                    {item.path}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.68rem] text-slate-600 dark:text-slate-300">
                    {item.after_preview}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
