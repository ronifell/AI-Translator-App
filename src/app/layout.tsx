import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DocumentLang } from "@/components/DocumentLang";
import { ThemeProvider } from "@/components/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased transition-[background-color,color] duration-200 dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <DocumentLang />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
