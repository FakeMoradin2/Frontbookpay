"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/contexts/LocaleContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function NavItem({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/client" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-neutral-100 text-black"
          : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
      }`}
    >
      {label}
    </Link>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function ClientNav() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
    }
    router.replace("/");
  };

  return (
    <header className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0 truncate text-sm font-semibold tracking-tight text-neutral-50 hover:underline">
          {t("common.brand")}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher variant="minimal" />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-neutral-700 px-3 py-1 text-[11px] bg-neutral-100 text-black hover:bg-gray-400"
          >
            {t("common.logout")}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-200 hover:bg-neutral-800 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("aria.closeNav") : t("aria.openNav")}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
      <nav
        className={`mt-3 flex-col gap-2 sm:flex-row sm:flex-wrap ${menuOpen ? "flex" : "hidden"} md:flex`}
      >
        <NavItem href="/client" label={t("client.nav.home")} onNavigate={() => setMenuOpen(false)} />
        <NavItem href="/businesses" label={t("client.nav.businesses")} onNavigate={() => setMenuOpen(false)} />
        <NavItem href="/client/reservations" label={t("client.nav.reservations")} onNavigate={() => setMenuOpen(false)} />
        <NavItem href="/client/profile" label={t("client.nav.profile")} onNavigate={() => setMenuOpen(false)} />
      </nav>
    </header>
  );
}
