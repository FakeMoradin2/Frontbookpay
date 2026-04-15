"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      richColors
      closeButton
      expand={false}
      gap={10}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "group border border-neutral-700/90 !bg-neutral-950/95 !text-neutral-100 shadow-xl shadow-black/50 backdrop-blur-md",
          title: "!text-neutral-100 !font-medium",
          description: "!text-neutral-400 !text-sm",
          actionButton: "!bg-neutral-100 !text-neutral-950 !font-medium",
          cancelButton: "!border-neutral-600 !text-neutral-300",
          closeButton: "!border-neutral-700 !bg-neutral-900 !text-neutral-400 hover:!text-neutral-100",
          success: "!border-emerald-800/70",
          error: "!border-red-800/70",
          warning: "!border-amber-800/70",
          info: "!border-sky-800/70",
        },
      }}
    />
  );
}
