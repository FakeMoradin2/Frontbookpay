"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type MeResponse = {
  ok: boolean;
  user?: {
    rol?: string;
    nombre?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 9L6.8 4.8c.2-.6.8-1 1.4-1h7.6c.6 0 1.1.4 1.4 1L19 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 14h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconScissors(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="6.5" cy="7" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6.5" cy="17" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6l8-4M10 18l8 4M9 12l10-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconBlock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 7.5l9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v3M16 4v3M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="12.5" width="3" height="3" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="1.7" ry="1.7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9h16" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 14.5h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-neutral-200" {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function NavLink({ href, children, icon }: { href: string; children: ReactNode; icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
        isActive ? "bg-neutral-900 text-neutral-50" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("access_token");
      try {
        if (API_URL && token) {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        /* ignore */
      } finally {
        window.localStorage.removeItem("access_token");
        window.localStorage.removeItem("refresh_token");
      }
    }
    router.replace("/");
  };

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!API_URL) {
        router.replace("/");
        return;
      }
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem("access_token");
      if (!token) {
        router.replace("/");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.replace("/");
          return;
        }
        const data: MeResponse = await res.json();
        if (!data.ok || !data.user || data.user.rol !== "admin") {
          router.replace("/");
          return;
        }
        if (data.user.nombre) setUserName(data.user.nombre);
      } catch {
        router.replace("/");
      } finally {
        setCheckingAuth(false);
      }
    };
    void verifyAdmin();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 flex-col border-r border-neutral-900 bg-[#050505] px-6 py-5 md:flex">
          <div className="mb-8">
            <div className="text-sm font-semibold tracking-tight">BookAndPay</div>
            <div className="text-[11px] text-neutral-500">Admin panel</div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavLink href="/dashboard" icon={<IconGrid />}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/business" icon={<IconStore />}>
              My business
            </NavLink>
            <NavLink href="/dashboard/services" icon={<IconScissors />}>
              Services
            </NavLink>
            <NavLink href="/dashboard/schedules" icon={<IconClock />}>
              Schedules
            </NavLink>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed" disabled>
              <IconBlock />
              <span>Blocked dates</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed" disabled>
              <IconCalendar />
              <span>Agenda</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed" disabled>
              <IconCard />
              <span>Payments</span>
            </button>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-neutral-900 px-5 py-4 md:px-8">
            <div className="text-xs text-neutral-400">
              {userName ? `${userName} - ` : ""}
              <span className="font-medium text-neutral-100">admin</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-black hover:bg-neutral-200"
            >
              Logout
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
