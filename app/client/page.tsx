"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/LocaleContext";

type MeResponse = {
  ok: boolean;
  user?: {
    nombre?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientHomePage() {
  const { t } = useTranslation();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!API_URL || typeof window === "undefined") return;
      const token = window.localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data: MeResponse = await res.json();
        if (data.ok && data.user?.nombre) setName(data.user.nombre);
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {name ? t("client.home.welcomeWithName", { name }) : t("client.home.welcomeNoName")}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">{t("client.home.subtitle")}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link
          href="/businesses"
          className="rounded-2xl border border-neutral-800 bg-[#060606] px-5 py-4 text-sm text-neutral-100 transition hover:border-neutral-600 hover:bg-[#090909]"
        >
          {t("client.home.explore")}
        </Link>
        <Link
          href="/client/reservations"
          className="rounded-2xl border border-neutral-800 bg-[#060606] px-5 py-4 text-sm text-neutral-100 transition hover:border-neutral-600 hover:bg-[#090909]"
        >
          {t("client.home.reservations")}
        </Link>
        <Link
          href="/client/profile"
          className="rounded-2xl border border-neutral-800 bg-[#060606] px-5 py-4 text-sm text-neutral-100 transition hover:border-neutral-600 hover:bg-[#090909]"
        >
          {t("client.home.profile")}
        </Link>
      </div>
    </section>
  );
}
