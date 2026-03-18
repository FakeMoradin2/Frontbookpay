"use client";

import { useCallback, useEffect, useState } from "react";

type Reserva = {
  id: string;
  inicio_en: string;
  fin_en: string;
  estado: string;
  precio_total: number;
  anticipo_calculado: number;
  saldo_pendiente: number;
  negocios?: { nombre?: string | null } | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  const fetchReservas = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/api/reservas/cliente/mis-reservas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load your reservations");
    setReservas(Array.isArray(data.data) ? data.data : []);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchReservas();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchReservas]);

  const handleCancel = async (id: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    setCancelling(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/reservas/cliente/reservas/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel reservation");
      setSuccess("Reservation cancelled.");
      await fetchReservas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My reservations</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Review your bookings and cancel allowed reservations.
        </p>
      </header>

        {error ? (
          <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-md border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-neutral-400">Loading reservations...</p>
        ) : reservas.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
            You do not have reservations yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reservas.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium text-neutral-50">
                    {r.negocios?.nombre || "Business"} · {new Date(r.inicio_en).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    End: {new Date(r.fin_en).toLocaleString()} · Status: {r.estado}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Total: ${Number(r.precio_total || 0).toFixed(2)} · Deposit: $
                    {Number(r.anticipo_calculado || 0).toFixed(2)} · Remaining: $
                    {Number(r.saldo_pendiente || 0).toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={
                    cancelling === r.id ||
                    ["cancelada", "completada", "expirada"].includes(r.estado)
                  }
                  onClick={() => handleCancel(r.id)}
                  className="flex h-9 items-center justify-center rounded-lg border border-red-800/60 px-3 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                >
                  {cancelling === r.id ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        )}
    </section>
  );
}

