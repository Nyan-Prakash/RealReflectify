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
      <nav className="w-full px-8 py-5 flex items-center justify-between max-w-6xl mx-auto sticky top-0 z-50 backdrop-blur-sm bg-bg-primary/80 border-b border-border/30 animate-fade-in">
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
      <div className="relative overflow-hidden flex flex-col items-center justify-center px-4 py-20 sm:py-28">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/[0.03] rounded-full blur-3xl animate-float-slow pointer-events-none" />

        <div className="text-center max-w-2xl mx-auto relative">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary leading-[1.08] tracking-tight animate-fade-in-up">
            transform your thoughts
            <br />
            <span className="text-gradient-accent animate-shimmer">into knowledge</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-lg mx-auto leading-relaxed animate-fade-in-up delay-200">
            AI-powered journaling that extracts events, people, and insights
            from your daily reflections. Search by meaning, not just keywords.
          </p>
          <div className="mt-8 flex justify-center gap-4 animate-fade-in-up delay-400">
            <Link
              href="/auth/sign-up"
              className="px-7 py-3 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover transition-all rounded-lg animate-glow-pulse"
            >
              start writing
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-7 py-3 text-sm font-medium text-text-secondary border border-border hover:border-accent/40 hover:text-text-primary transition-all rounded-lg"
            >
              sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 py-20">
        <p className="text-center text-xs font-mono text-accent mb-10 tracking-[0.2em] uppercase animate-fade-in-up delay-500">
          features
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-bg-secondary rounded-xl p-6 border border-border card-glow animate-fade-in-scale delay-500">
            <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-1.5">smart extraction</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI automatically identifies events, people, places, and activities from your entries.
            </p>
          </div>

          <div className="bg-bg-secondary rounded-xl p-6 border border-border card-glow animate-fade-in-scale delay-600">
            <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-1.5">semantic search</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Find entries by meaning, not just keywords. Search works like your memory does.
            </p>
          </div>

          <div className="bg-bg-secondary rounded-xl p-6 border border-border card-glow animate-fade-in-scale delay-700">
            <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-1.5">relationship tracking</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Discover patterns in your relationships and see how they evolve over time.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* How it works */}
      <div className="max-w-2xl mx-auto px-8 py-20">
        <p className="text-center text-xs font-mono text-accent mb-3 tracking-[0.2em] uppercase animate-fade-in-up delay-600">
          process
        </p>
        <h2 className="text-2xl font-semibold text-text-primary text-center mb-10 tracking-tight animate-fade-in-up delay-700">
          how it works
        </h2>
        <div className="space-y-6 timeline-line">
          {[
            { step: "01", title: "write your thoughts", desc: "Journal naturally, just like you would in a notebook. Voice or text." },
            { step: "02", title: "AI processes your entry", desc: "Key information is extracted: events, people, places, and emotional context." },
            { step: "03", title: "review & refine", desc: "Check the extracted information. The AI learns from your feedback." },
            { step: "04", title: "discover insights", desc: "Search your past, track relationships, and see patterns emerge." },
          ].map((item, index) => (
            <div key={item.step} className="flex items-start gap-6 group animate-fade-in-up" style={{ animationDelay: `${700 + index * 120}ms` }}>
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full border-2 border-accent/30 flex items-center justify-center bg-bg-secondary group-hover:border-accent/60 group-hover:bg-accent/10 transition-all duration-300">
                  <span className="font-mono text-xs text-accent font-bold">{item.step}</span>
                </div>
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-8 py-20">
        <div className="relative rounded-2xl p-px bg-gradient-to-b from-accent/30 to-transparent animate-fade-in-up delay-900">
          <div className="bg-bg-secondary rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
                ready to start?
              </h2>
              <p className="mt-3 text-sm text-text-secondary">
                Join and make your journals more meaningful with AI.
              </p>
              <Link
                href="/auth/sign-up"
                className="mt-6 inline-block px-8 py-3 text-sm font-medium text-bg-primary bg-accent hover:bg-accent-hover transition-all rounded-lg animate-glow-pulse"
              >
                get started free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center animate-fade-in delay-1000">
        <span className="text-xs text-text-tertiary font-mono">reflectify</span>
      </footer>
    </div>
  );
}
