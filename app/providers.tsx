"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/contexts/LocaleContext";

export function Providers({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
