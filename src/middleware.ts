import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales, type Locale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first) {
    const normalized = first.replace(/_/g, "-").toLowerCase();
    if (normalized === "pt-br") {
      const url = request.nextUrl.clone();
      const tail = segments.slice(1).join("/");
      url.pathname = "/pt" + (tail ? `/${tail}` : "");
      return NextResponse.redirect(url);
    }
  }

  const segment = segments[0];
  const hasLocale = segment && locales.includes(segment as Locale);

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("x-locale", segment);
  return res;
}

export const config = {
  matcher: [
    /*
     * Do not run locale middleware on Next.js internals, APIs, Vercel, or file-like paths.
     * Matching `/_next/...` here would still be safe (early return), but skipping avoids extra work.
     */
    "/((?!api|_next|_vercel|__nextjs|.*\\..*).*)",
  ],
};
