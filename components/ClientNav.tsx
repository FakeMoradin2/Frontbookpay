"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/client" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-neutral-100 text-black"
          : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function ClientNav() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
    }
    router.replace("/");
  };

  return (
    <header className="mb-6 rounded-2xl border border-neutral-800 bg-[#060606] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-50 hover:underline">Book&Pay</Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-neutral-700 px-3 py-1 text-[11px] bg-neutral-100 text-black hover:bg-gray-400"
        >
          Logout
        </button>
      </div>
      <nav className="mt-3 flex flex-wrap gap-2">
        <NavItem href="/client" label="Home" />
        <NavItem href="/businesses" label="Businesses" />
        <NavItem href="/client/reservations" label="My reservations" />
        <NavItem href="/client/profile" label="Profile" />
      </nav>
    </header>
  );
}

