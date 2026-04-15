"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Horario = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DAYS_MAP: { value: string; label: string; labelShort: string }[] = [
  { value: "lun", label: "Monday", labelShort: "Mon" },
  { value: "mar", label: "Tuesday", labelShort: "Tue" },
  { value: "mie", label: "Wednesday", labelShort: "Wed" },
  { value: "jue", label: "Thursday", labelShort: "Thu" },
  { value: "vie", label: "Friday", labelShort: "Fri" },
  { value: "sab", label: "Saturday", labelShort: "Sat" },
  { value: "dom", label: "Sunday", labelShort: "Sun" },
];

const WEEKDAYS = ["lun", "mar", "mie", "jue", "vie"] as const;
const MON_SAT = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;
const ALL_DAYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;

export default function SchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [diaSemana, setDiaSemana] = useState("lun");
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    WEEKDAYS.forEach((d) => {
      init[d] = true;
    });
    ["sab", "dom"].forEach((d) => {
      init[d] = false;
    });
    return init;
  });
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");

  const getToken = () => (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);

  const fetchHorarios = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    const res = await fetch(`${API_URL}/api/horarios/admin/horarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      setHorarios(data.data);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchHorarios();
      setLoading(false);
    };
    void load();
  }, [fetchHorarios]);

  const resetForm = () => {
    setDiaSemana("lun");
    const next: Record<string, boolean> = {};
    WEEKDAYS.forEach((d) => {
      next[d] = true;
    });
    ["sab", "dom"].forEach((d) => {
      next[d] = false;
    });
    setSelectedDays(next);
    setHoraInicio("09:00");
    setHoraFin("18:00");
    setEditingId(null);
    setShowForm(false);
  };

  const fillFormForEdit = (h: Horario) => {
    setDiaSemana(h.dia_semana);
    setHoraInicio(h.hora_inicio);
    setHoraFin(h.hora_fin);
    setEditingId(h.id);
    setShowForm(true);
  };

  const toggleDay = (value: string) => {
    setSelectedDays((prev) => ({ ...prev, [value]: !prev[value] }));
  };

  const applyPreset = (days: readonly string[]) => {
    const next: Record<string, boolean> = {};
    ALL_DAYS.forEach((d) => {
      next[d] = days.includes(d);
    });
    setSelectedDays(next);
  };

  const selectedDayList = useMemo(
    () => DAYS_MAP.map((d) => d.value).filter((v) => selectedDays[v]),
    [selectedDays]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (horaInicio >= horaFin) {
      toast.error("Start time must be before end time");
      return;
    }

    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/api/horarios/admin/horarios/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            dia_semana: diaSemana,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            activo: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update schedule");
        toast.success("Schedule updated successfully");
        await fetchHorarios();
        resetForm();
        return;
      }

      if (selectedDayList.length === 0) {
        toast.error("Select at least one day");
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/horarios/admin/horarios/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dias_semana: selectedDayList,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          activo: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not create schedules");
      }

      let msg = data.message || "";
      if (Array.isArray(data.failed) && data.failed.length > 0) {
        const detail = data.failed
          .map(
            (f: { dia_semana: string; error: string }) =>
              `${DAYS_MAP.find((d) => d.value === f.dia_semana)?.labelShort ?? f.dia_semana}: ${f.error}`
          )
          .join("; ");
        msg = `${msg} ${detail}`;
      }
      toast.success(msg || "Schedules added successfully");
      await fetchHorarios();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (id: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/api/horarios/admin/horarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete schedule");
      toast.success("Schedule block removed");
      await fetchHorarios();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    toast.warning("Delete this schedule block?", {
      description: "That day will no longer offer this time range until you add it again.",
      duration: 12_000,
      action: {
        label: "Delete",
        onClick: () => void performDelete(id),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const byDay = DAYS_MAP.map((d) => ({
    ...d,
    blocks: horarios.filter((h) => h.dia_semana === d.value),
  }));

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Schedules</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Set your business hours. Add one block and choose multiple days at once (e.g. Mon–Fri 9:00–18:00).
        </p>
      </section>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-4 flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          Add schedule block
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl space-y-4 rounded-2xl border border-neutral-800 bg-[#060606] p-6">
          <h2 className="text-sm font-medium">{editingId ? "Edit schedule block" : "New schedule block"}</h2>

          {editingId ? (
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="dia_semana">
                Day
              </label>
              <select
                id="dia_semana"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
              >
                {DAYS_MAP.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.labelShort} — {d.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="block text-sm text-neutral-300">Days</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(WEEKDAYS)}
                  className="rounded-lg border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Mon–Fri
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(MON_SAT)}
                  className="rounded-lg border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Mon–Sat
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(ALL_DAYS)}
                  className="rounded-lg border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Every day
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset([])}
                  className="rounded-lg border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS_MAP.map((d) => (
                  <label
                    key={d.value}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      selectedDays[d.value]
                        ? "border-neutral-200 bg-neutral-100 text-black"
                        : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!selectedDays[d.value]}
                      onChange={() => toggleDay(d.value)}
                    />
                    {d.labelShort}
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">
                {selectedDayList.length} day{selectedDayList.length === 1 ? "" : "s"} selected
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="hora_inicio">
                Start time
              </label>
              <input
                id="hora_inicio"
                type="time"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="hora_fin">
                End time
              </label>
              <input
                id="hora_fin"
                type="time"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                  ? "Update block"
                  : "Add blocks"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex h-10 items-center justify-center rounded-lg border border-neutral-700 px-4 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading schedules...</p>
        ) : (
          byDay.map(({ value, label, blocks }) => (
            <div key={value} className="rounded-2xl border border-neutral-800 bg-[#060606] overflow-hidden">
              <div className="border-b border-neutral-800 bg-neutral-900/40 px-6 py-3 text-sm font-medium text-neutral-200">
                {label}
              </div>
              <div className="divide-y divide-neutral-800">
                {blocks.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-neutral-500">No hours set</div>
                ) : (
                  blocks.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <span className="text-sm text-neutral-300">
                        {h.hora_inicio} – {h.hora_fin}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fillFormForEdit(h)}
                          className="rounded-md border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h.id)}
                          disabled={deleting === h.id}
                          className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                        >
                          {deleting === h.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
