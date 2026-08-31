import "server-only";
import { prisma } from "@/lib/prisma";
import { hybridRetrieve } from "@/lib/rag/retrieval/hybrid-retriever";
import { rerankChunks } from "@/lib/rag/reranking/cohere-reranker";
import { buildGroundedContext } from "./context-builder";
import { groq } from "@/lib/ai/groq";
import { RerankedChunk } from "@/lib/rag/reranking/types";

export interface MultiDocComparisonParams {
  documentIds: string[];
  workspaceId: string;
  comparisonTopic?: string;
}

export interface MultiDocComparisonResult {
  comparisonAnswer: string;
  documentsCompared: {
    id: string;
    title: string;
    fileName: string;
    chunksUsed: number;
  }[];
  sources: {
    citationIndex: number;
    chunkId: string;
    documentId: string;
    documentTitle: string;
    pageNumber: number;
    snippet: string;
  }[];
  matrixMarkdown?: string;
}

const MULTI_DOC_SYSTEM_PROMPT = `You are BrainDock's Senior Comparative Research Analyst.
You are comparing two or more documents strictly using the provided excerpts.

STRUCTURE YOUR SYNTHESIS IN THIS EXACT FORMAT:
1. Executive Summary (Brief 2-3 sentence overview)
2. Comparison Table (A Markdown table with columns: Feature / Dimension | Doc 1 | Doc 2 | ...)
3. Key Similarities (Bullet points with inline citations [cite:docId:chunkId:index])
4. Key Differences & Contrasting Approaches (Bullet points with inline citations)
5. Synthesis & Takeaways

CRITICAL GROUNDING RULES:
- Base every comparison point strictly on the provided document excerpts.
- Always include citations for both sides of the comparison.
- If one document does not mention a topic that the other does, explicitly note that as an asymmetry.`;

/**
 * Performs cross-document synthesis and comparative reasoning across specific documents.
 * Ensures balanced candidate allocation so every document is represented in the context.
 */
export async function compareDocuments({
  documentIds,
  workspaceId,
  comparisonTopic = "Compare and contrast the main topics, architectural decisions, and key differences.",
}: MultiDocComparisonParams): Promise<MultiDocComparisonResult> {
  if (documentIds.length < 2) {
    throw new Error("At least 2 documents are required for comparison.");
  }

  // 1. Verify documents exist in workspace
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      workspaceId,
      isTrashed: false,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
    },
  });

  if (documents.length < 2) {
    throw new Error("One or more selected documents could not be found in workspace.");
  }

  // 2. Balanced Retrieval: Fetch top candidates from EACH document individually
  const perDocLimit = Math.max(3, Math.floor(18 / documents.length));

  const perDocRetrievals = await Promise.all(
    documents.map(async (doc) => {
      const candidates = await hybridRetrieve({
        query: comparisonTopic,
        filter: {
          workspaceId,
          documentIds: [doc.id],
        },
        denseTopK: 12,
        sparseTopK: 12,
        fusedTopK: 8,
      });

      // Rerank candidates within this document's pool
      const reranked = await rerankChunks(comparisonTopic, candidates, {
        topN: perDocLimit,
        scoreThreshold: 0.10,
      });

      return {
        document: doc,
        reranked,
      };
    })
  );

  // 3. Combine and construct multi-document grounded context
  const allRerankedChunks: RerankedChunk[] = [];
  const docChunkCounts: Record<string, number> = {};

  perDocRetrievals.forEach(({ document, reranked }) => {
    allRerankedChunks.push(...reranked);
    docChunkCounts[document.id] = reranked.length;
  });

  const context = buildGroundedContext(allRerankedChunks, {
    maxTokens: 4000,
    useParentContext: true,
  });

  // 4. Generate structured comparative analysis with Groq
  const docNamesList = documents.map((d) => `"${d.title}" (${d.fileName})`).join(", ");

  const prompt = `DOCUMENTS TO COMPARE:
${docNamesList}

USER COMPARISON FOCUS:
${comparisonTopic}

EVIDENCE & SOURCE EXCERPTS:
${context.formattedContext || "No extractable excerpts found."}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.15,
    max_tokens: 1800,
    messages: [
      { role: "system", content: MULTI_DOC_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const answer = completion.choices[0]?.message?.content || "Failed to generate comparison.";

  return {
    comparisonAnswer: answer,
    documentsCompared: documents.map((d) => ({
      id: d.id,
      title: d.title,
      fileName: d.fileName,
      chunksUsed: docChunkCounts[d.id] ?? 0,
    })),
    sources: context.sources.map((s) => ({
      citationIndex: s.citationIndex,
      chunkId: s.chunkId,
      documentId: s.documentId,
      documentTitle: s.documentTitle,
      pageNumber: s.pageNumber,
      snippet: s.snippet,
    })),
  };
}
