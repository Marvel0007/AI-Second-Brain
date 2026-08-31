"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

export async function getEvaluationStats() {
  try {
    const workspace = await requireCurrentWorkspace();

    const evaluations = await prisma.ragEvaluation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        document: {
          select: {
            title: true,
            fileName: true,
          },
        },
      },
    });

    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        avgFaithfulness: 0,
        avgRelevance: 0,
        avgContextPrecision: 0,
        avgLatencyMs: 0,
        evaluations: [],
      };
    }

    const validFaithfulness = evaluations.filter((e) => e.faithfulnessScore !== null);
    const avgFaithfulness = validFaithfulness.length > 0
      ? validFaithfulness.reduce((acc, e) => acc + (e.faithfulnessScore ?? 0), 0) / validFaithfulness.length
      : 0;

    const validRelevance = evaluations.filter((e) => e.answerRelevanceScore !== null);
    const avgRelevance = validRelevance.length > 0
      ? validRelevance.reduce((acc, e) => acc + (e.answerRelevanceScore ?? 0), 0) / validRelevance.length
      : 0;

    const validPrecision = evaluations.filter((e) => e.contextPrecisionScore !== null);
    const avgContextPrecision = validPrecision.length > 0
      ? validPrecision.reduce((acc, e) => acc + (e.contextPrecisionScore ?? 0), 0) / validPrecision.length
      : 0;

    const validLatency = evaluations.filter((e) => e.latencyMs !== null);
    const avgLatencyMs = validLatency.length > 0
      ? Math.round(validLatency.reduce((acc, e) => acc + (e.latencyMs ?? 0), 0) / validLatency.length)
      : 0;

    return {
      totalEvaluations: evaluations.length,
      avgFaithfulness: Math.round(avgFaithfulness * 1000) / 10,
      avgRelevance: Math.round(avgRelevance * 1000) / 10,
      avgContextPrecision: Math.round(avgContextPrecision * 1000) / 10,
      avgLatencyMs,
      evaluations,
    };
  } catch (err) {
    console.warn("[Evaluation Stats Error] Using empty defaults:", err);
    return {
      totalEvaluations: 0,
      avgFaithfulness: 0,
      avgRelevance: 0,
      avgContextPrecision: 0,
      avgLatencyMs: 0,
      evaluations: [],
    };
  }
}
