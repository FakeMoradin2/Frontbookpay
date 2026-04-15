"use client";

import { useEffect, useMemo, useState } from "react";

export type ReservaServicioLine = { servicio_id: string; cantidad: number };

type FechaDisponible = { date: string; weekday: string; slots_count: number };

type SlotDisponible = {
  label: string;
  start_iso: string;
  end_iso: string;
  block_key: string;
  block_start: string;
  block_end: string;
};

export function expandServicioIdsForAvailability(lines: ReservaServicioLine[]): string[] {
  const out: string[] = [];
  for (const row of lines) {
    const n = Math.max(1, Number(row.cantidad) || 1);
    for (let i = 0; i < n; i += 1) out.push(row.servicio_id);
  }
  return out;
}

function formatWeekday(dateIso: string) {
  const label = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(`${dateIso}T00:00:00`)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type Props = {
  apiUrl: string;
  negocioId: string;
  staffId?: string | null;
  reservaServicios: ReservaServicioLine[];
  disabled?: boolean;
  onConfirm: (startIso: string) => void | Promise<void>;
  submitting?: boolean;
  /** Optional UI copy overrides (e.g. localization) */
  copy?: {
    title?: string;
    datesLabel?: string;
    slotsLabel?: string;
    confirm?: string;
    saving?: string;
    loadingDates?: string;
    loadingSlots?: string;
    noDates?: string;
    noSlots?: string;
  };
};

const DEFAULT_COPY = {
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

export function RescheduleSlotPicker({
  apiUrl,
  negocioId,
  staffId,
  reservaServicios,
  disabled,
  onConfirm,
  submitting,
  copy: copyProp,
}: Props) {
  const copy = { ...DEFAULT_COPY, ...copyProp };
  const linesSig = JSON.stringify(
    reservaServicios.map((x) => [x.servicio_id, x.cantidad])
  );
  const expandedIds = useMemo(
    () => expandServicioIdsForAvailability(reservaServicios),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita refetch si el padre recrea el array con el mismo contenido
    [linesSig]
  );

  const [availableDates, setAvailableDates] = useState<FechaDisponible[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotDisponible[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStart, setSelectedSlotStart] = useState("");

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
    if (!apiUrl || !negocioId || expandedIds.length === 0) {
      setAvailableDates([]);
      setSelectedDate("");
      return;
    }

    const loadDates = async () => {
      setLoadingDates(true);
      try {
        const params = new URLSearchParams();
        params.set("negocio_id", negocioId);
        if (staffId) params.set("staff_id", staffId);
        params.set("servicio_ids", expandedIds.join(","));
        params.set("days", "45");
        const res = await fetch(`${apiUrl}/api/reservas/public/fechas-disponibles?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.data?.dates)) {
          throw new Error(data.error || "Could not load available dates");
        }
        const dates: FechaDisponible[] = data.data.dates;
        setAvailableDates(dates);
        const today = new Date().toISOString().slice(0, 10);
        const defaultDate = dates.find((d) => d.date === today)?.date || dates[0]?.date || "";
        setSelectedDate((prev) => (prev && dates.some((d) => d.date === prev) ? prev : defaultDate));
      } finally {
        setLoadingDates(false);
      }
    };

    void loadDates();
  }, [apiUrl, negocioId, staffId, expandedIds]);

  useEffect(() => {
    if (!apiUrl || !negocioId || !selectedDate || expandedIds.length === 0) {
      setAvailableSlots([]);
      setSelectedSlotStart("");
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams();
        params.set("negocio_id", negocioId);
        if (staffId) params.set("staff_id", staffId);
        params.set("fecha", selectedDate);
        params.set("servicio_ids", expandedIds.join(","));
        const res = await fetch(`${apiUrl}/api/reservas/public/disponibilidad?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.data?.slots)) {
          throw new Error(data.error || "Could not load available slots");
        }
        const slots: SlotDisponible[] = data.data.slots;
        setAvailableSlots(slots);
        setSelectedSlotStart((prev) =>
          prev && slots.some((s) => s.start_iso === prev) ? prev : slots[0]?.start_iso || ""
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    void loadSlots();
  }, [apiUrl, negocioId, staffId, selectedDate, expandedIds]);

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
      <p className="text-xs font-medium text-neutral-300">{copy.title}</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">{copy.datesLabel}</p>
          {loadingDates ? (
            <p className="text-xs text-neutral-500">{copy.loadingDates}</p>
          ) : availableDates.length === 0 ? (
            <p className="text-xs text-neutral-500">{copy.noDates}</p>
          ) : (
            <div className="max-h-40 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                {availableDates.map((d) => {
                  const active = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      disabled={disabled}
                      className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                        active
                          ? "border-neutral-200 bg-neutral-100 text-black"
                          : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium">{new Date(`${d.date}T00:00:00`).toLocaleDateString()}</div>
                      <div className={`mt-0.5 text-[11px] ${active ? "text-neutral-700" : "text-neutral-500"}`}>
                        {formatWeekday(d.date)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-[11px] text-neutral-500">{copy.slotsLabel}</p>
          {loadingSlots ? (
            <p className="text-xs text-neutral-500">{copy.loadingSlots}</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-xs text-neutral-500">{copy.noSlots}</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {groupedSlotsByBlock.map((group) => (
                <div key={group.block_key} className="rounded-lg border border-neutral-800 bg-black/30 p-2">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {group.block_start} – {group.block_end}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.slots.map((slot) => {
                      const active = selectedSlotStart === slot.start_iso;
                      return (
                        <button
                          key={slot.start_iso}
                          type="button"
                          onClick={() => setSelectedSlotStart(slot.start_iso)}
                          disabled={disabled}
                          className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-medium transition ${
                            active
                              ? "border-neutral-200 bg-neutral-100 text-black"
                              : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                          } disabled:opacity-50`}
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
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled || submitting || !selectedSlotStart}
          onClick={() => void onConfirm(selectedSlotStart)}
          className="rounded-lg bg-neutral-50 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? copy.saving : copy.confirm}
        </button>
      </div>
    </div>
  );
}
