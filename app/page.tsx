import Link from "next/link";
import {
  Brain,
  FileText,
  MessageSquare,
  Search,
  Upload,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[500px] w-[700px] rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-lg">BrainDock</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-20 text-center sm:pt-28 lg:pt-36">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered knowledge management
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Your second brain,
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground/70 to-foreground bg-clip-text text-transparent">
            powered by AI
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Upload documents, ask questions, and get instant, context-aware answers.
          BrainDock turns your knowledge base into an intelligent assistant.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 hover:shadow-lg sm:w-auto"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/sign-in"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-all hover:bg-muted sm:w-auto"
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 border-t border-border/50 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to manage knowledge
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              From document uploads to AI-powered conversations — all in one place.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Document Upload",
                description:
                  "Upload PDFs, text files, and more. We extract and chunk the content automatically.",
              },
              {
                icon: Search,
                title: "Semantic Search",
                description:
                  "Find information using natural language. Powered by vector embeddings for accurate results.",
              },
              {
                icon: MessageSquare,
                title: "AI Chat Assistant",
                description:
                  "Ask questions about your documents and get contextual answers with source citations.",
              },
              {
                icon: FileText,
                title: "Knowledge Base",
                description:
                  "Organize all your documents in one place. Track processing status and manage your library.",
              },
              {
                icon: Zap,
                title: "Instant Answers",
                description:
                  "Get fast, accurate responses powered by Groq LLMs and Pinecone vector search.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your data stays yours. Workspace isolation ensures only you can access your documents.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/10 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
                    <Icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-border/50">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Three simple steps to turn your documents into an AI-powered knowledge base.
            </p>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload",
                description: "Drop your PDFs and documents into BrainDock.",
              },
              {
                step: "02",
                title: "Process",
                description: "We chunk, embed, and index your content automatically.",
              },
              {
                step: "03",
                title: "Ask",
                description: "Chat with your documents and get cited answers instantly.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-sm font-bold text-muted-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 border-t border-border/50 bg-card/50">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Brain className="h-7 w-7" />
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to build your second brain?
          </h2>

          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Start uploading your documents and let AI do the heavy lifting.
          </p>

          <Link
            href="/sign-up"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 hover:shadow-lg"
          >
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>BrainDock</span>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BrainDock. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
