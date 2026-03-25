"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL is not configured");
      return;
    }

    if (!nombre || !email || !password || !password2) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== password2) {
      setError("Passwords do not match.");
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
          (res.status === 409
            ? "This email is already registered. Sign in or use a different email."
            : "Could not create account.");
        throw new Error(msg);
      }

      if (!data.access_token) {
        setError(
          "Account created. Please check your email to confirm your address, then sign in."
        );
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
        err instanceof Error ? err.message : "Unknown error creating account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-black/60 px-8 py-10 shadow-xl backdrop-blur">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight hover:underline">
            Book&Pay
          </Link>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Create account (Client)</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Sign up free to book appointments. Need an admin panel?{" "}
            <Link href="/pricing" className="font-medium text-neutral-200 hover:underline">
              View plans
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="nombre">
              Name
            </label>
            <input
              id="nombre"
              type="text"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder="Your name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-sm text-neutral-300"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-sm text-neutral-300"
              htmlFor="password2"
            >
              Confirm password
            </label>
            <input
              id="password2"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-neutral-50 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create free account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-200 hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-neutral-500">
          <Link href="/" className="font-medium text-neutral-400 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

