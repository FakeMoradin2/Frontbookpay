"use client";

import { FormEvent, useEffect, useState } from "react";

type Negocio = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  zona_horaria: string | null;
  duracion_buffer_min: number | null;
  imagen: string | null;
  activo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "UTC",
];

export default function BusinessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState("");
  const [bufferMin, setBufferMin] = useState("");

  useEffect(() => {
    const fetchNegocio = async () => {
      if (!API_URL || typeof window === "undefined") return;
      const token = window.localStorage.getItem("access_token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/negocios/admin/negocio`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load business");
        }

        const data = await res.json();
        if (data.ok && data.data) {
          const n = data.data;
          setNegocio(n);
          setNombre(n.nombre ?? "");
          setTelefono(n.telefono ?? "");
          setCorreo(n.correo ?? "");
          setZonaHoraria(n.zona_horaria ?? "");
          setBufferMin(String(n.duracion_buffer_min ?? 0));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    void fetchNegocio();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;

    const bufferNum = parseInt(bufferMin, 10);
    if (isNaN(bufferNum) || bufferNum < 0) {
      setError("Buffer duration must be 0 or greater");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/negocios/admin/negocio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim() || null,
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          zona_horaria: zonaHoraria.trim() || null,
          duracion_buffer_min: bufferNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not update business");
      }

      setSuccess(true);
      if (data.data) setNegocio(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">My business</h1>
        <p className="mt-4 text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">My business</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Configure your business details: name, contact, timezone, and buffer between appointments.
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          Business updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="nombre">
            Name
          </label>
          <input
            id="nombre"
            type="text"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
            placeholder="Business name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="telefono">
            Phone
          </label>
          <input
            id="telefono"
            type="tel"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
            placeholder="+1 234 567 8900"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="correo">
            Email
          </label>
          <input
            id="correo"
            type="email"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
            placeholder="contact@business.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="zona_horaria">
            Timezone
          </label>
          <select
            id="zona_horaria"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
            value={zonaHoraria}
            onChange={(e) => setZonaHoraria(e.target.value)}
          >
            <option value="">Select timezone</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="buffer">
            Buffer between appointments (minutes)
          </label>
          <input
            id="buffer"
            type="number"
            min={0}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
            placeholder="0"
            value={bufferMin}
            onChange={(e) => setBufferMin(e.target.value)}
          />
          <p className="text-xs text-neutral-500">
            Extra minutes between appointments (e.g. 5 for cleaning or preparation).
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-6 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </>
  );
}
