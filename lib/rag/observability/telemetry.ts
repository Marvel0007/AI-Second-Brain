import "server-only";
import { prisma } from "@/lib/prisma";

export interface ObservabilityMetrics {
  totalQueries: number;
  successRate: number;
  avgTotalLatencyMs: number;
  avgRetrievalLatencyMs: number;
  avgRerankLatencyMs: number;
  avgLlmLatencyMs: number;
  totalTokensEstimated: number;
  recentLogs: {
    id: string;
    query: string;
    intent?: string | null;
    totalMs: number;
    retrievalMs?: number | null;
    rerankMs?: number | null;
    llmMs?: number | null;
    chunksRetrieved?: number | null;
    chunksReranked?: number | null;
    success: boolean;
    createdAt: Date;
  }[];
}

/**
 * Calculates aggregated RAG pipeline telemetry and latency breakdown for the current workspace.
 */
export async function getPipelineTelemetry(workspaceId: string): Promise<ObservabilityMetrics> {
  try {
    const logs = await prisma.pipelineLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (logs.length === 0) {
      return {
        totalQueries: 0,
        successRate: 100,
        avgTotalLatencyMs: 0,
        avgRetrievalLatencyMs: 0,
        avgRerankLatencyMs: 0,
        avgLlmLatencyMs: 0,
        totalTokensEstimated: 0,
        recentLogs: [],
      };
    }

  const successCount = logs.filter((l) => l.success).length;
  const successRate = Math.round((successCount / logs.length) * 1000) / 10;

  const totalLatencySum = logs.reduce((acc, l) => acc + l.totalMs, 0);
  const avgTotalLatencyMs = Math.round(totalLatencySum / logs.length);

  const retrievalLogs = logs.filter((l) => l.retrievalMs !== null);
  const avgRetrievalLatencyMs = retrievalLogs.length > 0
    ? Math.round(retrievalLogs.reduce((acc, l) => acc + (l.retrievalMs ?? 0), 0) / retrievalLogs.length)
    : 0;

  const rerankLogs = logs.filter((l) => l.rerankMs !== null);
  const avgRerankLatencyMs = rerankLogs.length > 0
    ? Math.round(rerankLogs.reduce((acc, l) => acc + (l.rerankMs ?? 0), 0) / rerankLogs.length)
    : 0;

  const llmLogs = logs.filter((l) => l.llmMs !== null);
  const avgLlmLatencyMs = llmLogs.length > 0
    ? Math.round(llmLogs.reduce((acc, l) => acc + (l.llmMs ?? 0), 0) / llmLogs.length)
    : 0;

  const totalTokensEstimated = logs.reduce(
    (acc, l) => acc + (l.promptTokens ?? 0) + (l.completionTokens ?? 0) + 1200,
    0
  );

    return {
      totalQueries: logs.length,
      successRate,
      avgTotalLatencyMs,
      avgRetrievalLatencyMs,
      avgRerankLatencyMs,
      avgLlmLatencyMs,
      totalTokensEstimated,
      recentLogs: logs.slice(0, 20).map((l) => ({
        id: l.id,
        query: l.query,
        intent: l.intent,
        totalMs: l.totalMs,
        retrievalMs: l.retrievalMs,
        rerankMs: l.rerankMs,
        llmMs: l.llmMs,
        chunksRetrieved: l.chunksRetrieved,
        chunksReranked: l.chunksReranked,
        success: l.success,
        createdAt: l.createdAt,
      })),
    };
  } catch (err) {
    console.warn("[Telemetry Fetch Error] Using empty defaults:", err);
    return {
      totalQueries: 0,
      successRate: 100,
      avgTotalLatencyMs: 0,
      avgRetrievalLatencyMs: 0,
      avgRerankLatencyMs: 0,
      avgLlmLatencyMs: 0,
      totalTokensEstimated: 0,
      recentLogs: [],
    };
  }
}
