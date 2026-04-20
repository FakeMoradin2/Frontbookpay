"use client";

import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/contexts/LocaleContext";

type CompleteResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user_id?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function CompleteSetupLoading() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-sm text-neutral-400">{t("auth.complete.loading")}</p>
    </div>
  );
}

function CompleteSetupContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  if (!sessionId) {
    return (
      <div className="relative min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#060606] px-8 py-10 text-center">
          <h1 className="text-lg font-semibold">{t("auth.complete.invalidSession")}</h1>
          <p className="mt-2 text-sm text-neutral-400">{t("auth.complete.invalidSessionDesc")}</p>
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            {t("auth.complete.backPlans")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!API_URL) {
      toast.error(t("completeSetup.toast.api"));
      return;
    }

    if (!password || password.length < 6) {
      toast.error(t("completeSetup.toast.passwordShort"));
      return;
    }

    if (password !== password2) {
      toast.error(t("completeSetup.toast.passwordsMismatch"));
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/stripe/complete-admin-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          password,
        }),
      });

      const data: CompleteResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || t("auth.complete.errorGeneric"));
      }

      if (typeof window !== "undefined" && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
      }

      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknownGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#060606] px-8 py-10 shadow-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:underline">
            {t("common.brand")}
          </Link>
          <h1 className="mt-4 text-xl font-semibold">{t("auth.complete.title")}</h1>
          <p className="mt-1 text-sm text-neutral-400">{t("auth.complete.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="password">
              {t("common.password")}
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              minLength={6}
              placeholder={t("auth.complete.passwordMin")}
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
              placeholder={t("auth.complete.repeat")}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-neutral-50 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? t("auth.complete.processing") : t("auth.complete.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          <Link href="/" className="font-medium text-neutral-400 hover:underline">
            {t("common.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CompleteSetupPage() {
  return (
    <Suspense fallback={<CompleteSetupLoading />}>
      <CompleteSetupContent />
    </Suspense>
  );
}
