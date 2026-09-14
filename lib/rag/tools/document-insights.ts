import "server-only";
import { prisma } from "@/lib/prisma";
import { ai, convertMessagesToGenAI, GEMINI_MODEL, retryWithBackoff } from "@/lib/ai/gemini";

export interface DocumentSummaryResult {
  tldr: string;
  keyConcepts: string[];
  mainTakeaways: string[];
  actionItems?: string[];
  rawMarkdown: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  hint?: string;
  sourceSection?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyNotesResult {
  title: string;
  notesMarkdown: string;
}

/**
 * Fetches and assembles document text from database chunks.
 */
async function getDocumentFullText(documentId: string, workspaceId: string): Promise<string> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
      },
    },
  });

  if (!document || document.chunks.length === 0) {
    throw new Error("Document has no processed content to analyze.");
  }

  // Combine unique parent chunks or child chunks up to ~12,000 characters
  const uniquePassages: string[] = [];
  const seen = new Set<string>();

  for (const chunk of document.chunks) {
    const text = chunk.parentContent || chunk.content;
    const key = text.slice(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      uniquePassages.push(text);
    }
  }

  const combined = uniquePassages.join("\n\n");
  return combined.slice(0, 24000); // Cap context window for fast processing
}

/**
 * Generates an executive structured summary of a document and saves it to Document.summary.
 */
export async function generateDocumentSummary(
  documentId: string,
  workspaceId: string
): Promise<DocumentSummaryResult> {
  const text = await getDocumentFullText(documentId, workspaceId);

  const messages = [
    {
      role: "system",
      content: `You are BrainDock's Senior Knowledge Distillation Engine.
Analyze the provided document text and generate an executive summary.

Respond with a JSON object:
- "tldr": a concise 2-3 sentence executive summary
- "keyConcepts": array of 4-8 central concepts, technologies, or entities
- "mainTakeaways": array of 4-7 critical conclusions or architectural principles
- "actionItems": array of 2-5 actionable next steps or recommendations if applicable`.trim(),
    },
    {
      role: "user",
      content: `DOCUMENT EXCERPTS:\n${text}`,
    },
  ];

  const { systemInstruction, contents } = convertMessagesToGenAI(messages);

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
      },
    })
  );

  const rawJson = response.text || "{}";
  const parsed = JSON.parse(rawJson) as {
    tldr?: string;
    keyConcepts?: string[];
    mainTakeaways?: string[];
    actionItems?: string[];
  };

  const tldr = parsed.tldr || "Summary generation in progress.";
  const keyConcepts = parsed.keyConcepts || [];
  const mainTakeaways = parsed.mainTakeaways || [];
  const actionItems = parsed.actionItems || [];

  const rawMarkdown = `### Executive Summary (TL;DR)\n${tldr}\n\n### Key Concepts\n${keyConcepts.map((k) => `- **${k}**`).join("\n")}\n\n### Key Takeaways\n${mainTakeaways.map((t) => `- ${t}`).join("\n")}`;

  // Persist summary in the Document table
  await prisma.document.update({
    where: { id: documentId },
    data: { summary: rawMarkdown },
  });

  return {
    tldr,
    keyConcepts,
    mainTakeaways,
    actionItems,
    rawMarkdown,
  };
}

/**
 * Generates interactive study notes from document content.
 */
export async function generateStudyNotes(
  documentId: string,
  workspaceId: string
): Promise<StudyNotesResult> {
  const text = await getDocumentFullText(documentId, workspaceId);

  const messages = [
    {
      role: "system",
      content: `You are an elite Academic and Engineering Study Guide Creator.
Transform the provided document into comprehensive, structured study notes.

Structure:
# [Document Title / Topic] Study Guide
## 1. Core Overview
## 2. Fundamental Principles & Architecture
## 3. Key Terminology & Definitions
## 4. Deep Dive Concepts & Code/Formulas (if applicable)
## 5. Review & Self-Check Questions`.trim(),
    },
    {
      role: "user",
      content: `DOCUMENT CONTENT:\n${text}`,
    },
  ];

  const { systemInstruction, contents } = convertMessagesToGenAI(messages);

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 1800,
      },
    })
  );

  const notesMarkdown = response.text || "Failed to generate study notes.";

  return {
    title: "Study Notes",
    notesMarkdown,
  };
}

/**
 * Generates flashcards and quiz questions from a document.
 */
export async function generateFlashcardsAndQuiz(
  documentId: string,
  workspaceId: string
): Promise<{ flashcards: Flashcard[]; quiz: QuizQuestion[] }> {
  const text = await getDocumentFullText(documentId, workspaceId);

  const messages = [
    {
      role: "system",
      content: `You are BrainDock's Knowledge Testing Engine.
Generate active-recall study flashcards and multiple-choice quiz questions based strictly on the document text.

Respond with a JSON object:
- "flashcards": array of 5-8 objects: { "question": string, "answer": string, "hint": string }
- "quiz": array of 4-6 objects: { "question": string, "options": string[] (length 4), "correctIndex": number (0-3), "explanation": string }`.trim(),
    },
    {
      role: "user",
      content: `DOCUMENT CONTENT:\n${text}`,
    },
  ];

  const { systemInstruction, contents } = convertMessagesToGenAI(messages);

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.25,
        maxOutputTokens: 1800,
        responseMimeType: "application/json",
      },
    })
  );

  const rawJson = response.text || "{}";
  const parsed = JSON.parse(rawJson) as {
    flashcards?: Flashcard[];
    quiz?: QuizQuestion[];
  };

  return {
    flashcards: parsed.flashcards || [],
    quiz: parsed.quiz || [],
  };
}
