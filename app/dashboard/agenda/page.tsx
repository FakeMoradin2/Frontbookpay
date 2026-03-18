"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Reserva = {
  id: string;
  inicio_en: string;
  fin_en: string;
  estado: "pendiente_pago" | "confirmada" | "cancelada" | "completada" | "no_show" | "expirada";
  precio_total: number;
  anticipo_calculado: number;
  saldo_pendiente: number;
  nota: string | null;
  cliente_manual_nombre?: string | null;
  cliente_manual_correo?: string | null;
  cliente_manual_telefono?: string | null;
  usuarios?: { nombre?: string | null } | null;
  reserva_servicios?: Array<{ id: string; servicio_id: string; cantidad: number; precio: number }>;
};

type Servicio = {
  id: string;
  nombre: string;
  duracion_min: number;
  buffer_min: number | null;
  precio: number;
};

type FechaDisponible = {
  date: string;
  weekday: string;
  slots_count: number;
};

type SlotDisponible = {
  label: string;
  start_iso: string;
  end_iso: string;
  block_key: string;
  block_start: string;
  block_end: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ESTADOS = ["pendiente_pago", "confirmada", "cancelada", "completada", "no_show", "expirada"] as const;

const STATUS_LABELS: Record<(typeof ESTADOS)[number], string> = {
  pendiente_pago: "Pending payment",
  confirmada: "Confirmed",
  cancelada: "Cancelled",
  completada: "Completed",
  no_show: "No show",
  expirada: "Expired",
};

function toLocalDateTimeInput(date: Date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatWeekday(dateIso: string) {
  const label = new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(
    new Date(`${dateIso}T00:00:00`)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const TODAY_START_DEFAULT = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toLocalDateTimeInput(d);
})();

const TODAY_END_DEFAULT = (() => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return toLocalDateTimeInput(d);
})();

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [negocioId, setNegocioId] = useState<string>("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [from, setFrom] = useState(TODAY_START_DEFAULT);
  const [to, setTo] = useState(TODAY_END_DEFAULT);
  const [status, setStatus] = useState("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualClientEmail, setManualClientEmail] = useState("");
  const [manualClientPhone, setManualClientPhone] = useState("");
  const [manualEstado, setManualEstado] = useState("");
  const [manualNota, setManualNota] = useState("");
  const [manualServicios, setManualServicios] = useState<Record<string, number>>({});
  const [availableDates, setAvailableDates] = useState<FechaDisponible[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotDisponible[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStart, setSelectedSlotStart] = useState("");

  const token = useMemo(
    () => (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null),
    []
  );

  const fetchReservas = useCallback(
    async (filters?: { from?: string; to?: string; status?: string }) => {
      if (!API_URL || !token) return;
      const params = new URLSearchParams();
      if (filters?.from) params.set("from", new Date(filters.from).toISOString());
      if (filters?.to) params.set("to", new Date(filters.to).toISOString());
      if (filters?.status) params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`${API_URL}/api/reservas/admin/reservas${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load reservations");
      setReservas(Array.isArray(data.data) ? data.data : []);
      setLastUpdatedAt(new Date());
    },
    [token]
  );

  const fetchMe = useCallback(async () => {
    if (!API_URL || !token) return;
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok || !data?.user?.negocio_id) {
      throw new Error(data.error || "Could not load business context");
    }
    setNegocioId(data.user.negocio_id);
  }, [token]);

  const fetchServicios = useCallback(async () => {
    if (!API_URL || !token) return;
    const res = await fetch(`${API_URL}/api/servicios/admin/servicios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load services");
    setServicios(Array.isArray(data.data) ? data.data : []);
  }, [token]);

  const selectedServiceIds = useMemo(
    () =>
      Object.entries(manualServicios)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([id]) => id),
    [manualServicios]
  );

  const groupedSlotsByBlock = useMemo(() => {
    const groups: Record<
      string,
      {
        block_key: string;
        block_start: string;
        block_end: string;
        slots: SlotDisponible[];
      }
    > = {};

    for (const slot of availableSlots) {
      if (!groups[slot.block_key]) {
        groups[slot.block_key] = {
          block_key: slot.block_key,
          block_start: slot.block_start,
          block_end: slot.block_end,
          slots: [],
        };
      }
      groups[slot.block_key].slots.push(slot);
    }

    return Object.values(groups).sort((a, b) => (a.block_start < b.block_start ? -1 : 1));
  }, [availableSlots]);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          fetchMe(),
          fetchReservas({ from: TODAY_START_DEFAULT, to: TODAY_END_DEFAULT, status: "" }),
          fetchServicios(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchMe, fetchReservas, fetchServicios]);

  useEffect(() => {
    if (!token) return;

    const runRefresh = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        setAutoRefreshing(true);
        await fetchReservas({ from, to, status });
      } catch {
        // Silent in background refresh to avoid noisy UI.
      } finally {
        setAutoRefreshing(false);
      }
    };

    const id = window.setInterval(() => {
      void runRefresh();
    }, 15000);

    const onFocus = () => {
      void runRefresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchReservas, from, status, to, token]);

  const handleApplyFilters = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await fetchReservas({ from, to, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, nextStatus: string) => {
    if (!API_URL || !token) return;
    setUpdatingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/reservas/admin/reservas/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update reservation status");
      await fetchReservas({ from, to, status });
      setSuccess("Reservation status updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUpdatingId(null);
    }
  };

  const resetManualForm = () => {
    setManualClientName("");
    setManualClientEmail("");
    setManualClientPhone("");
    setManualEstado("");
    setManualNota("");
    setManualServicios({});
    setAvailableDates([]);
    setSelectedDate("");
    setAvailableSlots([]);
    setSelectedSlotStart("");
  };

  const toggleManualServicio = (servicioId: string) => {
    setManualServicios((prev) => {
      if (prev[servicioId]) {
        const next = { ...prev };
        delete next[servicioId];
        return next;
      }
      return { ...prev, [servicioId]: 1 };
    });
  };

  const updateManualCantidad = (servicioId: string, qty: number) => {
    setManualServicios((prev) => ({ ...prev, [servicioId]: qty < 1 ? 1 : qty }));
  };

  useEffect(() => {
    if (!manualOpen || !negocioId) return;
    if (selectedServiceIds.length === 0) {
      setAvailableDates([]);
      setSelectedDate("");
      setAvailableSlots([]);
      setSelectedSlotStart("");
      return;
    }

    const loadDates = async () => {
      if (!API_URL) return;
      setLoadingDates(true);
      try {
        const params = new URLSearchParams();
        params.set("negocio_id", negocioId);
        params.set("servicio_ids", selectedServiceIds.join(","));
        params.set("days", "45");
        const res = await fetch(`${API_URL}/api/reservas/public/fechas-disponibles?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.data?.dates)) {
          throw new Error(data.error || "Could not load available dates");
        }
        const dates: FechaDisponible[] = data.data.dates;
        setAvailableDates(dates);

        const today = new Date().toISOString().slice(0, 10);
        const hasCurrent = dates.some((d) => d.date === selectedDate);
        if (!hasCurrent) {
          const defaultDate = dates.find((d) => d.date === today)?.date || dates[0]?.date || "";
          setSelectedDate(defaultDate);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingDates(false);
      }
    };

    void loadDates();
  }, [manualOpen, negocioId, selectedServiceIds, selectedDate]);

  useEffect(() => {
    if (!manualOpen || !negocioId || !selectedDate || selectedServiceIds.length === 0) {
      setAvailableSlots([]);
      setSelectedSlotStart("");
      return;
    }

    const loadSlots = async () => {
      if (!API_URL) return;
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams();
        params.set("negocio_id", negocioId);
        params.set("fecha", selectedDate);
        params.set("servicio_ids", selectedServiceIds.join(","));
        const res = await fetch(`${API_URL}/api/reservas/public/disponibilidad?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.data?.slots)) {
          throw new Error(data.error || "Could not load available slots");
        }
        const slots: SlotDisponible[] = data.data.slots;
        setAvailableSlots(slots);
        setSelectedSlotStart((prev) =>
          prev && slots.some((s) => s.start_iso === prev) ? prev : slots[0]?.start_iso || ""
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingSlots(false);
      }
    };

    void loadSlots();
  }, [manualOpen, negocioId, selectedDate, selectedServiceIds]);

  const handleCreateManualReservation = async () => {
    if (!API_URL || !token) return;
    setError(null);
    setSuccess(null);

    const selected = Object.entries(manualServicios)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([servicio_id, cantidad]) => ({ servicio_id, cantidad: Number(cantidad) }));

    if (!manualClientName.trim()) {
      setError("Client name is required for manual reservation");
      return;
    }
    if (!selectedSlotStart) {
      setError("Select an available date and time");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one service");
      return;
    }

    setCreatingManual(true);
    try {
      const payload: Record<string, unknown> = {
        cliente_nombre: manualClientName.trim(),
        cliente_correo: manualClientEmail.trim().toLowerCase() || null,
        cliente_telefono: manualClientPhone.trim() || null,
        inicio_en: selectedSlotStart,
        servicios: selected,
        nota: manualNota.trim() || null,
      };
      if (manualEstado) payload.estado = manualEstado;

      const res = await fetch(`${API_URL}/api/reservas/admin/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create manual reservation");

      setSuccess("Manual reservation created successfully");
      resetManualForm();
      await fetchReservas({ from, to, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreatingManual(false);
    }
  };

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Agenda</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Review business reservations, filter by date or status, and update each booking state.
        </p>
        <p className="mt-2 text-[11px] text-neutral-500">
          {autoRefreshing ? "Syncing..." : "Auto-refresh every 15 seconds"}
          {lastUpdatedAt ? ` · Last update ${lastUpdatedAt.toLocaleTimeString()}` : ""}
        </p>
      </section>

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

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Create manual reservation</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Use this when a client books by phone or outside the client portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManualOpen((prev) => !prev)}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
          >
            {manualOpen ? "Hide form" : "Show form"}
          </button>
        </div>
        {manualOpen ? (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={manualClientName}
                onChange={(e) => setManualClientName(e.target.value)}
                placeholder="Client name *"
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <input
                type="tel"
                value={manualClientPhone}
                onChange={(e) => setManualClientPhone(e.target.value)}
                placeholder="Client phone (optional)"
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <input
                type="email"
                value={manualClientEmail}
                onChange={(e) => setManualClientEmail(e.target.value)}
                placeholder="Client email (optional)"
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <select
                value={manualEstado}
                onChange={(e) => setManualEstado(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              >
                <option value="">Auto status (recommended)</option>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={manualNota}
                onChange={(e) => setManualNota(e.target.value)}
                placeholder="Optional note"
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 md:col-span-2"
              />
            </div>

            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
              <p className="mb-2 text-xs font-medium text-neutral-300">Services</p>
              {servicios.length === 0 ? (
                <p className="text-xs text-neutral-500">No active services found.</p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {servicios.map((s) => {
                    const checked = manualServicios[s.id] != null;
                    return (
                      <label
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-black/30 px-3 py-2 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleManualServicio(s.id)}
                            className="h-3.5 w-3.5 accent-neutral-200"
                          />
                          <span className="truncate text-neutral-200">
                            {s.nombre} · {s.duracion_min} min + {s.buffer_min ?? 0} min · $
                            {Number(s.precio || 0).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={manualServicios[s.id] ?? 1}
                          disabled={!checked}
                          onChange={(e) => updateManualCantidad(s.id, Number(e.target.value))}
                          className="w-16 rounded-md border border-neutral-700 bg-neutral-900/80 px-2 py-1 text-right text-xs outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <p className="mb-2 text-xs font-medium text-neutral-300">Available dates</p>
                {loadingDates ? (
                  <p className="text-xs text-neutral-500">Loading available dates...</p>
                ) : availableDates.length === 0 ? (
                  <p className="text-xs text-neutral-500">Select services to load available dates.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                      {availableDates.map((d) => {
                        const active = selectedDate === d.date;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => setSelectedDate(d.date)}
                            className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                              active
                                ? "border-neutral-200 bg-neutral-100 text-black"
                                : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                            }`}
                          >
                            <div className="font-medium">{new Date(`${d.date}T00:00:00`).toLocaleDateString()}</div>
                            <div className={`mt-0.5 text-[11px] ${active ? "text-neutral-700" : "text-neutral-500"}`}>
                              {formatWeekday(d.date)}
                            </div>
                            <div className={`mt-0.5 text-[11px] ${active ? "text-neutral-700" : "text-neutral-500"}`}>
                              {d.slots_count} slots
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <p className="mb-2 text-xs font-medium text-neutral-300">Available time slots</p>
                {loadingSlots ? (
                  <p className="text-xs text-neutral-500">Loading available slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-neutral-500">Select date and services to view slots.</p>
                ) : (
                  <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                    {groupedSlotsByBlock.map((group) => (
                      <div key={group.block_key} className="rounded-lg border border-neutral-800 bg-black/30 p-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Block {group.block_start} - {group.block_end}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {group.slots.map((slot) => {
                            const active = selectedSlotStart === slot.start_iso;
                            return (
                              <button
                                key={slot.start_iso}
                                type="button"
                                onClick={() => setSelectedSlotStart(slot.start_iso)}
                                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                                  active
                                    ? "border-neutral-200 bg-neutral-100 text-black"
                                    : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                                }`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCreateManualReservation}
                disabled={creatingManual || !selectedSlotStart}
                className="rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creatingManual ? "Creating..." : "Create manual reservation"}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          >
            <option value="">All statuses</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Apply filters
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading reservations...</p>
      ) : reservas.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          No reservations found for current filters.
        </p>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-neutral-50">
                    {new Date(r.inicio_en).toLocaleString()} - {new Date(r.fin_en).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Client: {r.usuarios?.nombre || r.cliente_manual_nombre || "Guest client"} · Total: $
                    {Number(r.precio_total || 0).toFixed(2)} ·
                    Deposit: ${Number(r.anticipo_calculado || 0).toFixed(2)} · Remaining: $
                    {Number(r.saldo_pendiente || 0).toFixed(2)}
                  </div>
                  {r.cliente_manual_telefono ? (
                    <div className="mt-1 text-xs text-neutral-500">Phone: {r.cliente_manual_telefono}</div>
                  ) : null}
                  {r.nota ? <div className="mt-1 text-xs text-neutral-500">Note: {r.nota}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-neutral-700 px-2 py-1 text-[11px] text-neutral-300">
                    {STATUS_LABELS[r.estado]}
                  </span>
                  <select
                    value={r.estado}
                    onChange={(e) => handleChangeStatus(r.id, e.target.value)}
                    disabled={updatingId === r.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/80 px-2 py-1.5 text-xs outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-60"
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

