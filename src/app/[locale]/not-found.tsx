import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-300">
      <h1 className="text-2xl font-semibold text-white">404</h1>
      <p className="mt-2 text-sm text-slate-500">Page not found.</p>
      <Link href="/pt" className="mt-6 text-emerald-500 hover:underline">
        /pt
      </Link>
    </div>
  );
}
