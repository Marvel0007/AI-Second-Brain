import "server-only";
import { prisma } from "@/lib/prisma";
import { retrieveWithQueryExpansion } from "@/lib/rag/reasoning/multi-query-retriever";
import { rerankChunks } from "@/lib/rag/reranking/cohere-reranker";
import { buildGroundedContext, BuiltContext } from "@/lib/rag/reasoning/context-builder";
import { ai, convertMessagesToGenAI, GEMINI_MODEL, retryWithBackoff } from "@/lib/ai/gemini";
import { AnalyzedQuery } from "@/lib/rag/reasoning/query-analyzer";

export interface RagPipelineResult {
  answer: string;
  analysis: AnalyzedQuery;
  context: BuiltContext;
  latency: {
    analysisMs: number;
    retrievalMs: number;
    rerankMs: number;
    generationMs: number;
    totalMs: number;
  };
}

export interface RagExecutionOptions {
  question: string;
  workspaceId: string;
  documentIds?: string[];
  collectionId?: string;
  chatHistory?: { role: "user" | "assistant"; content: string }[];
  model?: string;
}

export const SYSTEM_PROMPT_RAG = `You are BrainDock, an enterprise AI Second Brain and knowledge assistant.
You answer user questions strictly based on the provided document excerpts.

CRITICAL INSTRUCTION FOR GROUNDING & ACCURACY:
1. Base your answer ONLY on the provided context sources.
2. If the answer cannot be deduced from the sources, state: "I couldn't find enough information in your knowledge base to answer this question." Do NOT invent or fabricate facts.
3. INLINE CITATIONS: Whenever you state a claim or fact derived from a source, append its citation tag directly in your text using the format: [cite:documentId:chunkId:citationIndex].
   For example: "BrainDock uses hybrid retrieval with reciprocal rank fusion [cite:doc_123:chk_456:1]."
4. SYNTHESIS: If sources provide complementary or comparative information, organize your response clearly using Markdown headings, bullet points, and code blocks where helpful.
5. Keep explanations direct, professional, and clear.`;

/**
 * Executes the complete non-streaming Advanced RAG pipeline.
 */
export async function executeRagPipeline({
  question,
  workspaceId,
  documentIds,
  collectionId,
  chatHistory = [],
  model = GEMINI_MODEL,
}: RagExecutionOptions): Promise<RagPipelineResult> {
  const overallStart = Date.now();

  // 1. Query Analysis & Multi-Query Hybrid Retrieval
  const retrievalStart = Date.now();
  const multiQueryResult = await retrieveWithQueryExpansion(
    question,
    { workspaceId, documentIds, collectionId },
    20
  );
  const retrievalMs = Date.now() - retrievalStart;

  // 2. Cross-Encoder Reranking
  const rerankStart = Date.now();
  const rerankedChunks = await rerankChunks(
    question,
    multiQueryResult.chunks,
    { topN: 6, scoreThreshold: 0.15 }
  );
  const rerankMs = Date.now() - rerankStart;

  // 3. Context Construction & Token Budgeting
  const context = buildGroundedContext(rerankedChunks, {
    maxTokens: 3500,
    useParentContext: true,
  });

  // 4. LLM Generation
  const genStart = Date.now();

  const formattedHistory = chatHistory.slice(-4).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT_RAG },
    ...formattedHistory,
    {
      role: "user" as const,
      content: `CONTEXT SOURCES:\n${context.formattedContext || "No relevant document sources found."}\n\nQUESTION:\n${question}`,
    },
  ];

  const { systemInstruction, contents } = convertMessagesToGenAI(messages);

  const completion = await retryWithBackoff(() =>
    ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.15,
        maxOutputTokens: 1200,
      },
    })
  );

  const answer = completion.text || "Failed to generate an answer.";
  const generationMs = Date.now() - genStart;
  const totalMs = Date.now() - overallStart;

  // 5. Asynchronously log telemetry
  prisma.pipelineLog.create({
    data: {
      workspaceId,
      query: question,
      intent: multiQueryResult.analysis.intent,
      retrievalMs,
      rerankMs,
      llmMs: generationMs,
      totalMs,
      chunksRetrieved: multiQueryResult.chunks.length,
      chunksReranked: rerankedChunks.length,
      model,
      success: true,
    },
  }).catch((e) => console.error("[Pipeline Telemetry Log Error]", e));

  return {
    answer,
    analysis: multiQueryResult.analysis,
    context,
    latency: {
      analysisMs: 0,
      retrievalMs,
      rerankMs,
      generationMs,
      totalMs,
    },
  };
}
