import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getEvaluationStats } from "@/actions/evaluation/get-evals";
import { getDocuments } from "@/actions/documents";
import { EvaluationDashboard } from "@/components/evaluation/evaluation-dashboard";

export default async function EvaluationPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [stats, documents] = await Promise.all([
    getEvaluationStats(),
    getDocuments(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>RAG Quality & Observability</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            RAG Triad Evaluation Suite
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuously evaluate Faithfulness (grounding), Answer Relevance, and Context Precision across queries.
          </p>
        </div>
      </div>

      <EvaluationDashboard stats={stats} documents={documents} />
    </div>
  );
}
