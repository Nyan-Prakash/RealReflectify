import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { getEntryWithExtractions } from "@/lib/db/queries/entries";
import { getParseRunHistory } from "@/lib/db/queries/extraction";
import { EntryDetail } from "@/components/entries/EntryDetail";
import Link from "next/link";

export default async function EntryDetailPage({
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
  const entryData = await getEntryWithExtractions(id, session.user.id);

  // Fetch parse history for this entry
  const parseHistory = entryData ? await getParseRunHistory(id, session.user.id) : [];

  if (!entryData) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-bg-secondary rounded-xl p-6">
            <h2 className="text-sm text-error">entry not found</h2>
            <p className="mt-2 text-text-tertiary text-sm">
              this entry doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link
              href="/entries"
              className="mt-4 inline-block text-accent hover:text-accent-hover text-sm"
            >
              ← back to entries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/entries"
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
          back to entries
        </Link>

        {/* Entry Detail */}
        <EntryDetail data={{ ...entryData, parseHistory }} />
      </div>
    </div>
  );
}
