"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RescheduleSlotPicker, type ReservaServicioLine } from "@/components/RescheduleSlotPicker";
import { useRouter, useSearchParams } from "next/navigation";

type Reserva = {
  id: string;
  negocio_id: string;
  staff_id?: string | null;
  inicio_en: string;
  fin_en: string;
  estado: string;
  precio_total: number;
  anticipo_calculado: number;
  saldo_pendiente: number;
  negocios?: { nombre?: string | null } | null;
  reserva_servicios?: Array<{ servicio_id: string; cantidad: number | null }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const RESCHEDULE_COPY = {
  title: "Choose a new date and time",
  datesLabel: "Available dates",
  slotsLabel: "Time slots",
  confirm: "Confirm new time",
  saving: "Saving...",
  loadingDates: "Loading...",
  loadingSlots: "Loading...",
  noDates: "No dates available for these services.",
  noSlots: "Pick a date to see slots.",
};

function formatReservationStatus(estado: string): string {
  const map: Record<string, string> = {
    pendiente_pago: "Pending payment",
    confirmada: "Confirmed",
    completada: "Completed",
    cancelada: "Cancelled",
    expirada: "Expired",
    no_show: "No-show",
  };
  return map[estado] ?? estado;
}

export default function ClientReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  const handleCheckoutSuccessVerification = useCallback(async () => {
    if (!API_URL || typeof window === "undefined") return;
    const deposit = searchParams.get("deposit");
    const sessionId = searchParams.get("session_id");
    if (deposit !== "success" || !sessionId) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/stripe/deposit-verify-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not verify payment status");
      }
      toast.success("Payment confirmed. Your reservation is now confirmed.");
    } catch (err) {
      toast.warning(
        err instanceof Error
          ? err.message
          : "Payment verification is still pending. Please refresh in a moment."
      );
    } finally {
      router.replace("/client/reservations");
    }
  }, [router, searchParams]);

  const handleCheckoutCanceledCleanup = useCallback(async () => {
    if (!API_URL || typeof window === "undefined") return;
    const deposit = searchParams.get("deposit");
    const reservaId = searchParams.get("reserva_id");
    if (deposit !== "canceled" || !reservaId) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/stripe/deposit-cancel-pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reserva_id: reservaId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not clear canceled pending reservation");
      }
      if (data.cleaned) {
        toast.info("Canceled payment: pending reservation removed.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear canceled pending reservation");
    } finally {
      router.replace("/client/reservations");
    }
  }, [router, searchParams]);

  const fetchReservas = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/api/reservas/cliente/mis-reservas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load your reservations");
    const rows = Array.isArray(data.data) ? data.data : [];
    setReservas(rows.filter((r: Reserva) => r.estado !== "cancelada"));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await handleCheckoutSuccessVerification();
        await handleCheckoutCanceledCleanup();
        await fetchReservas();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchReservas, handleCheckoutCanceledCleanup, handleCheckoutSuccessVerification]);

  const executeCancel = async (id: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setCancelling(id);
    try {
      const res = await fetch(`${API_URL}/api/reservas/cliente/reservas/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel this reservation");
      toast.success("Reservation removed.");
      setCancelDialogId(null);
      await fetchReservas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCancelling(null);
    }
  };

  const handleReschedule = async (reservaId: string, inicio_en: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    setRescheduling(reservaId);
    try {
      const res = await fetch(`${API_URL}/api/reservas/cliente/reservas/${reservaId}/reagendar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inicio_en }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reschedule");
      toast.success("Reservation rescheduled.");
      setRescheduleOpen(null);
      await fetchReservas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRescheduling(null);
    }
  };

  const canReschedule = (estado: string) => ["pendiente_pago", "confirmada"].includes(estado);
  const canCancel = (estado: string) => !["cancelada", "completada", "expirada"].includes(estado);

  const cancelTarget = cancelDialogId ? reservas.find((x) => x.id === cancelDialogId) : null;

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My reservations</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Review your bookings, reschedule when allowed, or cancel if you no longer need them.
        </p>
      </header>

      {cancelTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-950 p-6 shadow-2xl">
            <h2 id="cancel-dialog-title" className="text-lg font-semibold text-neutral-50">
              Cancel this booking?
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              You can <span className="text-neutral-200">reschedule</span> and pick another day or time
              without losing your selected services. If you cancel, this booking will be deleted completely.
            </p>
            <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-300">
              <div className="font-medium text-neutral-100">
                {cancelTarget.negocios?.nombre || "Business"}
              </div>
              <div className="mt-1 text-neutral-400">
                {new Date(cancelTarget.inicio_en).toLocaleString()} →{" "}
                {new Date(cancelTarget.fin_en).toLocaleString()}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {canReschedule(cancelTarget.estado) ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = cancelTarget.id;
                    setCancelDialogId(null);
                    setRescheduleOpen(id);
                    toast.message("Pick a new time", {
                      description: "Choose an available slot and confirm.",
                    });
                  }}
                  className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white"
                >
                  Reschedule instead
                </button>
              ) : null}
              <button
                type="button"
                disabled={cancelling === cancelTarget.id}
                onClick={() => void executeCancel(cancelTarget.id)}
                className="rounded-xl border border-red-800/70 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-950/50 disabled:opacity-50"
              >
                {cancelling === cancelTarget.id ? "Removing…" : "Yes, delete booking"}
              </button>
              <button
                type="button"
                onClick={() => setCancelDialogId(null)}
                className="rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-900"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading reservations…</p>
      ) : reservas.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          You do not have any reservations yet.
        </p>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-neutral-50">
                  {r.negocios?.nombre || "Business"} · {new Date(r.inicio_en).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  End: {new Date(r.fin_en).toLocaleString()} · Status:{" "}
                  {formatReservationStatus(r.estado)}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Total: ${Number(r.precio_total || 0).toFixed(2)} · Deposit: $
                  {Number(r.anticipo_calculado || 0).toFixed(2)} · Remaining: $
                  {Number(r.saldo_pendiente || 0).toFixed(2)}
                </div>
                {rescheduleOpen === r.id && API_URL && r.negocio_id && (r.reserva_servicios?.length ?? 0) > 0 ? (
                  <RescheduleSlotPicker
                    apiUrl={API_URL}
                    negocioId={r.negocio_id}
                    staffId={r.staff_id || null}
                    reservaServicios={
                      (r.reserva_servicios || []).map((x) => ({
                        servicio_id: x.servicio_id,
                        cantidad: Number(x.cantidad ?? 1) || 1,
                      })) as ReservaServicioLine[]
                    }
                    disabled={rescheduling === r.id}
                    submitting={rescheduling === r.id}
                    onConfirm={(startIso) => handleReschedule(r.id, startIso)}
                    copy={RESCHEDULE_COPY}
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  disabled={!canReschedule(r.estado) || cancelling === r.id || rescheduling === r.id}
                  onClick={() => setRescheduleOpen((prev) => (prev === r.id ? null : r.id))}
                  className="flex h-10 min-w-[140px] items-center justify-center rounded-xl bg-neutral-100 px-4 text-xs font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {rescheduleOpen === r.id ? "Close reschedule" : "Reschedule"}
                </button>
                <button
                  type="button"
                  disabled={!canCancel(r.estado) || cancelling === r.id || rescheduling === r.id}
                  onClick={() => setCancelDialogId(r.id)}
                  className="flex h-10 min-w-[140px] items-center justify-center rounded-xl border border-red-800/60 px-4 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:opacity-40"
                >
                  Cancel booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
