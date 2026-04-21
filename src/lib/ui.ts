/**
 * Shared UI tokens — contemporary glass + indigo/violet accent, slate neutrals.
 */

export const ui = {
  /** Interactive focus ring (keyboard / a11y) */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400/80 dark:focus-visible:ring-offset-slate-950",

  /** Raised panels — frosted glass */
  card:
    "rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-950/[0.04] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-black/40 dark:ring-white/[0.06]",

  /** Inset code / preview */
  inset:
    "rounded-xl border border-slate-200/90 bg-slate-50/95 font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed text-slate-800 shadow-inner shadow-slate-900/[0.03] ring-1 ring-slate-950/[0.03] dark:border-slate-700/90 dark:bg-slate-950/95 dark:text-slate-200 dark:shadow-black/30 dark:ring-white/[0.05]",

  /** Reviewed JSON */
  insetResult:
    "rounded-xl border border-indigo-200/40 bg-gradient-to-b from-white to-indigo-50/40 font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed text-indigo-950 shadow-inner shadow-indigo-950/[0.04] ring-1 ring-indigo-950/[0.05] dark:border-indigo-500/25 dark:from-slate-900 dark:to-indigo-950/40 dark:text-slate-100 dark:shadow-black/40 dark:ring-indigo-400/15",

  /** Section headings */
  heading:
    "text-[0.9375rem] font-semibold tracking-tight text-slate-900 dark:text-white",

  /** Secondary copy */
  muted: "text-[0.8125rem] leading-relaxed text-slate-500 dark:text-slate-400",

  /** Form labels */
  label: "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400",

  /** Primary CTA */
  btnPrimary:
    "inline-flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 dark:from-violet-500 dark:to-indigo-500 dark:shadow-indigo-900/40 dark:hover:from-violet-400 dark:hover:to-indigo-400",

  /** Secondary / outline */
  btnSecondary:
    "inline-flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/95 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-md shadow-slate-900/[0.04] transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/30 dark:hover:border-slate-500 dark:hover:bg-slate-800",

  /** Compact primary (toolbar) */
  btnPrimarySm:
    "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/10 transition hover:from-violet-500 hover:to-indigo-500 disabled:pointer-events-none disabled:opacity-40 dark:from-violet-500 dark:to-indigo-500",

  /** Ghost / list row */
  btnGhost:
    "rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/90 dark:hover:text-slate-100",

  /** Segmented control track */
  segmented:
    "inline-flex rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner shadow-slate-900/[0.03] dark:border-slate-600/90 dark:bg-slate-900/90 dark:shadow-black/30",

  /** Select / text input */
  field:
    "w-full rounded-xl border border-slate-200/95 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25",

  /** Upload dropzone */
  dropzone:
    "group flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/90 bg-gradient-to-b from-white/80 to-slate-50/90 px-4 py-9 text-center shadow-inner shadow-slate-900/[0.02] transition hover:border-indigo-400/90 hover:bg-gradient-to-b hover:from-indigo-50/80 hover:to-violet-50/50 hover:shadow-md hover:shadow-indigo-500/10 dark:border-slate-600 dark:from-slate-900/50 dark:to-slate-950/90 dark:hover:border-indigo-400/60 dark:hover:from-indigo-950/40 dark:hover:to-violet-950/30",

  /** Inline link */
  link: "text-sm font-semibold text-indigo-600 underline-offset-[3px] transition hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300",

  /** Error banner */
  error:
    "rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm font-medium text-red-900 shadow-sm shadow-red-900/5 backdrop-blur-sm dark:border-red-900/50 dark:bg-red-950/55 dark:text-red-100",

  /** Progress track */
  progressTrack: "h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",

  /** Progress fill */
  progressFill:
    "h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 transition-all duration-300 dark:from-violet-500 dark:via-indigo-500 dark:to-cyan-400",
} as const;

/** Tab text inside main toolbar segment */
export function uiMainTab(active: boolean): string {
  return [
    "rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200",
    active
      ? "bg-white text-slate-900 shadow-md shadow-slate-900/[0.06] ring-1 ring-slate-200/80 dark:bg-gradient-to-b dark:from-slate-600 dark:to-slate-700 dark:text-white dark:shadow-black/40 dark:ring-white/10"
      : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
  ].join(" ");
}

/** Option inside `ui.segmented` */
export function uiSegmentItem(active: boolean): string {
  return [
    "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold transition-all duration-200 sm:text-[0.8125rem]",
    active
      ? "bg-white text-indigo-700 shadow-md shadow-indigo-900/[0.07] ring-1 ring-indigo-100 dark:bg-gradient-to-b dark:from-indigo-600 dark:to-violet-700 dark:text-white dark:shadow-black/35 dark:ring-white/15"
      : "text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
  ].join(" ");
}

/** Change list row selection */
export function uiChangeRow(active: boolean): string {
  return [
    "mb-2 w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm transition-all duration-200",
    active
      ? "border-indigo-200/80 bg-gradient-to-r from-indigo-50 to-violet-50 font-semibold text-indigo-950 shadow-sm shadow-indigo-900/[0.06] dark:border-indigo-500/40 dark:from-indigo-950/80 dark:to-violet-950/50 dark:text-indigo-50"
      : "text-slate-600 hover:border-slate-200 hover:bg-white/90 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
  ].join(" ");
}

/** Diff before/after toggle */
export function uiDiffToggle(active: boolean): string {
  return [
    "flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition sm:text-sm",
    active
      ? "bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white"
      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
  ].join(" ");
}
