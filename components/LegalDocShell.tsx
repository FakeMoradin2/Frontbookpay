import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocShellProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export default function LegalDocShell({ title, effectiveDate, children }: LegalDocShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <Link href="/" className="text-sm text-neutral-400 transition hover:text-neutral-200">
          ← Back to home
        </Link>
        <article className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-neutral-500">Effective date: {effectiveDate}</p>
          <div className="legal-doc-content mt-10 text-sm leading-relaxed text-neutral-300">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
