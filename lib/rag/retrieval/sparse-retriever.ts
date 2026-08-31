import "server-only";
import { prisma } from "@/lib/prisma";
import { RawRetrievedItem, RetrievalFilter } from "./types";

/**
 * Executes keyword / sparse retrieval against PostgreSQL chunks.
 * Extracts individual query keywords and ranks by frequency and keyword match coverage.
 */
export async function sparseSearch(
  query: string,
  filter: RetrievalFilter,
  topK = 25
): Promise<RawRetrievedItem[]> {
  // Extract keywords (words with length >= 3, excluding common stop words)
  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "from", "what",
    "how", "why", "who", "where", "when", "can", "you", "tell",
    "about", "are", "were", "been", "have", "has", "had", "will",
  ]);

  const rawKeywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  if (rawKeywords.length === 0) {
    return [];
  }

  // Construct Prisma OR clauses for all keywords across chunk content, section title, and doc title
  const keywordConditions = rawKeywords.map((kw) => ({
    OR: [
      { content: { contains: kw, mode: "insensitive" as const } },
      { sectionTitle: { contains: kw, mode: "insensitive" as const } },
      { document: { title: { contains: kw, mode: "insensitive" as const } } },
    ],
  }));

  const whereClause: Record<string, unknown> = {
    document: {
      workspaceId: filter.workspaceId,
      isTrashed: false,
      ...(filter.collectionId ? { collectionId: filter.collectionId } : {}),
      ...(filter.documentIds && filter.documentIds.length > 0
        ? { id: { in: filter.documentIds } }
        : {}),
    },
    OR: keywordConditions,
  };

  const matchingChunks = await prisma.chunk.findMany({
    where: whereClause,
    take: topK * 2,
    select: {
      id: true,
      documentId: true,
      content: true,
      sectionTitle: true,
      document: {
        select: {
          title: true,
        },
      },
    },
  });

  // Calculate BM25-like keyword coverage score
  const scoredChunks = matchingChunks.map((chunk) => {
    const textToMatch = `${chunk.document.title} ${chunk.sectionTitle ?? ""} ${chunk.content}`.toLowerCase();
    let matchScore = 0;

    for (const kw of rawKeywords) {
      const occurrences = textToMatch.split(kw).length - 1;
      if (occurrences > 0) {
        matchScore += 1 + Math.log(1 + occurrences);
      }
    }

    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      score: matchScore,
      source: "sparse" as const,
    };
  });

  // Sort descending by keyword score
  scoredChunks.sort((a, b) => b.score - a.score);

  const topResults = scoredChunks.slice(0, topK);

  return topResults.map((item, index) => ({
    chunkId: item.chunkId,
    documentId: item.documentId,
    score: item.score,
    rank: index + 1,
    source: "sparse",
  }));
}
