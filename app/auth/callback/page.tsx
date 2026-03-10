"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type MeResponse = {
  ok: boolean;
  user?: {
    rol?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase ya procesa el código de OAuth automáticamente al inicializar el cliente.
      // Aquí solo obtenemos la sesión resultante y guardamos los tokens para el backend.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && typeof window !== "undefined") {
        localStorage.setItem("access_token", session.access_token);
        if (session.refresh_token) {
          localStorage.setItem("refresh_token", session.refresh_token);
        }
      }

      if (!API_URL || !session?.access_token) {
        router.replace("/dashboard");
        return;
      }

      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!meRes.ok) {
          router.replace("/dashboard");
          return;
        }

        const meData: MeResponse = await meRes.json();

        if (meData.ok && meData.user?.rol === "cliente") {
          router.replace("/bienvenida");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/dashboard");
      }
    };

    void handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
      <p className="text-sm text-neutral-400">
        Processing Google sign in...
      </p>
    </div>
  );
}

