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
      try {
        // Supabase procesa el código/hash de OAuth cuando se llama a getSession
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // Si algo falla al obtener la sesión, volvemos a la pantalla inicial.
          console.error("Error getting Supabase session in /auth/callback:", error);
          router.replace("/");
          return;
        }

        if (!session) {
          // No se pudo crear sesión (por ejemplo, usuario canceló, o redirect mal configurado)
          router.replace("/");
          return;
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", session.access_token);
          if (session.refresh_token) {
            localStorage.setItem("refresh_token", session.refresh_token);
          }
        }

        if (!API_URL || !session.access_token) {
          router.replace("/dashboard");
          return;
        }

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
          router.replace("/client");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Unexpected error in /auth/callback:", err);
        router.replace("/");
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

