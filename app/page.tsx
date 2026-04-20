"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/contexts/LocaleContext";

export default function LandingPage() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      <header className="border-b border-neutral-800/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <span className="text-lg font-semibold tracking-tight">{t("common.brand")}</span>
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm text-neutral-400 transition hover:text-neutral-100"
            >
              {t("landing.nav.signIn")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              {t("landing.nav.signUpFree")}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            {t("landing.hero.line1")}
            <br />
            <span className="text-neutral-400">{t("landing.hero.line2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">{t("landing.hero.subtitle")}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-black transition hover:bg-neutral-200"
            >
              {t("landing.cta.pricing")}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-600 px-6 text-base font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-900/50"
            >
              {t("landing.cta.getStarted")}
            </Link>
          </div>
        </section>

        <section className="border-t border-neutral-800/80 bg-[#060606]">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-2xl font-semibold text-white md:text-3xl">
              {t("landing.features.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">{t("landing.features.subtitle")}</p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">{t("landing.features.scheduling.title")}</h3>
                <p className="mt-2 text-sm text-neutral-400">{t("landing.features.scheduling.desc")}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">{t("landing.features.services.title")}</h3>
                <p className="mt-2 text-sm text-neutral-400">{t("landing.features.services.desc")}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm0 12v-2a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">{t("landing.features.payments.title")}</h3>
                <p className="mt-2 text-sm text-neutral-400">{t("landing.features.payments.desc")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-800/80">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-16 text-center md:px-12">
              <h2 className="text-2xl font-semibold text-white md:text-3xl">{t("landing.bottom.title")}</h2>
              <p className="mx-auto mt-3 max-w-md text-neutral-400">{t("landing.bottom.subtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-black transition hover:bg-neutral-200"
                >
                  {t("landing.bottom.viewPlans")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-600 px-6 text-base font-medium text-neutral-100 transition hover:border-neutral-500"
                >
                  {t("landing.bottom.freeAccount")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link href="/privacy-policy" className="text-neutral-400 transition hover:text-neutral-100">
              {t("landing.footer.privacy")}
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/terms-of-service" className="text-neutral-400 transition hover:text-neutral-100">
              {t("landing.footer.terms")}
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/data-protection" className="text-neutral-400 transition hover:text-neutral-100">
              {t("landing.footer.data")}
            </Link>
          </div>
          <p className="text-sm text-neutral-500">{t("landing.footer.copy", { year })}</p>
        </div>
      </footer>
    </div>
  );
}
