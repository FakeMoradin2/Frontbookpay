 "use client";

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

export default function BienvenidaClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    const verifyClient = async () => {
      if (!API_URL || typeof window === "undefined") {
        setLoading(false);
        return;
      }

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

        if (!data.ok || data.user?.rol !== "cliente") {
          router.replace("/");
          return;
        }

        if (data.user.nombre) {
          setNombre(data.user.nombre);
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        setLoading(false);
      }
    };

    void verifyClient();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando tu espacio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#060606] px-8 py-10 shadow-xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          ¡Bienvenido{nombre ? `, ${nombre}` : ""}!
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Ya puedes comenzar a reservar tus servicios desde la app. Este es tu
          espacio como cliente.
        </p>
      </div>
    </div>
  );
}

