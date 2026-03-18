 "use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BienvenidaClientePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/client");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center">
      <p className="text-sm text-neutral-400">Redirecting...</p>
    </div>
  );
}

