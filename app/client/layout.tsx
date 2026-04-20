"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useTranslation } from "@/contexts/LocaleContext";

type MeResponse = {
  ok: boolean;
  user?: {
    rol?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyClient = async () => {
      if (!API_URL || typeof window === "undefined") {
        router.replace("/");
        return;
      }
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
        if (!data.ok || data.user?.rol !== "cliente") {
          router.replace("/");
          return;
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        setChecking(false);
      }
    };
    void verifyClient();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">{t("client.layout.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <ClientNav />
        {children}
      </div>
    </div>
  );
}

