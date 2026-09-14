import "server-only";
import { CohereClientV2 } from "cohere-ai";

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

export const EMBEDDING_MODEL = "embed-english-v3.0";
export const EMBEDDING_DIMENSION = 1024;
export const MAX_COHERE_BATCH_SIZE = 96; // Cohere API max batch limit

/**
 * Generates embeddings in parallel batches with exponential backoff retry.
 */
export async function generateBatchEmbeddings(
  texts: string[],
  inputType: "search_document" | "search_query" = "search_document"
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const allEmbeddings: number[][] = [];

  // Chunk input texts into batches of up to 96
  for (let i = 0; i < texts.length; i += MAX_COHERE_BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + MAX_COHERE_BATCH_SIZE);

    const batchEmbeddings = await callWithRetry(async () => {
      const client = getCohereClient();
      const response = await client.embed({
        model: EMBEDDING_MODEL,
        texts: batchTexts,
        inputType,
        embeddingTypes: ["float"],
      });

      const floats = response.embeddings?.float;

      if (!floats || floats.length !== batchTexts.length) {
        throw new Error(
          `Expected ${batchTexts.length} embeddings, received ${floats?.length ?? 0}`
        );
      }

      for (const vector of floats) {
        if (vector.length !== EMBEDDING_DIMENSION) {
          throw new Error(
            `Expected vector dimension ${EMBEDDING_DIMENSION}, got ${vector.length}`
          );
        }
      }

      return floats;
    });

    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}

/**
 * Single text embedding helper (e.g. for query encoding).
 */
export async function generateSingleEmbedding(
  text: string,
  inputType: "search_document" | "search_query" = "search_query"
): Promise<number[]> {
  const [vector] = await generateBatchEmbeddings([text], inputType);
  if (!vector) {
    throw new Error("Failed to generate embedding");
  }
  return vector;
}

/**
 * Exponential backoff retry handler for rate-limits (429) or transient network errors.
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;

      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 200;
      console.warn(
        `[Embedding Retry] Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}
