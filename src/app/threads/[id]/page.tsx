import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/layout/Navigation";
import { ThreadDetailView } from "@/components/threads/ThreadDetailView";
import Link from "next/link";

export default async function ThreadDetailPage({
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/threads"
            className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
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
            back to threads
          </Link>
        </div>

        {/* Thread Detail */}
        <ThreadDetailView threadId={id} />
      </div>
    </div>
  );
}
