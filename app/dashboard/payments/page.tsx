"use client";

import { useEffect, useState } from "react";

type Pago = {
  id: string;
  tipo: string;
  monto: number;
  moneda: string;
  metodo: string;
  estado: string;
  referencia: string | null;
  creado_en: string;
  reserva_id: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const fetchPagos = async () => {
    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;
    const res = await fetch(`${API_URL}/api/pagos/admin/pagos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load payments");
    setPagos(Array.isArray(data.data) ? data.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchPagos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Payments</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Review payment records and statuses for your business bookings.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading payments...</p>
      ) : pagos.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          No payments found yet.
        </p>
      ) : (
        <div className="space-y-3">
          {pagos.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-neutral-50">
                    {p.tipo} · {p.metodo}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Amount: {p.moneda.toUpperCase()} {Number(p.monto || 0).toFixed(2)} · Status: {p.estado}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Reservation: {p.reserva_id} · Created: {new Date(p.creado_en).toLocaleString()}
                    {p.referencia ? ` · Ref: ${p.referencia}` : ""}
                  </div>
                </div>
                <span className="rounded-full border border-neutral-700 px-2 py-1 text-[11px] text-neutral-300">
                  {p.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

