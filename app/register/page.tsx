"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/contexts/LocaleContext";

type RegisterResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!API_URL) {
      toast.error(t("errors.apiUrlMissing"));
      return;
    }

    if (!nombre || !email || !password || !password2) {
      toast.error(t("register.toast.fillAll"));
      return;
    }

    if (password !== password2) {
      toast.error(t("register.toast.passwordsMismatch"));
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email: email.trim().toLowerCase(),
          password,
          rol: "cliente",
        }),
      });

      const data: RegisterResponse = await res.json();

      if (!res.ok || !data.ok) {
        const msg =
          data.error ||
          (res.status === 409 ? t("auth.register.emailTaken") : t("auth.register.couldNotCreate"));
        throw new Error(msg);
      }

      if (!data.access_token) {
        toast.info(t("auth.register.checkEmail"));
        return;
      }

      if (typeof window !== "undefined") {
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
      }

      router.push("/client");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errors.unknownCreatingAccount");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-black/60 px-8 py-10 shadow-xl backdrop-blur">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:underline">
            {t("common.brand")}
          </Link>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{t("auth.register.title")}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {t("auth.register.subtitle")}{" "}
            <Link href="/pricing" className="font-medium text-neutral-200 hover:underline">
              {t("auth.register.viewPlans")}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="nombre">
              {t("auth.register.nameLabel")}
            </label>
            <input
              id="nombre"
              type="text"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder={t("auth.register.namePlaceholder")}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="email">
              {t("common.email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder={t("auth.register.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="password">
              {t("common.password")}
            </label>
            <PasswordInput
              id="password"
              placeholder={t("auth.register.passwordPlaceholder")}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="password2">
              {t("common.confirmPassword")}
            </label>
            <PasswordInput
              id="password2"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-neutral-50 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? t("auth.register.creating") : t("auth.register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-medium text-neutral-200 hover:underline">
            {t("common.signIn")}
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-neutral-500">
          <Link href="/" className="font-medium text-neutral-400 hover:underline">
            {t("common.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
