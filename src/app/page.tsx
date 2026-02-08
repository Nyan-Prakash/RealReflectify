import { createClient } from "@/lib/auth/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/entries");
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Nav */}
      <nav className="w-full px-8 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-accent font-mono text-lg tracking-tight font-semibold">
          reflectify
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
          >
            sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm text-bg-primary bg-accent hover:bg-accent-hover transition-colors px-5 py-2 rounded-lg font-medium"
          >
            get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-text-primary leading-tight tracking-tight">
            transform your thoughts
            <br />
            <span className="text-accent">into knowledge</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
            AI-powered journaling that extracts events, people, and insights 
            from your daily reflections. Search by meaning, not just keywords.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="px-8 py-3 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover transition-colors rounded-lg"
            >
              start writing
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-8 py-3 text-sm font-medium text-text-secondary border border-border hover:border-text-secondary hover:text-text-primary transition-colors rounded-lg"
            >
              sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-secondary rounded-xl p-6 group hover:bg-bg-tertiary transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-2">smart extraction</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI automatically identifies events, people, places, and activities from your entries.
            </p>
          </div>

          <div className="bg-bg-secondary rounded-xl p-6 group hover:bg-bg-tertiary transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-2">semantic search</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Find entries by meaning, not just keywords. Search works like your memory does.
            </p>
          </div>

          <div className="bg-bg-secondary rounded-xl p-6 group hover:bg-bg-tertiary transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-2">relationship tracking</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Discover patterns in your relationships and see how they evolve over time.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto px-8 pb-24">
        <h2 className="text-2xl font-semibold text-text-primary text-center mb-12 tracking-tight">
          how it works
        </h2>
        <div className="space-y-6">
          {[
            { step: "01", title: "write your thoughts", desc: "Journal naturally, just like you would in a notebook." },
            { step: "02", title: "AI processes your entry", desc: "Key information is extracted: events, people, places, and emotional context." },
            { step: "03", title: "review & refine", desc: "Check the extracted information. The AI learns from your feedback." },
            { step: "04", title: "discover insights", desc: "Search your past, track relationships, and see patterns emerge." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-6 group">
              <span className="font-mono text-sm text-accent mt-0.5 shrink-0">{item.step}</span>
              <div>
                <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-8 pb-24">
        <div className="bg-bg-secondary rounded-xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
            ready to start?
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Join and make your journals more meaningful with AI.
          </p>
          <Link
            href="/auth/sign-up"
            className="mt-6 inline-block px-8 py-3 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover transition-colors rounded-lg"
          >
            get started free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <span className="text-xs text-text-tertiary font-mono">reflectify</span>
      </footer>
    </div>
  );
}
