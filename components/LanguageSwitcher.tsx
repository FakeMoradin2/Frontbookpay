"use client";

import { useTranslation } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  className?: string;
  variant?: "toolbar" | "minimal";
};

export function LanguageSwitcher({ className = "", variant = "toolbar" }: Props) {
  const { locale, setLocale, t } = useTranslation();

  const base =
    variant === "minimal"
      ? "inline-flex items-center gap-0.5 text-[11px]"
      : "inline-flex items-center gap-0.5 rounded-lg border border-neutral-700/90 bg-neutral-900/40 p-0.5 text-xs";

  const btn = (code: Locale) =>
    `rounded-md px-2 py-1 font-medium transition ${
      locale === code
        ? "bg-neutral-100 text-black"
        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
    }`;

  return (
    <div className={`${base} ${className}`} role="group" aria-label={t("common.language")}>
      <button type="button" className={btn("en")} onClick={() => setLocale("en")}>
        {t("common.localeEn")}
      </button>
      <button type="button" className={btn("es")} onClick={() => setLocale("es")}>
        {t("common.localeEs")}
      </button>
    </div>
  );
}
