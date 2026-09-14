import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { syncCurrentUser } from "@/actions/users";
import { prisma } from "@/lib/prisma";
import { getPipelineTelemetry } from "@/lib/rag/observability/telemetry";
import { getEvaluationStats } from "@/actions/evaluation/get-evals";
import {
  FileText,
  MessageSquare,
  Search,
  ArrowRight,
  Upload,
  BarChart2,
  Layers,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { user, workspace } = await syncCurrentUser();

  // Fetch real workspace analytics
  const [documents, chunkCount, telemetry, evalStats] = await Promise.all([
    prisma.document.findMany({
      where: { workspaceId: workspace.id, isTrashed: false },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.chunk.count({
      where: { document: { workspaceId: workspace.id } },
    }),
    getPipelineTelemetry(workspace.id),
    getEvaluationStats(),
  ]);

  const totalTokens = documents.reduce((acc, d) => acc + (d.tokenCount ?? 0), 0);
  const completedDocs = documents.filter((d) => d.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-foreground">
              {workspace.name}
            </h1>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Workspace</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{user.name || user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/search">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </Button>
          </Link>

          <Link href="/dashboard/chat">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask question</span>
            </Button>
          </Link>

          <Link href="/dashboard/documents">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload file</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Documents</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold tracking-tight text-foreground">{documents.length}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {completedDocs} indexed and ready
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Indexed passages</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold tracking-tight text-foreground">{chunkCount}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Semantic chunks in Pinecone
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Indexed tokens</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Total token volume
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Grounded faithfulness</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {evalStats.avgFaithfulness > 0 ? `${evalStats.avgFaithfulness}%` : "Ready"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {evalStats.totalEvaluations > 0 ? `${evalStats.totalEvaluations} benchmarks logged` : "Evaluator active"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Documents */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b pb-3.5">
            <h2 className="text-sm font-semibold text-foreground">Recent documents</h2>
            <Link
              href="/dashboard/documents"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs text-muted-foreground">No documents in this workspace yet.</p>
              <Link href="/dashboard/documents" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="text-xs">
                  Upload your first file
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-muted/40 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{doc.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {doc.fileName} {doc.fileSize ? `· ${(doc.fileSize / 1024).toFixed(0)} KB` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        doc.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : doc.status === "PROCESSING"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc.status.toLowerCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
            <div className="mt-3.5 space-y-2">
              <Link
                href="/dashboard/documents"
                className="flex items-center justify-between p-2.5 rounded-md border border-border/80 bg-background hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Upload new document</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/chat"
                className="flex items-center justify-between p-2.5 rounded-md border border-border/80 bg-background hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Start conversation</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/search"
                className="flex items-center justify-between p-2.5 rounded-md border border-border/80 bg-background hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Search semantic vectors</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/evaluation"
                className="flex items-center justify-between p-2.5 rounded-md border border-border/80 bg-background hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">RAG benchmarks</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}