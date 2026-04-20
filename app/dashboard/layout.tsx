"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ensureSupabaseSession } from "@/lib/supabase-session";

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

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.8 18c.5-2.9 2.8-4.7 5.2-4.7s4.7 1.8 5.2 4.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.8 18c.3-2 1.6-3.4 3.4-3.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function NavLink({
  href,
  children,
  icon,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
        isActive ? "bg-neutral-900 text-neutral-50" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function SidebarNavContent({
  userRole,
  onNavigate,
}: {
  userRole: "admin" | "staff" | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-8">
        <div className="text-sm font-semibold tracking-tight">BookAndPay</div>
        <div className="text-[11px] text-neutral-500">Admin panel</div>
      </div>

      <nav className="flex flex-1 flex-col space-y-1">
        <NavLink href="/dashboard" onNavigate={onNavigate} icon={<IconGrid />}>
          Dashboard
        </NavLink>
        <NavLink href="/dashboard/services" onNavigate={onNavigate} icon={<IconScissors />}>
          Services
        </NavLink>
        <NavLink href="/dashboard/schedules" onNavigate={onNavigate} icon={<IconClock />}>
          Schedules
        </NavLink>
        {userRole === "admin" ? (
          <NavLink href="/dashboard/business" onNavigate={onNavigate} icon={<IconStore />}>
            My business
          </NavLink>
        ) : null}
        {userRole === "admin" ? (
          <NavLink href="/dashboard/blocked" onNavigate={onNavigate} icon={<IconBlock />}>
            Blocked dates
          </NavLink>
        ) : null}
        {userRole === "admin" ? (
          <NavLink href="/dashboard/staff" onNavigate={onNavigate} icon={<IconUsers />}>
            Staff
          </NavLink>
        ) : null}
        <NavLink href="/dashboard/agenda" onNavigate={onNavigate} icon={<IconCalendar />}>
          Agenda
        </NavLink>
        <NavLink href="/dashboard/payments" onNavigate={onNavigate} icon={<IconCard />}>
          Payments
        </NavLink>
      </nav>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      }
      try {
        await supabase.auth.signOut();
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
    const verifyPanelUser = async () => {
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
        if (!data.ok || !data.user || !["admin", "staff"].includes(data.user.rol || "")) {
          router.replace("/");
          return;
        }
        setUserRole(data.user.rol as "admin" | "staff");
        if (data.user.nombre) setUserName(data.user.nombre);
        void ensureSupabaseSession();
      } catch {
        router.replace("/");
      } finally {
        setCheckingAuth(false);
      }
    };
    void verifyPanelUser();
  }, [router]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading panel...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] min-h-0 overflow-hidden bg-[#050505] text-neutral-100">
      <div className="flex h-full min-h-0 w-full">
        <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-neutral-900 bg-[#050505] px-6 py-5 md:flex">
          <SidebarNavContent userRole={userRole} />
        </aside>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="fixed left-0 top-0 z-50 flex h-full w-[min(18rem,88vw)] flex-col overflow-y-auto border-r border-neutral-900 bg-[#050505] px-5 py-5 shadow-2xl md:hidden">
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-200 hover:bg-neutral-900"
                  aria-label="Cerrar menú"
                >
                  <IconClose />
                </button>
              </div>
              <SidebarNavContent userRole={userRole} onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-900 px-4 py-3 md:px-8 md:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 text-neutral-200 hover:bg-neutral-900 md:hidden"
                aria-label="Abrir menú de navegación"
              >
                <IconMenu />
              </button>
              <div className="min-w-0 truncate text-xs text-neutral-400">
                {userName ? `${userName} - ` : ""}
                <span className="font-medium text-neutral-100">{userRole ?? "panel"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-black hover:bg-neutral-200 sm:px-4"
            >
              Logout
            </button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5 sm:py-6 md:px-10 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
