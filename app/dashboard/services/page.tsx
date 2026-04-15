"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { uploadNewServicioImage, uploadServicioImage } from "@/lib/storage-upload";

type Servicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  buffer_min: number | null;
  precio: number;
  anticipo_tipo: "fijo" | "porcentaje" | "no_requiere";
  anticipo_valor: number | null;
  imagen_url: string | null;
  activo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMin, setDuracionMin] = useState("");
  const [bufferMin, setBufferMin] = useState("");
  const [precio, setPrecio] = useState("");
  const [anticipoTipo, setAnticipoTipo] = useState<"fijo" | "porcentaje" | "no_requiere">("no_requiere");
  const [anticipoValor, setAnticipoValor] = useState("");
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [stripeDepositsReady, setStripeDepositsReady] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagenUrlForm, setImagenUrlForm] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getToken = () => (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  const fetchServicios = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    const res = await fetch(`${API_URL}/api/servicios/admin/servicios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      setServicios(data.data);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!API_URL) {
        setLoading(false);
        return;
      }
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.ok && typeof me.user?.negocio_id === "string") {
          setNegocioId(me.user.negocio_id);
        }
      }
      const negRes = await fetch(`${API_URL}/api/negocios/admin/negocio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const negData = await negRes.json().catch(() => ({}));
      if (negRes.ok && negData.ok && negData.data) {
        const n = negData.data as {
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean | null;
        };
        setStripeDepositsReady(
          !!n.stripe_connect_account_id && !!n.stripe_connect_charges_enabled
        );
      }
      await fetchServicios();
      setLoading(false);
    };
    void load();
  }, [fetchServicios]);

  const clearFormFields = () => {
    setNombre("");
    setDescripcion("");
    setDuracionMin("");
    setPrecio("");
    setBufferMin("");
    setAnticipoTipo("no_requiere");
    setAnticipoValor("");
    setEditingId(null);
    setImageFile(null);
    setImagenUrlForm(null);
  };

  const resetForm = () => {
    clearFormFields();
    setShowForm(false);
  };

  const fillFormForEdit = (s: Servicio) => {
    setNombre(s.nombre);
    setDescripcion(s.descripcion ?? "");
    setDuracionMin(String(s.duracion_min));
    setPrecio(String(s.precio));
    setBufferMin(s.buffer_min != null ? String(s.buffer_min) : "0");
    setAnticipoTipo(s.anticipo_tipo);
    setAnticipoValor(s.anticipo_valor != null ? String(s.anticipo_valor) : "");
    setEditingId(s.id);
    setShowForm(true);
    setImageFile(null);
    setImagenUrlForm(s.imagen_url ?? null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("Name is required");
      return;
    }

    const dur = parseInt(duracionMin, 10);
    const pr = parseFloat(precio);
    const bf = parseInt(bufferMin || "0", 10);
    if (isNaN(dur) || dur <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    if (isNaN(pr) || pr < 0) {
      toast.error("Price must be 0 or greater");
      return;
    }
    if (isNaN(bf) || bf < 0) {
      toast.error("Buffer must be 0 or greater");
      return;
    }
    if (bf > 30) {
      toast.error("Buffer must be less than 30 minutes");
      return;
    }

    if (anticipoTipo !== "no_requiere") {
      if (!stripeDepositsReady) {
        toast.error("Connect Stripe under Payments before requiring a deposit.");
        return;
      }
      const av = parseFloat(anticipoValor);
      if (anticipoTipo === "fijo" && (isNaN(av) || av <= 0)) {
        toast.error("Deposit value must be greater than 0");
        return;
      }
      if (anticipoTipo === "porcentaje" && (isNaN(av) || av < 1 || av > 100)) {
        toast.error("Deposit percentage must be between 1 and 100");
        return;
      }
    }

    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      let imagen_url: string | null | undefined;
      if (imageFile) {
        if (!negocioId) {
          throw new Error("Business context not loaded. Refresh the page.");
        }
        imagen_url = editingId
          ? await uploadServicioImage(negocioId, editingId, imageFile)
          : await uploadNewServicioImage(negocioId, imageFile);
      } else {
        imagen_url = imagenUrlForm;
      }

      const body: Record<string, unknown> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        duracion_min: dur,
        buffer_min: bf,
        precio: pr,
        anticipo_tipo: anticipoTipo,
        anticipo_valor: anticipoTipo === "no_requiere" ? null : parseFloat(anticipoValor),
      };
      if (imagen_url !== undefined) {
        body.imagen_url = imagen_url;
      }

      if (editingId) {
        const res = await fetch(`${API_URL}/api/servicios/admin/servicios/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update service");
        toast.success("Service updated successfully");
      } else {
        const res = await fetch(`${API_URL}/api/servicios/admin/servicios`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create service");
        toast.success("Service created successfully");
      }
      await fetchServicios();
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
      const res = await fetch(`${API_URL}/api/servicios/admin/servicios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete service");
      toast.success("Service removed");
      await fetchServicios();
      if (editingId === id) resetForm();
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
    toast.warning("Delete this service?", {
      description: "Deletion may be blocked if there are future reservations tied to it.",
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

  const formatDeposit = (s: Servicio) => {
    if (s.anticipo_tipo === "no_requiere") return "No deposit";
    if (s.anticipo_tipo === "fijo") return `$${s.anticipo_valor}`;
    return `${s.anticipo_valor}%`;
  };

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Services</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Manage your service catalog: name, duration, price, and deposit rules.
        </p>
      </section>

      {!showForm ? (
        <button
          type="button"
          onClick={() => {
            clearFormFields();
            setShowForm(true);
          }}
          className="mb-4 flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          Add service
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl space-y-4 rounded-2xl border border-neutral-800 bg-[#060606] p-6">
          <h2 className="text-sm font-medium">{editingId ? "Edit service" : "New service"}</h2>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="nombre">
              Name *
            </label>
            <input
              id="nombre"
              type="text"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder="e.g. Haircut"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="descripcion">
              Description
            </label>
            <textarea
              id="descripcion"
              rows={2}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder="Optional description"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-neutral-300">Image</label>
            <p className="text-xs text-neutral-500">Optional. JPG, PNG, WebP or GIF, up to 5 MB.</p>
            {(previewUrl || imagenUrlForm) && (
              <img
                src={previewUrl ?? imagenUrlForm ?? undefined}
                alt=""
                className="h-28 w-28 rounded-lg border border-neutral-800 object-cover"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800">
                Choose file
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    setImageFile(f ?? null);
                  }}
                />
              </label>
              {(previewUrl || imagenUrlForm) && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagenUrlForm(null);
                  }}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-800"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="duracion">
                Duration (min) *
              </label>
              <input
                id="duracion"
                type="number"
                min={1}
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                placeholder="30"
                value={duracionMin}
                onChange={(e) => setDuracionMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="bufferMin">
                Buffer (min)
              </label>
              <input
                id="bufferMin"
                type="number"
                min={0}
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                placeholder="0"
                value={bufferMin}
                onChange={(e) => setBufferMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm text-neutral-300" htmlFor="precio">
                Price *
              </label>
              <input
                id="precio"
                type="number"
                min={0}
                step="0.01"
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                placeholder="50"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-neutral-300">Deposit</label>
            {!stripeDepositsReady ? (
              <p className="text-xs text-amber-200/90">
                Fixed or percentage deposits require Stripe Connect (charges enabled).{" "}
                <Link href="/dashboard/payments" className="font-medium underline hover:text-amber-100">
                  Configure in Payments
                </Link>
                .
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="anticipo"
                  checked={anticipoTipo === "no_requiere"}
                  onChange={() => setAnticipoTipo("no_requiere")}
                />
                <span className="text-sm">No deposit</span>
              </label>
              <label
                className={`flex items-center gap-2 ${!stripeDepositsReady ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="anticipo"
                  disabled={!stripeDepositsReady}
                  checked={anticipoTipo === "fijo"}
                  onChange={() => setAnticipoTipo("fijo")}
                />
                <span className="text-sm">Fixed amount</span>
              </label>
              <label
                className={`flex items-center gap-2 ${!stripeDepositsReady ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="anticipo"
                  disabled={!stripeDepositsReady}
                  checked={anticipoTipo === "porcentaje"}
                  onChange={() => setAnticipoTipo("porcentaje")}
                />
                <span className="text-sm">Percentage</span>
              </label>
            </div>
            {showForm && !stripeDepositsReady && (anticipoTipo === "fijo" || anticipoTipo === "porcentaje") && (
              <div className="rounded-md border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
                This service has a deposit rule, but Stripe is not ready to charge online. Go to{" "}
                <Link href="/dashboard/payments" className="font-medium underline hover:text-amber-50">
                  Payments
                </Link>{" "}
                to finish Stripe setup, or switch to &quot;No deposit&quot; to save other fields.
              </div>
            )}
            {(anticipoTipo === "fijo" || anticipoTipo === "porcentaje") && (
              <input
                type="number"
                min={anticipoTipo === "porcentaje" ? 1 : 0.01}
                max={anticipoTipo === "porcentaje" ? 100 : undefined}
                step={anticipoTipo === "porcentaje" ? 1 : 0.01}
                className="mt-1 w-32 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                placeholder={anticipoTipo === "porcentaje" ? "50" : "10"}
                value={anticipoValor}
                onChange={(e) => setAnticipoValor(e.target.value)}
                required
              />
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
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

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading services...</p>
        ) : servicios.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
            No services yet. Click &quot;Add service&quot; to create one.
          </p>
        ) : (
          servicios.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-4">
                {s.imagen_url ? (
                  <img
                    src={s.imagen_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-neutral-800 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/40 text-[10px] text-neutral-600">
                    No img
                  </div>
                )}
                <div>
                <div className="font-medium text-neutral-50">{s.nombre}</div>
                <div className="mt-1 text-xs text-neutral-400">
                  {s.duracion_min} min + {s.buffer_min ?? 0} min buffer · ${s.precio} · {formatDeposit(s)}
                </div>
                {s.descripcion && (
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{s.descripcion}</p>
                )}
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => fillFormForEdit(s)}
                  className="flex h-9 items-center justify-center rounded-lg border border-neutral-700 px-3 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="flex h-9 items-center justify-center rounded-lg border border-red-800/60 px-3 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                >
                  {deleting === s.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
