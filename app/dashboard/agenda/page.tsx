"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RescheduleSlotPicker, type ReservaServicioLine } from "@/components/RescheduleSlotPicker";
import { useTranslation } from "@/contexts/LocaleContext";

type Reserva = {
  id: string;
  staff_id?: string | null;
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
  usuarios?: { nombre?: string | null; correo?: string | null; telefono?: string | null } | null;
  reserva_servicios?: Array<{ id: string; servicio_id: string; cantidad: number; precio: number }>;
};

type Servicio = {
  id: string;
  nombre: string;
  duracion_min: number;
  buffer_min: number | null;
  precio: number;
};

type StaffMember = {
  id: string;
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  activo: boolean;
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

const STATUS_BORDER: Record<(typeof ESTADOS)[number], string> = {
  pendiente_pago: "border-l-amber-500/90",
  confirmada: "border-l-emerald-500/90",
  cancelada: "border-l-neutral-600",
  completada: "border-l-sky-500/85",
  no_show: "border-l-orange-600/90",
  expirada: "border-l-neutral-500",
};

function resolveClientContact(r: Reserva, t: (key: string) => string) {
  const name =
    r.usuarios?.nombre?.trim() ||
    r.cliente_manual_nombre?.trim() ||
    t("guestClient");
  const email =
    r.usuarios?.correo?.trim() ||
    r.cliente_manual_correo?.trim() ||
    null;
  const phone =
    r.usuarios?.telefono?.trim() ||
    r.cliente_manual_telefono?.trim() ||
    null;
  const source: "portal" | "manual" = r.usuarios ? "portal" : "manual";
  return { name, email, phone, source };
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
  const label = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(`${dateIso}T00:00:00`)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toMonthKey(dateIso: string) {
  return dateIso.slice(0, 7); // yyyy-mm
}

function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map((v) => Number(v));
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1));
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
  const { t } = useTranslation();
  const manualDaysOptions = useMemo(
    () => [
      { value: 30, label: t("agenda.range30") },
      { value: 90, label: t("agenda.range90") },
      { value: 180, label: t("agenda.range180") },
      { value: 365, label: t("agenda.range365") },
    ],
    [t]
  );
  const rescheduleCopy = useMemo(
    () => ({
      title: t("reschedule.title"),
      datesLabel: t("reschedule.datesLabel"),
      slotsLabel: t("reschedule.slotsLabel"),
      confirm: t("reschedule.confirm"),
      saving: t("reschedule.saving"),
      loadingDates: t("reschedule.loadingDates"),
      loadingSlots: t("reschedule.loadingSlots"),
      noDates: t("reschedule.noDates"),
      noSlots: t("reschedule.noSlots"),
    }),
    [t]
  );
  const [loading, setLoading] = useState(true);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rescheduleOpenId, setRescheduleOpenId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [updatingStaffReservationId, setUpdatingStaffReservationId] = useState<string | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
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
  const [manualStaffId, setManualStaffId] = useState("");
  const [manualServicios, setManualServicios] = useState<Record<string, number>>({});
  const [availableDates, setAvailableDates] = useState<FechaDisponible[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotDisponible[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStart, setSelectedSlotStart] = useState("");
  const [manualDaysWindow, setManualDaysWindow] = useState(180);
  const [selectedMonth, setSelectedMonth] = useState("");

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

  const fetchStaff = useCallback(async () => {
    if (!API_URL || !token) return;
    const res = await fetch(`${API_URL}/api/usuarios/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok || !Array.isArray(data?.data)) {
      throw new Error(data.error || "Could not load staff");
    }
    const allStaff: StaffMember[] = data.data;
    setStaff(allStaff);
    const activeStaff = allStaff.filter((s) => s.activo);
    setManualStaffId((prev) => {
      if (prev && activeStaff.some((s: StaffMember) => s.id === prev)) return prev;
      return activeStaff[0]?.id || "";
    });
  }, [token]);

  const selectedServiceIds = useMemo(
    () =>
      Object.entries(manualServicios)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([id]) => id),
    [manualServicios]
  );

  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(availableDates.map((d) => toMonthKey(d.date))));
    return months.sort();
  }, [availableDates]);

  const filteredAvailableDates = useMemo(() => {
    if (!selectedMonth) return availableDates;
    return availableDates.filter((d) => toMonthKey(d.date) === selectedMonth);
  }, [availableDates, selectedMonth]);

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of staff) map.set(s.id, s.nombre);
    return map;
  }, [staff]);

  const activeStaff = useMemo(() => staff.filter((s) => s.activo), [staff]);

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
          fetchStaff(),
        ]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchMe, fetchReservas, fetchServicios, fetchStaff]);

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
    setLoading(true);
    try {
      await fetchReservas({ from, to, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (id: string, inicio_en: string) => {
    if (!API_URL || !token) return;
    setReschedulingId(id);
    try {
      const res = await fetch(`${API_URL}/api/reservas/admin/reservas/${id}/reagendar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inicio_en }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reschedule reservation");
      setRescheduleOpenId(null);
      await fetchReservas({ from, to, status });
      toast.success(t("agenda.toast.rescheduled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setReschedulingId(null);
    }
  };

  const canReschedule = (estado: Reserva["estado"]) =>
    estado === "pendiente_pago" || estado === "confirmada";

  const handleReassignStaff = async (reservaId: string, nextStaffId: string) => {
    if (!API_URL || !token) return;
    if (!nextStaffId) {
      toast.error(t("agenda.toast.staffInvalid"));
      return;
    }

    setUpdatingStaffReservationId(reservaId);
    try {
      const res = await fetch(`${API_URL}/api/reservas/admin/reservas/${reservaId}/staff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staff_id: nextStaffId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not reassign staff");
      }
      await fetchReservas({ from, to, status });
      toast.success(t("agenda.toast.staffReassigned"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setUpdatingStaffReservationId(null);
    }
  };

  const handleChangeStatus = async (id: string, nextStatus: string) => {
    if (!API_URL || !token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/api/reservas/admin/reservas/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update reservation status");
      await fetchReservas({ from, to, status });
      toast.success(t("agenda.toast.statusUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
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
    setManualStaffId(activeStaff[0]?.id || "");
    setManualServicios({});
    setAvailableDates([]);
    setSelectedMonth("");
    setManualDaysWindow(180);
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
        if (manualStaffId) params.set("staff_id", manualStaffId);
        params.set("servicio_ids", selectedServiceIds.join(","));
        params.set("days", String(manualDaysWindow));
        const res = await fetch(`${API_URL}/api/reservas/public/fechas-disponibles?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.data?.dates)) {
          throw new Error(data.error || "Could not load available dates");
        }
        const dates: FechaDisponible[] = data.data.dates;
        setAvailableDates(dates);
        setSelectedDate((prev) => {
          if (dates.some((d) => d.date === prev)) return prev;
          const today = new Date().toISOString().slice(0, 10);
          return dates.find((d) => d.date === today)?.date || dates[0]?.date || "";
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
      } finally {
        setLoadingDates(false);
      }
    };

    void loadDates();
  }, [manualDaysWindow, manualOpen, negocioId, selectedServiceIds, manualStaffId]);

  useEffect(() => {
    if (availableDates.length === 0) {
      if (selectedMonth !== "") setSelectedMonth("");
      return;
    }
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0] || "");
    }
  }, [availableDates, monthOptions, selectedMonth]);

  useEffect(() => {
    if (filteredAvailableDates.length === 0) {
      setSelectedDate("");
      return;
    }
    setSelectedDate((prev) =>
      filteredAvailableDates.some((d) => d.date === prev) ? prev : filteredAvailableDates[0].date
    );
  }, [filteredAvailableDates]);

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
        if (manualStaffId) params.set("staff_id", manualStaffId);
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
        toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
      } finally {
        setLoadingSlots(false);
      }
    };

    void loadSlots();
  }, [manualOpen, negocioId, selectedDate, selectedServiceIds, manualStaffId]);

  const handleCreateManualReservation = async () => {
    if (!API_URL || !token) return;

    const selected = Object.entries(manualServicios)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([servicio_id, cantidad]) => ({ servicio_id, cantidad: Number(cantidad) }));

    if (!manualClientName.trim()) {
      toast.error(t("agenda.toast.manualName"));
      return;
    }
    if (!selectedSlotStart) {
      toast.error(t("agenda.toast.pickSlot"));
      return;
    }
    if (selected.length === 0) {
      toast.error(t("agenda.toast.pickService"));
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
      if (manualStaffId) payload.staff_id = manualStaffId;
      if (manualEstado) payload.estado = manualEstado;

      const res = await fetch(`${API_URL}/api/reservas/admin/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create manual reservation");

      toast.success(t("agenda.toast.manualCreated"));
      resetManualForm();
      await fetchReservas({ from, to, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setCreatingManual(false);
    }
  };

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("agenda.title")}</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">{t("agenda.subtitle")}</p>
        <p className="mt-2 text-[11px] text-neutral-500">
          {autoRefreshing ? t("common.syncing") : t("agenda.autoRefreshOn")}
          {lastUpdatedAt ? `${t("agenda.lastUpdate")}${lastUpdatedAt.toLocaleTimeString()}` : ""}
        </p>
      </section>

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">{t("agenda.manual.title")}</h2>
            <p className="mt-1 text-xs text-neutral-400">{t("agenda.manual.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setManualOpen((prev) => !prev)}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
          >
            {manualOpen ? t("agenda.manual.hide") : t("agenda.manual.show")}
          </button>
        </div>
        {manualOpen ? (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={manualClientName}
                onChange={(e) => setManualClientName(e.target.value)}
                placeholder={t("agenda.manual.clientName")}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <input
                type="tel"
                value={manualClientPhone}
                onChange={(e) => setManualClientPhone(e.target.value)}
                placeholder={t("agenda.manual.clientPhone")}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <select
                value={manualStaffId}
                onChange={(e) => {
                  setManualStaffId(e.target.value);
                  setAvailableDates([]);
                  setSelectedDate("");
                  setAvailableSlots([]);
                  setSelectedSlotStart("");
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              >
                <option value="">{t("agenda.manual.anyStaff")}</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <input
                type="email"
                value={manualClientEmail}
                onChange={(e) => setManualClientEmail(e.target.value)}
                placeholder={t("agenda.manual.clientEmail")}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <select
                value={manualEstado}
                onChange={(e) => setManualEstado(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              >
                <option value="">{t("agenda.manual.autoStatus")}</option>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {t(`booking.status.${s}`)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={manualNota}
                onChange={(e) => setManualNota(e.target.value)}
                placeholder={t("agenda.manual.note")}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 md:col-span-2"
              />
            </div>

            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
              <p className="mb-2 text-xs font-medium text-neutral-300">{t("agenda.manual.services")}</p>
              {servicios.length === 0 ? (
                <p className="text-xs text-neutral-500">{t("agenda.manual.noServices")}</p>
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
                <p className="mb-2 text-xs font-medium text-neutral-300">{t("agenda.manual.availableDates")}</p>
                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={String(manualDaysWindow)}
                    onChange={(e) => setManualDaysWindow(Number(e.target.value))}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-2 py-2 text-xs outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                  >
                    {manualDaysOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={monthOptions.length === 0}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-2 py-2 text-xs outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
                  >
                    {monthOptions.map((monthKey) => (
                      <option key={monthKey} value={monthKey}>
                        {formatMonthKey(monthKey)}
                      </option>
                    ))}
                  </select>
                </div>
                {loadingDates ? (
                  <p className="text-xs text-neutral-500">{t("agenda.manual.loadingDates")}</p>
                ) : availableDates.length === 0 ? (
                  <p className="text-xs text-neutral-500">{t("agenda.manual.selectServicesDates")}</p>
                ) : filteredAvailableDates.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    {t("agenda.manual.noDatesMonth")}
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredAvailableDates.map((d) => {
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
                              {t("agenda.slotsLine", { count: d.slots_count })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <p className="mb-2 text-xs font-medium text-neutral-300">{t("agenda.manual.availableSlots")}</p>
                {loadingSlots ? (
                  <p className="text-xs text-neutral-500">{t("agenda.manual.loadingSlots")}</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-neutral-500">{t("agenda.manual.selectDateSlots")}</p>
                ) : (
                  <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                    {groupedSlotsByBlock.map((group) => (
                      <div key={group.block_key} className="rounded-lg border border-neutral-800 bg-black/30 p-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          {t("agenda.manual.block", { start: group.block_start, end: group.block_end })}
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
                {creatingManual ? t("agenda.manual.creating") : t("agenda.manual.create")}
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
            <option value="">{t("agenda.filters.allStatus")}</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {t(`booking.status.${s}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            {t("agenda.filters.apply")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">{t("agenda.list.loading")}</p>
      ) : reservas.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          {t("agenda.list.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {reservas.map((r) => {
            const contact = resolveClientContact(r, t);
            const assignedStaffName = r.staff_id
              ? staffNameById.get(r.staff_id) || t("agenda.staff.assigned")
              : t("agenda.staff.unassigned");
            const serviceSummary = (r.reserva_servicios || [])
              .map((line) => {
                const svc = servicios.find((s) => s.id === line.servicio_id);
                const label = svc?.nombre || t("agenda.serviceFallback");
                return `${label} ×${Number(line.cantidad ?? 1) || 1}`;
              })
              .join(" · ");

            return (
              <article
                key={r.id}
                className={`overflow-hidden rounded-2xl border border-neutral-800/90 bg-gradient-to-br from-[#0a0a0a] to-[#060606] shadow-lg shadow-black/20 ${STATUS_BORDER[r.estado]} border-l-4`}
              >
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300 ring-1 ring-neutral-700/80">
                        <IconClock className="text-neutral-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                          {t("agenda.card.scheduled")}
                        </p>
                        <p className="mt-0.5 text-base font-semibold leading-snug text-neutral-50">
                          {new Date(r.inicio_en).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          <span className="text-neutral-500">→</span>{" "}
                          {new Date(r.fin_en).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 ring-1 ring-white/[0.04]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          {t("agenda.card.client")}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            contact.source === "portal"
                              ? "bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-800/60"
                              : "bg-amber-950/70 text-amber-100 ring-1 ring-amber-800/50"
                          }`}
                        >
                          {contact.source === "portal" ? t("agenda.card.portal") : t("agenda.card.manual")}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{contact.name}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {t("agenda.card.staff")}{" "}
                        <span className="font-medium text-neutral-200">{assignedStaffName}</span>
                      </p>
                      <div className="mt-3 space-y-2">
                        {contact.email ? (
                          <a
                            href={`mailto:${encodeURIComponent(contact.email)}`}
                            className="flex items-center gap-2.5 rounded-lg bg-black/25 px-2.5 py-2 text-sm text-sky-300/95 transition hover:bg-black/40 hover:text-sky-200"
                          >
                            <span className="shrink-0 text-neutral-500">
                              <IconMail />
                            </span>
                            <span className="min-w-0 truncate font-medium">{contact.email}</span>
                          </a>
                        ) : null}
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone.replace(/\s/g, "")}`}
                            className="flex items-center gap-2.5 rounded-lg bg-black/25 px-2.5 py-2 text-sm text-emerald-300/95 transition hover:bg-black/40 hover:text-emerald-200"
                          >
                            <span className="shrink-0 text-neutral-500">
                              <IconPhone />
                            </span>
                            <span className="font-medium">{contact.phone}</span>
                          </a>
                        ) : null}
                        {!contact.email && !contact.phone ? (
                          <p className="text-xs text-neutral-500">
                            {t("agenda.card.noContact")}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {serviceSummary ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          {t("agenda.card.services")}
                        </p>
                        <p className="mt-1 text-sm text-neutral-300">{serviceSummary}</p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-neutral-800/80 pt-3 text-sm">
                      <div>
                        <span className="text-neutral-500">{t("agenda.card.total")} </span>
                        <span className="font-semibold text-neutral-100">
                          ${Number(r.precio_total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">{t("agenda.card.deposit")} </span>
                        <span className="font-medium text-neutral-200">
                          ${Number(r.anticipo_calculado || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">{t("agenda.card.remaining")} </span>
                        <span className="font-medium text-amber-200/90">
                          ${Number(r.saldo_pendiente || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {r.nota ? (
                      <div className="rounded-lg border border-neutral-800/90 bg-neutral-900/40 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{t("agenda.card.note")}</p>
                        <p className="mt-1 text-sm text-neutral-300">{r.nota}</p>
                      </div>
                    ) : null}

                    {rescheduleOpenId === r.id && API_URL && negocioId && (r.reserva_servicios?.length ?? 0) > 0 ? (
                      <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
                        <RescheduleSlotPicker
                          apiUrl={API_URL}
                          negocioId={negocioId}
                          copy={rescheduleCopy}
                          staffId={r.staff_id || null}
                          reservaServicios={
                            (r.reserva_servicios || []).map((x) => ({
                              servicio_id: x.servicio_id,
                              cantidad: Number(x.cantidad ?? 1) || 1,
                            })) as ReservaServicioLine[]
                          }
                          disabled={reschedulingId === r.id}
                          submitting={reschedulingId === r.id}
                          onConfirm={(startIso) => handleReschedule(r.id, startIso)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-neutral-800/80 pt-4 sm:flex-row sm:items-center lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                          r.estado === "confirmada"
                            ? "bg-emerald-950/80 text-emerald-200 ring-emerald-800/50"
                            : r.estado === "completada"
                              ? "bg-sky-950/70 text-sky-200 ring-sky-800/50"
                              : r.estado === "pendiente_pago"
                                ? "bg-amber-950/70 text-amber-100 ring-amber-800/50"
                                : "bg-neutral-900 text-neutral-300 ring-neutral-700"
                        }`}
                      >
                        {t(`booking.status.${r.estado}`)}
                      </span>
                      <select
                        value={r.estado}
                        onChange={(e) => handleChangeStatus(r.id, e.target.value)}
                        disabled={updatingId === r.id}
                        className="min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-medium outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-60"
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {t(`booking.status.${s}`)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={r.staff_id || ""}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          if (!nextId || nextId === r.staff_id) return;
                          void handleReassignStaff(r.id, nextId);
                        }}
                        disabled={
                          updatingStaffReservationId === r.id ||
                          !canReschedule(r.estado) ||
                          activeStaff.length === 0
                        }
                        className="min-w-[170px] rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-medium outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:opacity-60"
                      >
                        <option value="">
                          {activeStaff.length === 0 ? t("agenda.staff.none") : t("agenda.staff.select")}
                        </option>
                        {activeStaff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!canReschedule(r.estado) || updatingId === r.id || reschedulingId === r.id}
                      onClick={() => setRescheduleOpenId((prev) => (prev === r.id ? null : r.id))}
                      className="rounded-xl border border-neutral-600 bg-neutral-900/50 px-4 py-2.5 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {rescheduleOpenId === r.id ? t("agenda.actions.closeReschedule") : t("agenda.actions.reschedule")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

