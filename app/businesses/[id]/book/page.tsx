"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import ListingThumb from "@/components/ListingThumb";

type Servicio = {
  id: string;
  nombre: string;
  duracion_min: number;
  buffer_min: number | null;
  precio: number;
  imagen_url?: string | null;
  anticipo_tipo: "fijo" | "porcentaje" | "no_requiere";
  anticipo_valor: number | null;
};

type StaffMember = {
  id: string;
  nombre: string;
};

type ServiciosResponse = {
  ok: boolean;
  data?: Servicio[];
  error?: string;
};

type CreateReservaPayload = {
  reserva?: { id: string };
  can_pay_deposit_online?: boolean;
  deposit_amount?: number;
};

type ReservaResponse = {
  ok: boolean;
  data?: CreateReservaPayload;
  error?: string;
};

type DepositCheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

type DisponibilidadResponse = {
  ok: boolean;
  data?: {
    slots: Array<{
      label: string;
      start_iso: string;
      end_iso: string;
      block_key: string;
      block_start: string;
      block_end: string;
    }>;
    occupied_minutes: number;
  };
  error?: string;
};

type FechasDisponiblesResponse = {
  ok: boolean;
  data?: {
    dates: Array<{ date: string; weekday: string; slots_count: number }>;
    occupied_minutes: number;
  };
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function computeServiceDeposit(s: Servicio): number {
  if (s.anticipo_tipo === "no_requiere") return 0;
  if (!s.anticipo_valor) return 0;
  if (s.anticipo_tipo === "fijo") return Number(s.anticipo_valor);
  const pct = Number(s.anticipo_valor);
  return (Number(s.precio) * pct) / 100;
}

export default function BusinessBookPage() {
  const params = useParams();
  const router = useRouter();
  const negocioId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Servicio[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState<
    Array<{ date: string; weekday: string; slots_count: number }>
  >([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedSlotStart, setSelectedSlotStart] = useState("");
  const [selectedSlotEnd, setSelectedSlotEnd] = useState("");
  const [availableSlots, setAvailableSlots] = useState<
    Array<{
      label: string;
      start_iso: string;
      end_iso: string;
      block_key: string;
      block_start: string;
      block_end: string;
    }>
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [occupiedMinutes, setOccupiedMinutes] = useState<number>(0);
  const [note, setNote] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const hasStaff = staff.length > 0;
  const hasClientSession =
    typeof window !== "undefined" && !!window.localStorage.getItem("access_token");

  const groupedDates = useMemo(() => {
    const groups: Record<string, Array<{ date: string; weekday: string; slots_count: number }>> = {};
    for (const d of availableDates) {
      const dateObj = new Date(`${d.date}T00:00:00`);
      const monthKey = dateObj.toLocaleDateString([], { month: "long", year: "numeric" });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(d);
    }
    return Object.entries(groups);
  }, [availableDates]);

  const groupedSlotsByBlock = useMemo(() => {
    const groups: Record<
      string,
      {
        block_key: string;
        block_start: string;
        block_end: string;
        slots: Array<{
          label: string;
          start_iso: string;
          end_iso: string;
          block_key: string;
          block_start: string;
          block_end: string;
        }>;
      }
    > = {};

    for (const slot of availableSlots) {
      if (!groups[slot.block_key]) {
        groups[slot.block_key] = {
          block_key: slot.block_key,
          block_start: slot.block_start,
          block_end: slot.block_end,
          slots: [],
        };
      }
      groups[slot.block_key].slots.push(slot);
    }

    return Object.values(groups).sort((a, b) => (a.block_start < b.block_start ? -1 : 1));
  }, [availableSlots]);

  useEffect(() => {
    const load = async () => {
      if (!API_URL || !negocioId) {
        toast.error("Missing API URL or business id.");
        setLoading(false);
        return;
      }
      try {
        const [servRes, staffRes] = await Promise.all([
          fetch(`${API_URL}/api/servicios?negocio_id=${negocioId}`),
          fetch(`${API_URL}/api/usuarios/public/staff?negocio_id=${negocioId}`),
        ]);
        const data: ServiciosResponse = await servRes.json();
        const staffData = await staffRes.json().catch(() => ({}));
        if (!servRes.ok || !data.ok || !Array.isArray(data.data)) {
          throw new Error(data.error || "Could not load services.");
        }
        setServices(data.data);
        if (!staffRes.ok || !staffData?.ok || !Array.isArray(staffData?.data)) {
          throw new Error(staffData.error || "Could not load staff.");
        }
        setStaff(staffData.data);
        setSelectedStaffId(staffData.data[0]?.id || "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error loading services.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [negocioId]);

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSelectedDate("");
    setAvailableDates([]);
    setSelectedSlotStart("");
    setSelectedSlotEnd("");
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));

  const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.precio || 0), 0);
  const totalDeposit = selectedServices.reduce(
    (acc, s) => acc + computeServiceDeposit(s),
    0
  );
  const remaining = Math.max(totalPrice - totalDeposit, 0);

  useEffect(() => {
    const fetchDates = async () => {
      if (!API_URL || !negocioId || selectedIds.length === 0) {
        setAvailableDates([]);
        setSelectedDate("");
        return;
      }

      setLoadingDates(true);
      try {
        const params = new URLSearchParams({
          negocio_id: negocioId,
          servicio_ids: selectedIds.join(","),
          days: "45",
        });
        if (selectedStaffId) params.set("staff_id", selectedStaffId);
        const res = await fetch(`${API_URL}/api/reservas/public/fechas-disponibles?${params.toString()}`);
        const data: FechasDisponiblesResponse = await res.json();
        if (!res.ok || !data.ok || !data.data) {
          throw new Error(data.error || "Could not load available dates.");
        }
        const dates = data.data.dates || [];
        setAvailableDates(dates);

        if (dates.length > 0) {
          setSelectedDate((prev) => {
            const exists = dates.some((d) => d.date === prev);
            return exists ? prev : dates[0].date;
          });
        } else {
          setSelectedDate("");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error loading dates.");
        setAvailableDates([]);
        setSelectedDate("");
      } finally {
        setLoadingDates(false);
      }
    };

    void fetchDates();
  }, [negocioId, selectedIds, selectedStaffId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!API_URL || !negocioId || selectedIds.length === 0 || !selectedDate) {
        setAvailableSlots([]);
        setSelectedSlotStart("");
        setSelectedSlotEnd("");
        return;
      }
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          negocio_id: negocioId,
          fecha: selectedDate,
          servicio_ids: selectedIds.join(","),
        });
        if (selectedStaffId) params.set("staff_id", selectedStaffId);
        const res = await fetch(`${API_URL}/api/reservas/public/disponibilidad?${params.toString()}`);
        const data: DisponibilidadResponse = await res.json();
        if (!res.ok || !data.ok || !data.data) {
          throw new Error(data.error || "Could not load available slots.");
        }
        setAvailableSlots(data.data.slots || []);
        setOccupiedMinutes(Number(data.data.occupied_minutes || 0));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error loading slots.");
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    void fetchSlots();
  }, [negocioId, selectedDate, selectedIds, selectedStaffId]);

  const executeCreateReservation = async () => {
    if (!API_URL || !negocioId) {
      toast.error("API URL is not configured.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("access_token")
        : null;

    setSubmitting(true);
    try {
      const body = {
        negocio_id: negocioId,
        inicio_en: selectedSlotStart,
        nota: note || null,
        servicios: selectedIds.map((id) => ({ servicio_id: id, cantidad: 1 })),
      };
      if (selectedStaffId) {
        Object.assign(body, { staff_id: selectedStaffId });
      }

      let res: Response;
      if (token) {
        res = await fetch(`${API_URL}/api/reservas/cliente/reservas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        const publicBody = {
          ...body,
          cliente_nombre: guestName.trim() || undefined,
          cliente_correo: guestEmail.trim().toLowerCase() || undefined,
          cliente_telefono: guestPhone.trim() || undefined,
        };
        res = await fetch(`${API_URL}/api/reservas/public/reservas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(publicBody),
        });
      }

      const data: ReservaResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not create reservation.");
      }

      const payload = data.data;
      const reservaId = payload?.reserva?.id;
      const canPayOnline = !!payload?.can_pay_deposit_online && !!reservaId;

      if (canPayOnline) {
        const payEndpoint = token
          ? `${API_URL}/api/stripe/deposit-checkout`
          : `${API_URL}/api/stripe/deposit-checkout-public`;
        const payRes = await fetch(payEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reserva_id: reservaId }),
        });
        const payData: DepositCheckoutResponse = await payRes.json().catch(() => ({}));
        if (payRes.ok && payData.ok && typeof payData.url === "string") {
          window.location.href = payData.url;
          return;
        }
        toast.warning(
          payData.error ||
            "Your reservation was created but the card payment page could not be opened. You can review it under My reservations."
        );
        toast.success("Reservation saved as pending payment.");
        setTimeout(() => {
          router.push("/client/reservations");
        }, 2800);
        return;
      }

      toast.success(
        token
          ? "Reservation created. You can review it in your client space."
          : "Reservation created successfully. The business will contact you with the details."
      );
      setTimeout(() => {
        router.push(token ? "/client/reservations" : `/businesses/${negocioId}`);
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error creating reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!API_URL || !negocioId) {
      toast.error("API URL is not configured.");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one service.");
      return;
    }

    if (!selectedSlotStart) {
      toast.error("Please choose one available time slot.");
      return;
    }

    if (!hasClientSession && !guestName.trim()) {
      toast.error("Please enter your name to continue.");
      return;
    }
    if (!hasClientSession && !guestPhone.trim()) {
      toast.error("Please enter your phone number to continue.");
      return;
    }

    await executeCreateReservation();
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

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create reservation</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Select services and then pick one available start time. End time is calculated automatically.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-neutral-400">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-6 text-center text-sm text-neutral-400">
            This business does not have services available.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-neutral-50">Staff member</h2>
              <p className="text-xs text-neutral-500">
                {hasStaff
                  ? "Choose a specific staff member or leave as any available."
                  : "This business currently books without specific staff assignment."}
              </p>
              {staff.length === 0 ? (
                <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-4 py-3 text-xs text-neutral-400">
                  No active staff found. Booking will use the general availability flow.
                </p>
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setSelectedDate("");
                    setAvailableDates([]);
                    setSelectedSlotStart("");
                    setSelectedSlotEnd("");
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                >
                  <option value="">Any available staff</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.nombre}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-50">Services</h2>
              <div className="space-y-2">
                {services.map((s) => {
                  const checked = selectedIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${
                        checked
                          ? "border-neutral-200 bg-neutral-900"
                          : "border-neutral-800 bg-[#060606] hover:border-neutral-600 hover:bg-[#090909]"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0"
                          checked={checked}
                          onChange={() => toggleService(s.id)}
                        />
                        <ListingThumb url={s.imagen_url} label={s.nombre} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-50">
                            {s.nombre}
                          </div>
                          <div className="mt-1 text-xs text-neutral-400">
                            {s.duracion_min} min + {s.buffer_min ?? 0} min buffer · ${s.precio}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400">
                        {s.anticipo_tipo === "no_requiere"
                          ? "No deposit"
                          : s.anticipo_tipo === "fijo"
                          ? `Deposit: $${s.anticipo_valor}`
                          : `Deposit: ${s.anticipo_valor}%`}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-neutral-800 bg-[#060606] p-4">
                <div className="mb-2 text-sm font-medium text-neutral-100">Choose date</div>
                <p className="mb-3 text-xs text-neutral-500">
                  Only dates with valid availability are shown.
                </p>

                {loadingDates ? (
                  <p className="text-xs text-neutral-400">Loading available dates...</p>
                ) : selectedIds.length === 0 ? (
                  <p className="text-xs text-neutral-500">Select at least one service to see available dates.</p>
                ) : availableDates.length === 0 ? (
                  <p className="text-xs text-neutral-500">No dates available for selected services.</p>
                ) : (
                  <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                    {groupedDates.map(([monthLabel, dates]) => (
                      <div key={monthLabel}>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          {monthLabel}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {dates.map((d) => {
                            const active = selectedDate === d.date;
                            const label = new Date(`${d.date}T00:00:00`).toLocaleDateString([], {
                              weekday: "short",
                              day: "numeric",
                            });
                            return (
                              <button
                                key={d.date}
                                type="button"
                                onClick={() => {
                                  setSelectedDate(d.date);
                                  setSelectedSlotStart("");
                                  setSelectedSlotEnd("");
                                }}
                                className={`rounded-lg border px-3 py-2 text-left transition ${
                                  active
                                    ? "border-neutral-200 bg-neutral-100 text-black"
                                    : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                                }`}
                              >
                                <div className="text-xs font-medium">{label}</div>
                                <div className={`text-[11px] ${active ? "text-neutral-700" : "text-neutral-400"}`}>
                                  {d.slots_count} slots
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-[#060606] p-4">
                <div className="mb-2 text-sm font-medium text-neutral-100">Available start times</div>
                <p className="mb-3 text-xs text-neutral-500">
                  {selectedDate
                    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })
                    : "Pick a date first"}
                </p>

                {loadingSlots ? (
                  <p className="text-xs text-neutral-400">Loading available slots...</p>
                ) : !selectedDate || selectedIds.length === 0 ? (
                  <p className="text-xs text-neutral-500">Select services and date to view availability.</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-neutral-500">No slots available for this date.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="space-y-3">
                      {groupedSlotsByBlock.map((group) => (
                        <div key={group.block_key} className="rounded-xl border border-neutral-800 bg-[#050505] p-2.5">
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Block {group.block_start} - {group.block_end}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {group.slots.map((slot) => {
                              const active = selectedSlotStart === slot.start_iso;
                              return (
                                <button
                                  key={slot.start_iso}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlotStart(slot.start_iso);
                                    setSelectedSlotEnd(slot.end_iso);
                                  }}
                                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                                    active
                                      ? "border-neutral-200 bg-neutral-100 text-black"
                                      : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                                  }`}
                                >
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSlotEnd ? (
                  <p className="mt-3 text-xs text-neutral-400">
                    Estimated end time:{" "}
                    {new Date(selectedSlotEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {occupiedMinutes > 0 ? ` (${occupiedMinutes} min total)` : ""}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-1.5">
              {!hasClientSession ? (
                <div className="mb-4 rounded-2xl border border-neutral-800 bg-[#060606] p-4">
                  <h2 className="text-sm font-medium text-neutral-50">Your details</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    We use this information to confirm your reservation even if you do not have an account.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Full name *"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      required={!hasClientSession}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500 sm:col-span-2"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
              <label className="block text-sm text-neutral-300" htmlFor="note">
                Note for the business (optional)
              </label>
              <textarea
                id="note"
                rows={3}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-4 text-sm text-neutral-200">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                <span>Deposit</span>
                <span>${totalDeposit.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                <span>Remaining at the business</span>
                <span>${remaining.toFixed(2)}</span>
              </div>
            </section>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-10 items-center justify-center rounded-lg bg-neutral-50 px-6 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Confirm reservation"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

