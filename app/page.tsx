"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      {/* Hero */}
      <header className="border-b border-neutral-800/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold tracking-tight">Book&Pay</span>
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

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Book and pay
            <br />
            <span className="text-neutral-400">in one place</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">
            Book&Pay is the platform that connects businesses with their customers.
            Book appointments, manage services, and accept payments with ease.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-black transition hover:bg-neutral-200"
            >
              View plans and pricing
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-600 px-6 text-base font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-900/50"
            >
              Get started free
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-neutral-800/80 bg-[#060606]">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-2xl font-semibold text-white md:text-3xl">
              Everything you need for your business
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">
              Tools designed to simplify booking and payment management.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Smart scheduling</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Manage schedules, block dates, and availability in real time.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Services and pricing</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Define your services, duration, and prices with flexibility.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-[#080808] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm0 12v-2a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Payment gateway</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Accept payments securely with integrated Stripe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-800/80">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-16 text-center md:px-12">
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-neutral-400">
                Join as a free customer or unlock your admin panel with a one-time payment.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-black transition hover:bg-neutral-200"
                >
                  View plans
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-600 px-6 text-base font-medium text-neutral-100 transition hover:border-neutral-500"
                >
                  Free account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800/80 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} Book&Pay. Book and pay in one place.
        </div>
      </footer>
    </div>
  );
}
