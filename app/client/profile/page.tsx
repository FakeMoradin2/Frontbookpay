"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type Perfil = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  useEffect(() => {
    const load = async () => {
      if (!API_URL) return;
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.data) {
          throw new Error(data.error || "Could not load profile");
        }
        const p: Perfil = data.data;
        setNombre(p.nombre || "");
        setCorreo(p.correo || "");
        setTelefono(p.telefono || "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    if (!nombre.trim() || !correo.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not update profile");
      }
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-neutral-400">Loading profile...</p>;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Update your name, email, and phone number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-neutral-800 bg-[#060606] p-6">
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="nombre">
            Name
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="correo">
            Email
          </label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="telefono">
            Phone
          </label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            placeholder="+1 555 123 4567"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}

