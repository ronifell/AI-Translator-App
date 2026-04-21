"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ui, uiSegmentItem } from "@/lib/ui";

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
        className="h-full min-h-[2.5rem] w-full rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/80"
        aria-hidden
      />
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex h-full min-h-[2.5rem] w-full max-w-full items-stretch ${ui.segmented}`}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        className={`${uiSegmentItem(!isDark)} ${ui.focusRing}`}
      >
        {labelLight}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        className={`${uiSegmentItem(isDark)} ${ui.focusRing}`}
      >
        {labelDark}
      </button>
    </div>
  );
}
