"use client";

import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { useTranslation } from "@/contexts/LocaleContext";

const defaultInputClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900/60 py-2 pl-3 pr-10 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500";

export type PasswordInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "className"
> & {
  /** Contenedor relativo del campo y el botón del ojo. */
  className?: string;
  /** Clases del `<input>` (por defecto tema oscuro del proyecto). */
  inputClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, inputClassName, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    return (
      <div className={`relative ${className ?? ""}`}>
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={inputClassName ?? defaultInputClass}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
          aria-label={visible ? t("password.hide") : t("password.show")}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    );
  }
);

function IconEye() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.7 5.7A10.3 10.3 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-4.8 5.4M6.3 6.3A18.3 18.3 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
