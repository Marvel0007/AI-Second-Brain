import "server-only";
import { ai, convertMessagesToGenAI, GEMINI_MODEL, retryWithBackoff } from "@/lib/ai/gemini";

export interface AnalyzedQuery {
  originalQuery: string;
  isMultiDocument: boolean;
  intent: "factual" | "comparative" | "summary" | "exploratory";
  rewrittenQueries: string[];
  keywords: string[];
  hypotheticalPassage?: string;
}

/**
 * Analyzes and expands the user's query using structured LLM query understanding.
 * Produces:
 * 1. Intent classification (factual, comparative, summary)
 * 2. Multi-query variations for semantic coverage
 * 3. Keyword extraction for sparse full-text search
 * 4. HyDE (Hypothetical Document Embedding) representation
 */
export async function analyzeAndRewriteQuery(
  rawQuery: string
): Promise<AnalyzedQuery> {
  const query = rawQuery.trim();

  // Fast path for very short or empty queries
  if (query.length < 5) {
    return {
      originalQuery: query,
      isMultiDocument: false,
      intent: "factual",
      rewrittenQueries: [query],
      keywords: [query],
    };
  }

  try {
    const messages = [
      {
        role: "system",
        content: `You are an expert Information Retrieval and RAG Query Optimizer.
Analyze the user's question and generate an optimized search representation.

Respond with a JSON object containing:
- "isMultiDocument": boolean (true if question asks to compare, contrast, or synthesize across topics/files)
- "intent": "factual" | "comparative" | "summary" | "exploratory"
- "rewrittenQueries": array of 2-3 distinct, specific search queries that rephrase the question from different semantic angles
- "keywords": array of 3-6 exact technical terms, acronyms, or proper nouns extracted from the question
- "hypotheticalPassage": a 1-2 sentence hypothetical answer excerpt that would appear in an authoritative document to answer this query (HyDE)`.trim(),
      },
      {
        role: "user",
        content: `User Question: "${query}"`,
      },
    ];

    const { systemInstruction, contents } = convertMessagesToGenAI(messages);

    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.1,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
        },
      })
    );

    const text = response.text;
    if (!text) throw new Error("Empty query optimizer response");

    const parsed = JSON.parse(text) as {
      isMultiDocument?: boolean;
      intent?: "factual" | "comparative" | "summary" | "exploratory";
      rewrittenQueries?: string[];
      keywords?: string[];
      hypotheticalPassage?: string;
    };

    const rewrittenQueries = Array.isArray(parsed.rewrittenQueries) && parsed.rewrittenQueries.length > 0
      ? parsed.rewrittenQueries
      : [query];

    // Ensure original query is always in the search pool
    if (!rewrittenQueries.includes(query)) {
      rewrittenQueries.unshift(query);
    }

    return {
      originalQuery: query,
      isMultiDocument: Boolean(parsed.isMultiDocument),
      intent: parsed.intent || "factual",
      rewrittenQueries: rewrittenQueries.slice(0, 3),
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : [query],
      hypotheticalPassage: parsed.hypotheticalPassage || undefined,
    };
  } catch (err) {
    console.warn("[Query Understanding Warning] Fallback to direct query:", err);

    // Fallback if LLM call is unavailable
    const fallbackKeywords = query
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    return {
      originalQuery: query,
      isMultiDocument: /compare|contrast|difference|between|all documents|across/i.test(query),
      intent: "factual",
      rewrittenQueries: [query],
      keywords: fallbackKeywords.length > 0 ? fallbackKeywords : [query],
    };
  }
}
