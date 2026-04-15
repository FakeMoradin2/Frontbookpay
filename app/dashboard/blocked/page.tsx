"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Bloqueo = {
  id: string;
  inicio_en: string;
  fin_en: string;
  motivo: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BlockedDatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  const [inicioEn, setInicioEn] = useState("");
  const [finEn, setFinEn] = useState("");
  const [motivo, setMotivo] = useState("");

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  const fetchBloqueos = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/api/bloqueos/admin/bloqueos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load blocked dates");
    setBloqueos(Array.isArray(data.data) ? data.data : []);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchBloqueos();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchBloqueos]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!inicioEn || !finEn) {
      toast.error("Start and end are required.");
      return;
    }
    if (inicioEn >= finEn) {
      toast.error("Start must be earlier than end.");
      return;
    }

    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/bloqueos/admin/bloqueos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          inicio_en: new Date(inicioEn).toISOString(),
          fin_en: new Date(finEn).toISOString(),
          motivo: motivo.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create block");
      toast.success("Blocked period created.");
      setInicioEn("");
      setFinEn("");
      setMotivo("");
      await fetchBloqueos();
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
      const res = await fetch(`${API_URL}/api/bloqueos/admin/bloqueos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete blocked period");
      toast.success("Blocked period removed.");
      await fetchBloqueos();
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
    toast.warning("Delete this blocked period?", {
      description: "New bookings will be allowed in this window again after removal.",
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

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Blocked dates</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Create date/time blocks to prevent new bookings in unavailable periods.
        </p>
      </section>

      <form
        onSubmit={handleCreate}
        className="mb-8 max-w-2xl space-y-4 rounded-2xl border border-neutral-800 bg-[#060606] p-6"
      >
        <h2 className="text-sm font-medium">New blocked period</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="inicio_en">
              Start
            </label>
            <input
              id="inicio_en"
              type="datetime-local"
              value={inicioEn}
              onChange={(e) => setInicioEn(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="fin_en">
              End
            </label>
            <input
              id="fin_en"
              type="datetime-local"
              value={finEn}
              onChange={(e) => setFinEn(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-300" htmlFor="motivo">
            Reason (optional)
          </label>
          <input
            id="motivo"
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            placeholder="e.g. Holiday, internal event"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-4 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Create block"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading blocked periods...</p>
      ) : bloqueos.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          No blocked periods configured.
        </p>
      ) : (
        <div className="space-y-3">
          {bloqueos.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-neutral-50">
                  {new Date(b.inicio_en).toLocaleString()} - {new Date(b.fin_en).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-400">{b.motivo || "No reason provided"}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                disabled={deleting === b.id}
                className="flex h-9 items-center justify-center rounded-lg border border-red-800/60 px-3 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
              >
                {deleting === b.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

