import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/layout/Navigation";
import { ThreadsList } from "@/components/threads/ThreadsList";

export default async function ThreadsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl text-text-primary">threads</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            group related journal entries into story arcs and themes.
          </p>
        </div>

        {/* Threads List */}
        <ThreadsList />
      </div>
    </div>
  );
}
