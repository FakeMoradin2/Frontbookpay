"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/contexts/LocaleContext";

type CheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STRIPE_TEST_MODE = process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true";

export default function PricingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();

    if (!API_URL) {
      toast.error(t("errors.apiUrlMissing"));
      return;
    }

    if (!nombre.trim() || !email.trim()) {
      toast.error(t("errors.nameEmailRequired"));
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data: CheckoutResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || t("errors.unknownGeneric"));
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-neutral-100">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <header className="border-b border-neutral-800/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:underline">
            {t("common.brand")}
          </Link>
          <div className="flex items-center gap-4">
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

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold text-white md:text-4xl">{t("pricing.title")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">{t("pricing.subtitle")}</p>

        {STRIPE_TEST_MODE ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95">
            <p className="font-medium text-amber-50">{t("pricing.stripeTestTitle")}</p>
            <p className="mt-1 text-xs text-amber-100/80">{t("pricing.stripeTestBody")}</p>
          </div>
        ) : null}

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          <div className="rounded-2xl border border-neutral-800 bg-[#060606] p-8">
            <h2 className="text-xl font-semibold text-white">{t("pricing.client.title")}</h2>
            <p className="mt-1 text-sm text-neutral-400">{t("pricing.client.desc")}</p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-white">{t("common.free")}</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.client.f1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.client.f2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.client.f3")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.client.f4")}
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-lg border border-neutral-600 text-sm font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-900/50"
            >
              {t("pricing.client.cta")}
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-white/20 bg-[#080808] p-8 ring-1 ring-white/10">
            <div className="inline-block rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-medium text-emerald-400">
              {t("pricing.admin.badge")}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{t("pricing.admin.title")}</h2>
            <p className="mt-1 text-sm text-neutral-400">{t("pricing.admin.desc")}</p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-white">{t("pricing.admin.price")}</span>
              <span className="ml-1 text-neutral-500">$99.00MXN</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f3")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f4")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f5")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {t("pricing.admin.f6")}
              </li>
            </ul>

            <form onSubmit={handleCheckout} className="mt-8 space-y-4">
              <input
                type="text"
                placeholder={t("pricing.admin.namePlaceholder")}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                required
              />
              <input
                type="email"
                placeholder={t("pricing.admin.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? t("common.processing") : t("pricing.admin.payCta")}
              </button>
              <p className="text-center text-xs text-neutral-500">{t("pricing.admin.footer")}</p>
            </form>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-neutral-500">
          <Link href="/" className="hover:underline">
            {t("common.backHome")}
          </Link>
        </p>
      </main>
    </div>
  );
}
