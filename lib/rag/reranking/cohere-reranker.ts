import "server-only";
import { CohereClientV2 } from "cohere-ai";
import { FusedRetrievedChunk } from "@/lib/rag/retrieval/types";
import { RerankedChunk, RerankOptions } from "./types";

let _cohere: CohereClientV2 | null = null;

function getCohereClient() {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COHERE_API_KEY environment variable. Please set COHERE_API_KEY in your Vercel/environment settings.");
  }
  if (!_cohere) {
    _cohere = new CohereClientV2({
      token: apiKey,
    });
  }
  return _cohere;
}

export const DEFAULT_RERANK_MODEL = "rerank-v3.5";

/**
 * Production Cross-Encoder Reranker using Cohere Rerank v3.5.
 * 
 * Takes candidate chunks from hybrid retrieval (Top-20), computes joint
 * query-document cross-attention, and returns the Top-N highest signal chunks.
 */
export async function rerankChunks(
  query: string,
  chunks: FusedRetrievedChunk[],
  options: RerankOptions = {}
): Promise<RerankedChunk[]> {
  const topN = options.topN ?? 5;
  const scoreThreshold = options.scoreThreshold ?? 0.20;
  const model = options.model ?? DEFAULT_RERANK_MODEL;

  if (chunks.length === 0) return [];
  if (chunks.length === 1) {
    return [
      {
        ...chunks[0],
        rerankScore: 1.0,
        rerankRank: 1,
      },
    ];
  }

  const startTime = Date.now();

  try {
    // Format documents for Cohere Rerank API (including document title and section for richer cross-attention)
    const documentsForRerank = chunks.map((chunk) => {
      const headerPrefix = chunk.sectionTitle ? `[Section: ${chunk.sectionTitle}] ` : "";
      return `Document: ${chunk.documentTitle}\n${headerPrefix}${chunk.content}`;
    });

    const response = await getCohereClient().rerank({
      model,
      query,
      documents: documentsForRerank,
      topN: Math.min(topN, chunks.length),
    });

    const results = response.results;

    if (!results || results.length === 0) {
      throw new Error("Empty rerank response from Cohere API");
    }

    const rerankedChunks: RerankedChunk[] = [];

    results.forEach((res, rankIndex) => {
      const originalChunk = chunks[res.index];
      const relevanceScore = res.relevanceScore ?? 0;

      // Filter out low-relevance noise if below threshold
      if (originalChunk && relevanceScore >= scoreThreshold) {
        rerankedChunks.push({
          ...originalChunk,
          rerankScore: relevanceScore,
          rerankRank: rankIndex + 1,
        });
      }
    });

    console.log(
      `[Cross-Encoder Rerank] Reranked ${chunks.length} -> ${rerankedChunks.length} chunks (Model: ${model}) in ${Date.now() - startTime}ms`
    );

    return rerankedChunks;
  } catch (err) {
    console.warn(`[Rerank Fallback] Cohere Rerank failed, falling back to RRF ranking:`, err);

    // Fallback: Use existing RRF score ordering
    return chunks.slice(0, topN).map((chunk, index) => ({
      ...chunk,
      rerankScore: chunk.rrfScore,
      rerankRank: index + 1,
    }));
  }
}
