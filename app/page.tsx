import Link from "next/link";
import {
  Brain,
  FileText,
  MessageSquare,
  Search,
  Upload,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* Header */}
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Brain className="h-4 w-4" />
            </div>
            <span>BrainDock</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.15]">
            A private knowledge base that answers with proof.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload PDFs, Markdown files, or source code. BrainDock parses your library and generates answers backed by direct citations to the original text.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:w-auto"
            >
              Create free workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/sign-in"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 sm:w-auto"
            >
              Sign in to workspace
            </Link>
          </div>
        </section>

        {/* Live Interface Preview */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {/* Window bar */}
            <div className="flex h-9 items-center border-b border-border bg-muted/30 px-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>
              <span className="mx-auto text-[11px] text-muted-foreground font-medium">
                braindock.internal / workspace / research-notes
              </span>
            </div>

            {/* Content Preview */}
            <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
              {/* Left Column: Source Document */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Q4-Strategy.pdf (Page 4)</span>
                </div>
                <div className="space-y-2 text-xs leading-relaxed text-muted-foreground/90 font-mono bg-muted/20 p-3.5 rounded-lg border border-border/50">
                  <p>...our enterprise retention grew to 94.2% following the implementation of localized data indexing.</p>
                  <p className="bg-primary/10 text-foreground p-1 rounded font-medium">
                    &quot;Primary factor: retrieval latency dropped from 1,200ms to 320ms with hybrid search.&quot;
                  </p>
                  <p>Budget allocation for vector infrastructure was capped at $1,400 monthly...</p>
                </div>
              </div>

              {/* Right Column: Grounded Answer */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Workspace query</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-2">
                    &quot;What drove our enterprise retention improvement in Q4?&quot;
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Retention rose to 94.2% primarily because retrieval latency fell from 1,200ms to 320ms after deploying hybrid search.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Verified citation: Page 4
                  </span>
                  <span>100% grounded</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Overview */}
        <section className="border-t border-border bg-muted/15 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Built for reliability, not conversation filler.
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Core properties that keep your research structured and verifiable.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5">
                <Upload className="h-4 w-4 text-foreground mb-3" />
                <h3 className="text-sm font-semibold">Multi-format ingestion</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Upload PDFs, Markdown documents, source code, and CSVs. Text is extracted with structure and page numbers preserved.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <Search className="h-4 w-4 text-foreground mb-3" />
                <h3 className="text-sm font-semibold">Hybrid vector retrieval</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Combines semantic dense embeddings with exact keyword matches and reranking to pinpoint relevant passages.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <ShieldCheck className="h-4 w-4 text-foreground mb-3" />
                <h3 className="text-sm font-semibold">Workspace isolation</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Documents and vectors are segregated by user workspace. Queries never leak across organization boundaries.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background">
              <Brain className="h-3 w-3" />
            </div>
            <span className="font-semibold text-foreground">BrainDock</span>
          </div>

          <p>Personal knowledge workspace.</p>
        </div>
      </footer>
    </div>
  );
}
