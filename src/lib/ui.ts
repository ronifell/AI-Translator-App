/**
 * Shared UI tokens for consistent, modern controls across the app.
 * Single accent (indigo), neutral zinc surfaces, unified radii and focus rings.
 */

export const ui = {
  /** Interactive focus ring (keyboard / a11y) */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-indigo-400/90 dark:focus-visible:ring-offset-zinc-950",

  /** Raised panels */
  card:
    "rounded-xl border border-zinc-200/75 bg-white/95 shadow-sm ring-1 ring-zinc-950/[0.035] backdrop-blur-sm dark:border-zinc-800/65 dark:bg-zinc-900/92 dark:ring-white/[0.06]",

  /** Inset code / preview */
  inset:
    "rounded-lg border border-zinc-200/90 bg-zinc-50 font-mono text-xs leading-relaxed text-zinc-800 ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950/88 dark:text-zinc-200 dark:ring-white/[0.04]",

  /** Reviewed JSON (slight accent in dark mode) */
  insetResult:
    "rounded-lg border border-zinc-200/90 bg-zinc-50 font-mono text-xs leading-relaxed text-indigo-950 ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950/88 dark:text-emerald-100/95 dark:ring-white/[0.04]",

  /** Section headings */
  heading: "text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",

  /** Secondary copy */
  muted: "text-xs leading-relaxed text-zinc-500 dark:text-zinc-400",

  /** Form labels */
  label: "text-xs font-medium text-zinc-600 dark:text-zinc-400",

  /** Primary CTA */
  btnPrimary:
    "inline-flex min-h-[2.5rem] flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600/20 transition hover:bg-indigo-500 active:bg-indigo-600 disabled:pointer-events-none disabled:opacity-40 dark:bg-indigo-500 dark:ring-indigo-400/25 dark:hover:bg-indigo-400 dark:active:bg-indigo-500",

  /** Secondary / outline */
  btnSecondary:
    "inline-flex min-h-[2.5rem] flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-800/90",

  /** Compact primary (toolbar) */
  btnPrimarySm:
    "inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-indigo-600/20 transition hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400",

  /** Ghost / list row */
  btnGhost:
    "rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100/95 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/90 dark:hover:text-zinc-100",

  /** Segmented control track (theme, locale, diff mode) */
  segmented:
    "inline-flex rounded-xl border border-zinc-200/90 bg-zinc-100/85 p-1 shadow-inner dark:border-zinc-700/90 dark:bg-zinc-800/85",

  /** Select / text input */
  field:
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20",

  /** Dashed upload target */
  dropzone:
    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300/95 bg-zinc-50/60 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-zinc-600 dark:bg-zinc-950/35 dark:hover:border-indigo-500/70 dark:hover:bg-indigo-950/25",

  /** Inline link */
  link: "text-sm font-medium text-indigo-600 underline-offset-2 transition hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300",

  /** Error banner */
  error:
    "rounded-xl border border-red-200/95 bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:border-red-900/55 dark:bg-red-950/45 dark:text-red-100",

  /** Progress track */
  progressTrack: "h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800",

  /** Progress fill */
  progressFill: "h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-300 dark:from-indigo-500 dark:to-violet-400",
} as const;

/** Tab text inside main toolbar segment */
export function uiMainTab(active: boolean): string {
  return [
    "rounded-md px-3 py-1.5 text-sm font-medium transition",
    active
      ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-950/[0.06] dark:bg-zinc-700/95 dark:text-white dark:ring-white/[0.08]"
      : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-100",
  ].join(" ");
}

/** Option inside `ui.segmented` */
export function uiSegmentItem(active: boolean): string {
  return [
    "inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-center text-xs font-semibold transition sm:text-[0.8125rem]",
    active
      ? "bg-white text-indigo-900 shadow-sm ring-1 ring-zinc-950/[0.06] dark:bg-zinc-700 dark:text-white dark:ring-white/[0.08]"
      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
  ].join(" ");
}

/** Change list row selection */
export function uiChangeRow(active: boolean): string {
  return [
    "mb-1.5 w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
    active
      ? "bg-indigo-100 font-medium text-indigo-950 dark:bg-indigo-950/55 dark:text-indigo-50"
      : "text-zinc-600 hover:bg-zinc-100/95 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/90 dark:hover:text-zinc-100",
  ].join(" ");
}

/** Diff before/after toggle */
export function uiDiffToggle(active: boolean): string {
  return [
    "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition sm:text-sm",
    active
      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300",
  ].join(" ");
}
