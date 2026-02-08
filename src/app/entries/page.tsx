import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { EntryForm } from "@/components/entries/EntryForm";
import { Timeline } from "@/components/entries/Timeline";
import { Navigation } from "@/components/layout/Navigation";

export default async function EntriesPage() {
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
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-text-primary">journal</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {session.user.email}
          </p>
        </div>

        <div className="mb-10">
          <EntryForm />
        </div>

        <Timeline />
      </div>
    </div>
  );
}
