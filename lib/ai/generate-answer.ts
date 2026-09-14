import "server-only";

import { ai, convertMessagesToGenAI, GEMINI_MODEL, retryWithBackoff } from "@/lib/ai/gemini";

export async function generateAnswer(
  question: string,
  context: string
) {
  const messages = [
    {
      role: "system",
      content: `
You are BrainDock, an AI assistant that answers questions
using the user's uploaded documents.

Rules:
- Answer only using the provided context.
- Do not invent or assume information.
- If the answer cannot be found in the context, say:
  "I couldn't find that information in your documents."
- Keep answers clear and concise.
- Use Markdown when useful.
      `.trim(),
    },
    {
      role: "user",
      content: `
CONTEXT:
${context}

QUESTION:
${question}
      `.trim(),
    },
  ];

  const { systemInstruction, contents } = convertMessagesToGenAI(messages);

  const completion = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    })
  );

  const answer = completion.text;

  if (!answer) {
    throw new Error("Failed to generate AI answer");
  }

  return answer;
}