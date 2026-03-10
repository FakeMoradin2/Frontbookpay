"use client";

import { FormEvent, useEffect, useState } from "react";

type Horario = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DAYS_MAP: { value: string; label: string }[] = [
  { value: "lun", label: "Monday" },
  { value: "mar", label: "Tuesday" },
  { value: "mie", label: "Wednesday" },
  { value: "jue", label: "Thursday" },
  { value: "vie", label: "Friday" },
  { value: "sab", label: "Saturday" },
  { value: "dom", label: "Sunday" },
];

export default function SchedulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [diaSemana, setDiaSemana] = useState("lun");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");

  const getToken = () => (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);

  const fetchHorarios = async () => {
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
  };

  useEffect(() => {
    const load = async () => {
      await fetchHorarios();
      setLoading(false);
    };
    void load();
  }, []);

  const resetForm = () => {
    setDiaSemana("lun");
    setHoraInicio("09:00");
    setHoraFin("18:00");
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (horaInicio >= horaFin) {
      setError("Start time must be before end time");
      return;
    }

    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/horarios/admin/horarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dia_semana: diaSemana,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          activo: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create schedule");
      setSuccess("Schedule added successfully");
      await fetchHorarios();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    if (!confirm("Are you sure you want to remove this schedule block?")) return;

    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/horarios/admin/horarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete schedule");
      setSuccess("Schedule block removed");
      await fetchHorarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeleting(null);
    }
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
          Set your business hours by day. Add blocks of availability (e.g. 9:00–18:00).
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {success}
        </div>
      )}

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
          <h2 className="text-sm font-medium">New schedule block</h2>

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
                  {d.label}
                </option>
              ))}
            </select>
          </div>

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
              {saving ? "Adding..." : "Add block"}
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
                      <button
                        type="button"
                        onClick={() => handleDelete(h.id)}
                        disabled={deleting === h.id}
                        className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                      >
                        {deleting === h.id ? "Removing..." : "Remove"}
                      </button>
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
