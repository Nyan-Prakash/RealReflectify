import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { getPersonDetails, getAllPeople } from "@/lib/db/queries/people";
import { PersonProfile } from "@/components/people/PersonProfile";
import Link from "next/link";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;
  const personData = await getPersonDetails(id, session.user.id);

  if (!personData) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-bg-secondary rounded-xl p-6">
            <h2 className="text-sm text-error">person not found</h2>
            <p className="mt-2 text-text-tertiary text-sm">
              this person doesn&apos;t exist or you don&apos;t have permission to view them.
            </p>
            <Link
              href="/people"
              className="mt-4 inline-block text-accent hover:text-accent-hover text-sm"
            >
              ← back to people
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get all people for merge functionality
  const allPeople = await getAllPeople(session.user.id);

  const { person, mentions, stats } = personData;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/people"
          className="inline-flex items-center text-sm text-accent hover:text-accent-hover mb-4"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          back to people
        </Link>

        {/* Person Profile with Merge Functionality */}
        <PersonProfile
          person={person}
          mentions={mentions}
          stats={stats}
          allPeople={allPeople.map((p) => ({
            id: p.id,
            canonicalName: p.canonicalName,
          }))}
        />
      </div>
    </div>
  );
}
