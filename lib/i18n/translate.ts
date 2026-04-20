import type { Locale } from "./types";
import { en } from "./en";
import { es } from "./es";

const tables: Record<Locale, Record<string, string>> = { en, es };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  let raw = tables[locale][key] ?? tables.en[key] ?? key;
  if (vars) {
    raw = raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  }
  return raw;
}
