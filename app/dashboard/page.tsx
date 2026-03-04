"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <rect
        x="3.5"
        y="9"
        width="17"
        height="11"
        rx="1.5"
        ry="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 9L6.8 4.8c.2-.6.8-1 1.4-1h7.6c.6 0 1.1.4 1.4 1L19 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 14h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconScissors(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <circle
        cx="6.5"
        cy="7"
        r="2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="6.5"
        cy="17"
        r="2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10 6l8-4M10 18l8 4M9 12l10-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBlock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M7.5 7.5l9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="15"
        rx="1.5"
        ry="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 4v3M16 4v3M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="8"
        y="12.5"
        width="3"
        height="3"
        rx="0.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function IconCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-200"
      {...props}
    >
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="1.7"
        ry="1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 9h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 14.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type DashboardCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

function DashboardCard({ title, description, icon }: DashboardCardProps) {
  return (
    <button className="flex flex-col items-start rounded-2xl border border-neutral-800 bg-[#050505] px-6 py-5 text-left transition hover:border-neutral-600 hover:bg-[#090909]">
      <div className="mb-4 text-neutral-200">{icon}</div>
      <div className="mb-1 text-sm font-medium text-neutral-50">{title}</div>
      <p className="text-xs text-neutral-400">{description}</p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

        if (data.user.nombre) {
          setUserName(data.user.nombre);
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        setCheckingAuth(false);
      }
    };

    void verifyAdmin();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 flex-col border-r border-neutral-900 bg-[#050505] px-6 py-5 md:flex">
          <div className="mb-8">
            <div className="text-sm font-semibold tracking-tight">
              BookAndPay
            </div>
            <div className="text-[11px] text-neutral-500">Panel admin</div>
          </div>

          <nav className="flex-1 space-y-1 text-sm">
            <button className="flex w-full items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-neutral-50">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800/80">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 text-neutral-200"
                >
                  <rect
                    x="4"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="4"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              <span>Dashboard</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconStore />
              <span>Mi negocio</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconScissors />
              <span>Servicios</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconClock />
              <span>Horarios</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconBlock />
              <span>Bloqueos</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconCalendar />
              <span>Agenda</span>
            </button>

            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100">
              <IconCard />
              <span>Pagos</span>
            </button>
          </nav>

          <div className="mt-4 text-[11px] text-neutral-600">N</div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-neutral-900 px-5 py-4 md:px-8">
            <div className="text-xs text-neutral-400">
              {userName ? `${userName} - ` : "Chong - "}{" "}
              <span className="font-medium text-neutral-100">admin</span>
            </div>
            <button className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-black hover:bg-neutral-200">
              Logout
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
            <section className="mb-7 md:mb-8">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Dashboard
              </h1>
              <p className="mt-1 text-xs text-neutral-400 md:text-sm">
                Bienvenido, Chong. Gestiona tu negocio desde el menú o las tarjetas.
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <DashboardCard
                title="Mi negocio"
                description="Configuración del negocio"
                icon={<IconStore className="h-6 w-6 text-neutral-100" />}
              />
              <DashboardCard
                title="Servicios"
                description="Catálogo y anticipos"
                icon={<IconScissors className="h-6 w-6 text-neutral-100" />}
              />
              <DashboardCard
                title="Horarios"
                description="Horario por día"
                icon={<IconClock className="h-6 w-6 text-neutral-100" />}
              />
              <DashboardCard
                title="Bloqueos"
                description="Fechas no disponibles"
                icon={<IconBlock className="h-6 w-6 text-neutral-100" />}
              />
              <DashboardCard
                title="Agenda"
                description="Reservas y estados"
                icon={<IconCalendar className="h-6 w-6 text-neutral-100" />}
              />
              <DashboardCard
                title="Pagos"
                description="Anticipos y pagos"
                icon={<IconCard className="h-6 w-6 text-neutral-100" />}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

