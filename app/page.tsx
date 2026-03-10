"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type AuthResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user_id?: string;
  message?: string;
};

type MeResponse = {
  ok: boolean;
  user?: {
    rol?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL is not configured");
      return;
    }

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not sign in.");
      }

      if (typeof window !== "undefined") {
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
      }

      if (!API_URL) {
        router.push("/dashboard");
        return;
      }

      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        if (!meRes.ok) {
          router.push("/dashboard");
          return;
        }

        const meData: MeResponse = await meRes.json();

        if (meData.ok && meData.user?.rol === "cliente") {
          router.push("/bienvenida");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error signing in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      const {
        data: { url },
        error,
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error signing in with Google.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#060606] px-8 py-10 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">BookAndPay</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium">Sign in</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Administrator email and password
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-600/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm text-neutral-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="block text-sm text-neutral-300"
                htmlFor="password"
              >
                Password
              </label>
              <button
                type="button"
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Forgot your password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-500 focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-neutral-50 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs text-neutral-500">o</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-4 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#5f6368] bg-[#121212] px-5 text-sm font-medium text-[#e3e3e3] transition hover:bg-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.7h5.2c-.2 1.2-.8 2.2-1.7 2.9l2.7 2.1c1.6-1.5 2.5-3.7 2.5-6.3 0-.6-.1-1.1-.2-1.6H12z"
              />
              <path
                fill="#34A853"
                d="M6.6 14.3l-.9.7-2.2 1.7C5 19.4 8.2 21 12 21c2.6 0 4.8-.9 6.4-2.4l-2.7-2.1c-.7.5-1.6.9-2.7.9-2.1 0-3.9-1.4-4.6-3.3z"
              />
              <path
                fill="#4A90E2"
                d="M4.5 8.7 2.3 7C1.5 8.1 1 9.5 1 11s.5 2.9 1.3 4l3.3-2.6A4.8 4.8 0 0 1 5.8 12c0-.7.1-1.3.3-1.9z"
              />
              <path
                fill="#FBBC05"
                d="M12 4.8c1.4 0 2.7.5 3.7 1.4l2.7-2.6C16.8 2.1 14.6 1.2 12 1.2 8.2 1.2 5 2.8 2.8 5.3l3.3 2.6C6.8 6 8.6 4.8 12 4.8z"
              />
            </svg>
          </span>
          <span>Sign in with Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-neutral-200 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
