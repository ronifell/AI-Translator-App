"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Props = {
  labelLight: string;
  labelDark: string;
  ariaLabel: string;
};

export function ThemeToggle({ labelLight, labelDark, ariaLabel }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark" || resolvedTheme === "dark";

  if (!mounted) {
    return (
      <div
        className="h-[5.5vmin] min-h-[2rem] w-full max-w-[100%] rounded-[min(0.55vw,0.45rem)] bg-zinc-200/90 dark:bg-zinc-800/80"
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={ariaLabel}
      aria-pressed={isDark}
      className="inline-flex h-[5.5vmin] min-h-[2rem] max-h-[2.75rem] w-full max-w-[100%] items-center justify-center gap-[5%] rounded-[min(0.55vw,0.45rem)] border border-zinc-200/90 bg-white/90 px-[3%] text-[length:clamp(0.62rem,0.9vw,0.78rem)] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800/90"
    >
      <span
        className={`rounded-[min(0.35vw,0.3rem)] px-[5%] py-[4%] transition ${
          !isDark ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100" : "text-zinc-500"
        }`}
      >
        {labelLight}
      </span>
      <span
        className={`rounded-[min(0.35vw,0.3rem)] px-[5%] py-[4%] transition ${
          isDark ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100" : "text-zinc-500"
        }`}
      >
        {labelDark}
      </span>
    </button>
  );
}
