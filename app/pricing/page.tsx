"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type CheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STRIPE_TEST_MODE = process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL is not configured");
      return;
    }

    if (!nombre.trim() || !email.trim()) {
      setError("Name and email are required.");
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
        throw new Error(data.error || "Could not create payment session.");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      <header className="border-b border-neutral-800/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:underline">
            Book&Pay
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-neutral-400 transition hover:text-neutral-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              Sign up free
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold text-white md:text-4xl">
          Plans and pricing
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">
          Choose the option that best fits you. Free customer account, or admin panel with a one-time payment.
        </p>

        {STRIPE_TEST_MODE ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95">
            <p className="font-medium text-amber-50">Stripe test mode</p>
            <p className="mt-1 text-xs text-amber-100/80">
              Payments are simulated — no real charges. In Checkout use card{" "}
              <span className="font-mono text-amber-50">4242 4242 4242 4242</span>, any future expiry, any CVC.
              Set <span className="font-mono">NEXT_PUBLIC_STRIPE_TEST_MODE=true</span> in{" "}
              <span className="font-mono">frontend/.env</span> while your backend uses{" "}
              <span className="font-mono">sk_test_...</span> keys.
            </p>
          </div>
        ) : null}

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {/* Client Plan - Free */}
          <div className="rounded-2xl border border-neutral-800 bg-[#060606] p-8">
            <h2 className="text-xl font-semibold text-white">Client</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Book appointments at businesses, manage your reservations.
            </p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-white">Free</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Book appointments
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> View and cancel reservations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Search businesses and services
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> No cost
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-lg border border-neutral-600 text-sm font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-900/50"
            >
              Get started free
            </Link>
          </div>

          {/* Admin Plan - Paid */}
          <div className="rounded-2xl border-2 border-white/20 bg-[#080808] p-8 ring-1 ring-white/10">
            <div className="inline-block rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-medium text-emerald-400">
              Recommended
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">Administrator</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Full panel to manage your business, services, schedule, and payments.
            </p>
            <div className="mt-6">
              <span className="text-3xl font-bold text-white">One-time payment</span>
              <span className="ml-1 text-neutral-500">$99.00MXN</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Everything in Client plan
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Admin panel
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Manage services and schedules
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Agenda and block dates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Integrated payment gateway
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Your own business created
              </li>
            </ul>

            <form onSubmit={handleCheckout} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              <input
                type="text"
                placeholder="Your name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                required
              />
              <input
                type="email"
                placeholder="you@email.com"
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
                {loading ? "Processing..." : "Pay with Stripe →"}
              </button>
              <p className="text-center text-xs text-neutral-500">
                Secure payment with Stripe. You&apos;ll receive your admin account after payment.
              </p>
            </form>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-neutral-500">
          <Link href="/" className="hover:underline">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
