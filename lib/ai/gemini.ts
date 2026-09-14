import "server-only";

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Missing GEMINI_API_KEY environment variable");
}

export const ai = new GoogleGenAI({
  apiKey: apiKey || "dummy-key-to-prevent-crash",
});

export function convertMessagesToGenAI(messages: { role: string; content: string }[]) {
  let systemInstruction = undefined;
  const contents = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }
  return { systemInstruction, contents };
}

/** Centralized model name — change once, updates everywhere. */
export const GEMINI_MODEL = "gemini-3.6-flash";

/**
 * Retries an async function on transient errors (503, 429) with exponential backoff.
 * Prevents crashes from temporary Google API overload.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1500
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isRetryable = /503|429|UNAVAILABLE|overloaded|high demand/i.test(message);

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed (${message.slice(0, 80)}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}
