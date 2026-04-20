"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { useTranslation } from "@/contexts/LocaleContext";

type StaffMember = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  creado_en?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StaffPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const getToken = () =>
    typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  const fetchStaff = useCallback(async () => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/api/usuarios/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok || !Array.isArray(data?.data)) {
      throw new Error(data.error || t("staff.toast.loadFailed"));
    }
    setStaff(data.data);
  }, [t]);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchStaff();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fetchStaff, t]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    if (!nombre.trim() || !correo.trim() || !password.trim()) {
      toast.error(t("staff.toast.nameEmailPassword"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("staff.toast.passwordShort"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/admin/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim() || null,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || t("staff.toast.createFailed"));

      toast.success(t("staff.toast.created"));
      setNombre("");
      setCorreo("");
      setTelefono("");
      setPassword("");
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    if (!API_URL) return;
    const token = getToken();
    if (!token) return;

    setUpdatingId(member.id);
    try {
      const res = await fetch(`${API_URL}/api/usuarios/admin/staff/${member.id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activo: !member.activo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || t("staff.toast.updateFailed"));
      toast.success(!member.activo ? t("staff.toast.activated") : t("staff.toast.deactivated"));
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("staff.title")}</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">{t("staff.subtitle")}</p>
      </section>

      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] p-4 md:p-6"
      >
        <h2 className="mb-3 text-sm font-semibold text-neutral-100">{t("staff.form.title")}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t("staff.form.namePh")}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder={t("staff.form.emailPh")}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder={t("staff.form.phonePh")}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("staff.form.passwordPh")}
            autoComplete="new-password"
            inputClassName="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 py-2 pl-3 pr-10 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neutral-50 px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? t("staff.form.creating") : t("staff.form.submit")}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-400">{t("staff.loading")}</p>
      ) : staff.length === 0 ? (
        <p className="rounded-2xl border border-neutral-800 bg-[#060606] px-6 py-8 text-center text-sm text-neutral-400">
          {t("staff.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#060606] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-neutral-100">{member.nombre}</div>
                <div className="mt-1 text-xs text-neutral-400">
                  {member.correo}
                  {member.telefono ? ` · ${member.telefono}` : ""}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {t("staff.status")}{" "}
                  {member.activo ? t("staff.status.active") : t("staff.status.inactive")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleToggleActive(member)}
                disabled={updatingId === member.id}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  member.activo
                    ? "border-amber-700/70 text-amber-200 hover:bg-amber-950/30"
                    : "border-emerald-700/70 text-emerald-200 hover:bg-emerald-950/30"
                } disabled:opacity-50`}
              >
                {updatingId === member.id
                  ? t("staff.toggle.updating")
                  : member.activo
                    ? t("staff.toggle.deactivate")
                    : t("staff.toggle.activate")}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
