import { notFound } from "next/navigation";

import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { locales, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  return (
    <div className="h-full min-h-0">
      <ReviewWorkspace locale={locale as Locale} />
    </div>
  );
}
