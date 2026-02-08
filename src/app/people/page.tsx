import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { getAllPeople } from "@/lib/db/queries/people";
import { PeopleGrid } from "@/components/people/PeopleGrid";
import { Navigation } from "@/components/layout/Navigation";

export default async function PeoplePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  const people = await getAllPeople(session.user.id);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-text-primary">people</h1>
          <p className="mt-1 text-sm text-text-secondary">
            everyone mentioned in your journal entries
          </p>
        </div>

        <PeopleGrid people={people} />
      </div>
    </div>
  );
}
