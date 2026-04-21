import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-slate-50 px-[4%] text-center text-slate-600 dark:bg-slate-950 dark:text-slate-300">
      <h1 className="text-[length:clamp(1.25rem,2.5vw,1.5rem)] font-semibold text-slate-900 dark:text-white">
        404
      </h1>
      <p className="mt-[2%] text-[length:clamp(0.8rem,1.2vw,0.95rem)] text-slate-500">Page not found.</p>
      <Link
        href="/pt"
        className="mt-[4%] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        /pt
      </Link>
    </div>
  );
}
