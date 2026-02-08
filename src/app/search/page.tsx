import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import { SearchPage } from "@/components/search/SearchPage";
import { Navigation } from "@/components/layout/Navigation";

export default async function Search() {
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
      <SearchPage />
    </div>
  );
}
