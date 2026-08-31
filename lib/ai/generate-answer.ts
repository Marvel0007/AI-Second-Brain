import "server-only";

import { groq } from "@/lib/ai/groq";

export async function generateAnswer(
  question: string,
  context: string
) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 1000,

    messages: [
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
    ],
  });

  const answer =
    completion.choices[0]?.message?.content;

  if (!answer) {
    throw new Error("Failed to generate AI answer");
  }

  return answer;
}