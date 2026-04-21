"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { defaultLocale, locales, type Locale } from "@/lib/i18n";

/**
 * Keeps <html lang> in sync with the URL locale without using headers() in the root layout
 * (avoids forcing the entire document tree to be fully dynamic on every request).
 */
export function DocumentLang() {
  const pathname = usePathname();

  useEffect(() => {
    const seg = pathname.split("/").filter(Boolean)[0];
    const loc = locales.includes(seg as Locale) ? (seg as Locale) : defaultLocale;
    document.documentElement.lang = loc === "pt" ? "pt-BR" : "en";
  }, [pathname]);

  return null;
}
