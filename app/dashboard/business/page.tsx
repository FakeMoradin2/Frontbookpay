"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadNegocioImage } from "@/lib/storage-upload";

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
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState("");
  const [bufferMin, setBufferMin] = useState("");
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publicBookingUrl, setPublicBookingUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

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
        setNegocioId(typeof n.id === "string" ? n.id : null);
        setNombre(n.nombre ?? "");
        setTelefono(n.telefono ?? "");
        setCorreo(n.correo ?? "");
        setZonaHoraria(n.zona_horaria ?? "");
        setBufferMin(String(n.duracion_buffer_min ?? 0));
        setImagenUrl(typeof n.imagen_url === "string" ? n.imagen_url : null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNegocio();
  }, []);

  useEffect(() => {
    if (negocioId && typeof window !== "undefined") {
      setPublicBookingUrl(`${window.location.origin}/book/${negocioId}`);
    } else {
      setPublicBookingUrl("");
    }
  }, [negocioId]);

  const copyPublicBookingLink = async () => {
    if (!publicBookingUrl) return;
    try {
      await navigator.clipboard.writeText(publicBookingUrl);
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  const patchImagenUrl = async (url: string | null) => {
    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch(`${API_URL}/api/negocios/admin/negocio`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imagen_url: url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update image");
    if (data.ok && data.data && typeof data.data.imagen_url !== "undefined") {
      setImagenUrl(data.data.imagen_url ?? null);
    } else {
      setImagenUrl(url);
    }
  };

  const handleBusinessImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !negocioId) return;

    setUploadingImage(true);
    try {
      const publicUrl = await uploadNegocioImage(negocioId, file);
      await patchImagenUrl(publicUrl);
      toast.success("Image updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveBusinessImage = async () => {
    if (!imagenUrl) return;
    setUploadingImage(true);
    try {
      await patchImagenUrl(null);
      toast.success("Image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;

    const bufferNum = parseInt(bufferMin, 10);
    if (isNaN(bufferNum) || bufferNum < 0) {
      toast.error("Buffer duration must be 0 or greater");
      return;
    }
    if (bufferNum > 30) {
      toast.error("Buffer duration must be less than 30 minutes");
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

      toast.success("Business updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
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

      {publicBookingUrl ? (
        <div className="mb-6 max-w-xl space-y-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">Public booking link</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Share this URL on Instagram, WhatsApp, or your website. Customers open it and go straight to booking
              your services (no need to browse the full directory first).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={publicBookingUrl}
              className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 font-mono text-xs text-neutral-200 outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={() => void copyPublicBookingLink()}
              className="shrink-0 rounded-lg bg-neutral-100 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200"
            >
              {copiedLink ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="space-y-2 rounded-xl border border-neutral-800 bg-[#060606] p-4">
          <label className="block text-sm text-neutral-300">Business image</label>
          <p className="text-xs text-neutral-500">
            Shown on your public listing. JPG, PNG, WebP or GIF, up to 5 MB. Stored in Supabase Storage.
          </p>
          {imagenUrl ? (
            <div className="relative mt-2 inline-block">
              <img
                src={imagenUrl}
                alt="Business"
                className="h-32 w-32 rounded-lg border border-neutral-800 object-cover"
              />
            </div>
          ) : (
            <div className="mt-2 flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/40 text-xs text-neutral-500">
              No image
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-neutral-50 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60">
              {uploadingImage ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploadingImage || !negocioId}
                onChange={handleBusinessImageChange}
              />
            </label>
            {imagenUrl ? (
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => void handleRemoveBusinessImage()}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800 disabled:opacity-60"
              >
                Remove image
              </button>
            ) : null}
          </div>
        </div>

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
