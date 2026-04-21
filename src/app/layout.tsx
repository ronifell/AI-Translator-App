import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/ThemeProvider";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Multilingual Text Review",
  description: "Precision correction for multilingual biblical JSON",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeHeader = (await headers()).get("x-locale");
  const locale = locales.includes(localeHeader as Locale)
    ? (localeHeader as Locale)
    : defaultLocale;
  const htmlLang = locale === "pt" ? "pt-BR" : "en";

  return (
    <html lang={htmlLang} className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased transition-colors dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
