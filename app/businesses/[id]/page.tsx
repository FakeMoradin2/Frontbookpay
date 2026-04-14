"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import ListingThumb from "@/components/ListingThumb";

type Negocio = {
  id: string;
  nombre: string;
  zona_horaria: string | null;
  telefono: string | null;
  correo: string | null;
  imagen_url?: string | null;
};

type Servicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  buffer_min?: number | null;
  precio: number;
  imagen_url?: string | null;
  anticipo_tipo: "fijo" | "porcentaje" | "no_requiere";
  anticipo_valor: number | null;
};

type NegocioResponse = {
  ok: boolean;
  data?: Negocio;
  error?: string;
};

type ServiciosResponse = {
  ok: boolean;
  data?: Servicio[];
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!API_URL || !id) {
        setError("Missing API URL or business id.");
        setLoading(false);
        return;
      }
      try {
        const [negocioRes, serviciosRes] = await Promise.all([
          fetch(`${API_URL}/api/negocios/negocios/${id}`),
          fetch(`${API_URL}/api/servicios?negocio_id=${id}`),
        ]);

        const negocioData: NegocioResponse = await negocioRes.json();
        const serviciosData: ServiciosResponse = await serviciosRes.json();

        if (!negocioRes.ok || !negocioData.ok || !negocioData.data) {
          throw new Error(negocioData.error || "Could not load business.");
        }

        if (!serviciosRes.ok || !serviciosData.ok || !Array.isArray(serviciosData.data)) {
          throw new Error(serviciosData.error || "Could not load services for this business.");
        }

        setNegocio(negocioData.data);
        setServicios(serviciosData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error loading business.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const goToBook = () => {
    router.push(`/businesses/${id}/book`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <ClientNav />
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-xs text-neutral-400 hover:text-neutral-200"
        >
          ← Back
        </button>

        {error && (
          <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-neutral-400">Loading business...</p>
        ) : !negocio ? (
          <p className="text-sm text-neutral-400">Business not found.</p>
        ) : (
          <>
            {negocio.imagen_url ? (
              <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-800">
                <img
                  src={negocio.imagen_url}
                  alt=""
                  className="aspect-[21/9] w-full object-cover md:aspect-[3/1]"
                />
              </div>
            ) : null}
            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">{negocio.nombre}</h1>
              {negocio.zona_horaria && (
                <p className="mt-1 text-xs text-neutral-400">Timezone: {negocio.zona_horaria}</p>
              )}
              {(negocio.telefono || negocio.correo) && (
                <p className="mt-2 text-xs text-neutral-400">
                  {negocio.telefono && <span className="mr-3">Phone: {negocio.telefono}</span>}
                  {negocio.correo && <span>Email: {negocio.correo}</span>}
                </p>
              )}
            </header>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-neutral-50">Services</h2>
                <button
                  type="button"
                  onClick={goToBook}
                  className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-black hover:bg-neutral-200"
                  disabled={servicios.length === 0}
                >
                  {servicios.length === 0 ? "No services available" : "Book"}
                </button>
              </div>

              {servicios.length === 0 ? (
                <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-6 text-center text-sm text-neutral-400">
                  This business does not have services configured yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {servicios.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <ListingThumb url={s.imagen_url} label={s.nombre} size="lg" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-neutral-50">{s.nombre}</h3>
                            <p className="mt-1 text-xs text-neutral-400">
                              {s.duracion_min} min
                              {s.buffer_min != null && s.buffer_min > 0 ? ` + ${s.buffer_min} min buffer` : ""} · $
                              {s.precio}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-neutral-400">
                          {s.anticipo_tipo === "no_requiere"
                            ? "No deposit"
                            : s.anticipo_tipo === "fijo"
                            ? `Deposit: $${s.anticipo_valor}`
                            : `Deposit: ${s.anticipo_valor}%`}
                        </div>
                      </div>
                      {s.descripcion && (
                        <p className="mt-3 text-xs text-neutral-400">{s.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

