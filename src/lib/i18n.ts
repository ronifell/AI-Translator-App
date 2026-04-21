export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

export type Messages = typeof import("../messages/pt.json");

export async function getMessages(locale: string): Promise<Messages> {
  const safe = locales.includes(locale as Locale) ? locale : defaultLocale;
  return (await import(`../messages/${safe}.json`)).default;
}
