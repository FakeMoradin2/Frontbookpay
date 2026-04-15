"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Pago = {
  id: string;
  tipo: string;
  monto: number;
  moneda: string;
  metodo: string;
  estado: string;
  referencia: string | null;
  creado_en: string;
  reserva_id: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeChargesEnabled, setStripeChargesEnabled] = useState(false);
  const [stripeDetailsSubmitted, setStripeDetailsSubmitted] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const fetchPagos = async () => {
    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;
    const res = await fetch(`${API_URL}/api/pagos/admin/pagos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load payments");
    setPagos(Array.isArray(data.data) ? data.data : []);
  };

  const fetchNegocioStripe = useCallback(async () => {
    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;
    const res = await fetch(`${API_URL}/api/negocios/admin/negocio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.data) return;
    const n = data.data;
    setStripeAccountId(
      typeof n.stripe_connect_account_id === "string" && n.stripe_connect_account_id
        ? n.stripe_connect_account_id
        : null
    );
    setStripeChargesEnabled(!!n.stripe_connect_charges_enabled);
    setStripeDetailsSubmitted(!!n.stripe_connect_details_submitted);
  }, []);

  const syncConnectStatus = useCallback(async () => {
    if (!API_URL || typeof window === "undefined") return false;
    const token = window.localStorage.getItem("access_token");
    if (!token) return false;
    const res = await fetch(`${API_URL}/api/stripe/connect/sync-status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    return !!(res.ok && data.ok);
  }, []);

  const handleConnectStripe = async () => {
    if (!API_URL || typeof window === "undefined") return;
    const token = window.localStorage.getItem("access_token");
    if (!token) return;
    setConnectLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stripe/connect/account-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || typeof data.url !== "string") {
        throw new Error(data.error || "Could not start Stripe Connect");
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Stripe Connect error");
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!API_URL || typeof window === "undefined") return;
      const token = window.localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      let admin = false;
      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json().catch(() => ({}));
        admin = !!(meRes.ok && meData.ok && meData.user?.rol === "admin");
        setIsAdmin(admin);

        const params = new URLSearchParams(window.location.search);
        const connect = params.get("connect");

        if (admin) {
          await fetchNegocioStripe();
          if (connect === "return") {
            const synced = await syncConnectStatus().catch(() => false);
            toast.info(
              synced
                ? "Stripe account status updated."
                : "You returned from Stripe. If payouts are not active yet, finish any pending steps in the Stripe form."
            );
            window.history.replaceState({}, "", "/dashboard/payments");
            await fetchNegocioStripe();
          } else if (connect === "refresh") {
            toast.warning("The Stripe link expired. Use the button below to open a new one.");
            window.history.replaceState({}, "", "/dashboard/payments");
          }
        } else if (connect === "return" || connect === "refresh") {
          window.history.replaceState({}, "", "/dashboard/payments");
        }
      } catch {
        /* role / stripe extras are optional */
      }

      try {
        await fetchPagos();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchNegocioStripe, syncConnectStatus]);

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Payments</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">
          Configure card deposits and review payment records for your bookings.
        </p>
      </section>

      {isAdmin ? (
        <div className="mb-6 max-w-2xl space-y-3 rounded-xl border border-violet-900/40 bg-violet-950/15 p-4">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">Online deposits (Stripe)</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Connect Stripe so clients can pay the reservation deposit by card. Funds go to your connected account;
              the platform may charge a small application fee.
            </p>
          </div>
          <div className="text-xs text-neutral-400">
            {stripeChargesEnabled ? (
              <span className="text-emerald-300">Stripe is connected and can charge deposits.</span>
            ) : stripeAccountId ? (
              <span>
                Account created
                {stripeDetailsSubmitted ? " — details submitted" : ""}. Finish onboarding in Stripe to enable
                charges.
              </span>
            ) : (
              <span>Not connected yet.</span>
            )}
          </div>
          <button
            type="button"
            disabled={connectLoading}
            onClick={() => void handleConnectStripe()}
            className="rounded-lg bg-[#635bff] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#5851ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connectLoading ? "Opening Stripe…" : stripeChargesEnabled ? "Update Stripe account" : "Connect Stripe"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading payments...</p>
      ) : pagos.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          No payments found yet.
        </p>
      ) : (
        <div className="space-y-3">
          {pagos.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-neutral-50">
                    {p.tipo} · {p.metodo}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Amount: {p.moneda.toUpperCase()} {Number(p.monto || 0).toFixed(2)} · Status: {p.estado}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Reservation: {p.reserva_id} · Created: {new Date(p.creado_en).toLocaleString()}
                    {p.referencia ? ` · Ref: ${p.referencia}` : ""}
                  </div>
                </div>
                <span className="rounded-full border border-neutral-700 px-2 py-1 text-[11px] text-neutral-300">
                  {p.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
