"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth/supabase-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to entries page after successful sign-in
      router.push("/entries");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl text-text-primary">
            welcome back to reflectify
          </h2>
          <p className="mt-2 text-center text-sm text-text-tertiary">
            sign in to continue your journaling journey
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          {error && (
            <div className="rounded-lg bg-error/10 p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-secondary text-text-primary border-none rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-secondary text-text-primary border-none rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm text-bg-primary bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-text-tertiary">
              don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-accent hover:text-accent-hover"
              >
                sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
