"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth/supabase-client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      // Redirect to entries page after successful sign-up
      setTimeout(() => {
        router.push("/entries");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="rounded-xl bg-success/10 p-6">
            <h3 className="text-lg text-success">
              account created successfully!
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              check your email to confirm your account. redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl text-text-primary">
            start your reflection journey
          </h2>
          <p className="mt-2 text-center text-sm text-text-tertiary">
            create an account to begin journaling with ai
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="rounded-lg bg-error/10 p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full name
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-secondary text-text-primary border-none rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="full name"
              />
            </div>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-secondary text-text-primary border-none rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="password (min 6 characters)"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm text-bg-primary bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "creating account..." : "sign up"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-text-tertiary">
              already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-accent hover:text-accent-hover"
              >
                sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
