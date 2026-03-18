"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClientNav from "@/components/ClientNav";

type Negocio = {
  id: string;
  nombre: string;
  zona_horaria: string;
};

type NegociosResponse = {
  ok: boolean;
  data?: Negocio[];
  error?: string;
};

type ServicioSearch = {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  buffer_min: number | null;
  precio: number;
  negocios?: {
    id: string;
    nombre: string;
    zona_horaria: string | null;
  } | null;
};

type ServiciosResponse = {
  ok: boolean;
  data?: ServicioSearch[];
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function BusinessesListPage() {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [servicios, setServicios] = useState<ServicioSearch[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tab, setTab] = useState<"businesses" | "services">("businesses");

  const normalizedQuery = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);

  useEffect(() => {
    const load = async () => {
      if (!API_URL) {
        setError("API URL is not configured.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/negocios/negocios`);
        const data: NegociosResponse = await res.json();
        if (!res.ok || !data.ok || !Array.isArray(data.data)) {
          throw new Error(data.error || "Could not load businesses.");
        }
        setNegocios(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error loading businesses.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    if (!API_URL) return;
    setError(null);
    setSearching(true);
    try {
      const term = text.trim();

      const [negRes, serRes] = await Promise.all([
        fetch(
          term
            ? `${API_URL}/api/negocios/negocios`
            : `${API_URL}/api/negocios/negocios`
        ),
        fetch(
          term
            ? `${API_URL}/api/servicios?include_business=true&q=${encodeURIComponent(term)}`
            : `${API_URL}/api/servicios?include_business=true`
        ),
      ]);

      const negData: NegociosResponse = await negRes.json();
      const serData: ServiciosResponse = await serRes.json();

      if (!negRes.ok || !negData.ok || !Array.isArray(negData.data)) {
        throw new Error(negData.error || "Could not load businesses.");
      }
      if (!serRes.ok || !serData.ok || !Array.isArray(serData.data)) {
        throw new Error(serData.error || "Could not load services.");
      }

      const businessFiltered = term
        ? negData.data.filter((n) =>
            `${n.nombre} ${n.zona_horaria}`.toLowerCase().includes(term.toLowerCase())
          )
        : negData.data;
      setNegocios(businessFiltered);
      setServicios(serData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown search error.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!loading) {
      void handleSearch(normalizedQuery);
    }
  }, [handleSearch, loading, normalizedQuery, tab]);

  const renderHighlighted = (text: string) => {
    if (!normalizedQuery) return text;
    const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, idx) => {
          const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase();
          if (!isMatch) return <span key={`${part}-${idx}`}>{part}</span>;
          return (
            <mark
              key={`${part}-${idx}`}
              className="rounded bg-neutral-100/20 px-0.5 text-neutral-100"
            >
              {part}
            </mark>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <ClientNav />
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Find a business</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Search businesses or services and open the best match quickly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("businesses")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                tab === "businesses"
                  ? "border-neutral-200 bg-neutral-100 text-black"
                  : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Businesses
            </button>
            <button
              type="button"
              onClick={() => setTab("services")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                tab === "services"
                  ? "border-neutral-200 bg-neutral-100 text-black"
                  : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Services
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "businesses" ? "Search business name..." : "Search service name..."}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            />
            <button
              type="button"
              onClick={() => void handleSearch(query)}
              className="rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              Search
            </button>
          </div>
          {searching ? (
            <p className="mt-2 text-[11px] text-neutral-500">Searching...</p>
          ) : null}
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading || searching ? (
          <p className="text-sm text-neutral-400">Loading businesses...</p>
        ) : tab === "businesses" ? negocios.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
            No businesses available yet.
          </p>
        ) : (
          <div className="space-y-3">
            {negocios.map((n) => (
              <Link
                key={n.id}
                href={`/businesses/${n.id}`}
                className="block rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 hover:border-neutral-600 hover:bg-[#090909] transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium text-neutral-50">{renderHighlighted(n.nombre)}</h2>
                    <p className="mt-1 text-xs text-neutral-400">{n.zona_horaria}</p>
                  </div>
                  <span className="text-xs text-neutral-300">View</span>
                </div>
              </Link>
            ))}
          </div>
        ) : servicios.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
            No services found.
          </p>
        ) : (
          <div className="space-y-3">
            {servicios.map((s) => (
              <Link
                key={s.id}
                href={`/businesses/${s.negocio_id}`}
                className="block rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 hover:border-neutral-600 hover:bg-[#090909] transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium text-neutral-50">{renderHighlighted(s.nombre)}</h2>
                    <p className="mt-1 text-xs text-neutral-400">
                      {renderHighlighted(s.negocios?.nombre || "Business")} · {s.duracion_min} min + {s.buffer_min ?? 0} min buffer · ${s.precio}
                    </p>
                    {s.descripcion ? (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{renderHighlighted(s.descripcion)}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-neutral-300">Open business</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

