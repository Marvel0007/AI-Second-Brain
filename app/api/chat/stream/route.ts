import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { retrieveWithQueryExpansion } from "@/lib/rag/reasoning/multi-query-retriever";
import { rerankChunks } from "@/lib/rag/reranking/cohere-reranker";
import { buildGroundedContext } from "@/lib/rag/reasoning/context-builder";
import { ai, convertMessagesToGenAI, GEMINI_MODEL, retryWithBackoff } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT_RAG } from "@/lib/rag/pipeline/rag-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { workspaces: true },
  });

  if (!user || user.workspaces.length === 0) {
    return NextResponse.json({ error: "User or Workspace not found" }, { status: 404 });
  }

  const workspace = user.workspaces[0];

  const body = await req.json();
  const { chatId, content, documentIds, collectionId, messageId } = body;

  const rawMessage = typeof content === "string" ? content.trim() : "";

  if (!chatId || !rawMessage) {
    return NextResponse.json(
      { error: "chatId and message content are required" },
      { status: 400 }
    );
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, workspaceId: workspace.id },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
  }

  // 1. Save user message to database
  await prisma.message.create({
    data: {
      id: messageId || undefined,
      chatId: chat.id,
      role: "USER",
      content: rawMessage,
    },
  });

  // 2. Update chat title if it's new
  if (!chat.title || chat.title === "New Chat") {
    const autoTitle = rawMessage.length > 45 ? `${rawMessage.slice(0, 45)}...` : rawMessage;
    await prisma.chat.update({
      where: { id: chat.id },
      data: { title: autoTitle },
    });
  }

  // Fetch recent message history for conversational context
  const previousMessages = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const chatHistory = previousMessages
    .reverse()
    .slice(0, -1) // exclude the current user message just inserted
    .map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

  const overallStart = Date.now();

  // Create SSE stream encoder
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(eventType: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        // Step A: Query Understanding & Hybrid Retrieval
        sendEvent("status", { message: "Analyzing query & searching knowledge base..." });
        const retStart = Date.now();
        const multiQueryResult = await retrieveWithQueryExpansion(
          rawMessage,
          { workspaceId: workspace.id, documentIds, collectionId },
          20
        );
        const retrievalMs = Date.now() - retStart;

        // Step B: Cross-Encoder Reranking
        sendEvent("status", { message: "Reranking context with cross-encoder..." });
        const rerankStart = Date.now();
        const rerankedChunks = await rerankChunks(
          rawMessage,
          multiQueryResult.chunks,
          { topN: 6, scoreThreshold: 0.15 }
        );
        const rerankMs = Date.now() - rerankStart;

        // Step C: Context Construction
        const context = buildGroundedContext(rerankedChunks, {
          maxTokens: 3500,
          useParentContext: true,
        });

        // Send metadata & sources to frontend before streaming tokens
        sendEvent("metadata", {
          analysis: multiQueryResult.analysis,
          sources: context.sources,
          candidateCount: multiQueryResult.chunks.length,
          rerankedCount: rerankedChunks.length,
        });

        // Step D: Stream LLM Generation
        sendEvent("status", { message: "Synthesizing grounded answer..." });
        const genStart = Date.now();

        const messages = [
          { role: "system" as const, content: SYSTEM_PROMPT_RAG },
          ...chatHistory,
          {
            role: "user" as const,
            content: `CONTEXT SOURCES:\n${context.formattedContext || "No relevant document sources found in knowledge base."}\n\nQUESTION:\n${rawMessage}`,
          },
        ];

        const { systemInstruction, contents } = convertMessagesToGenAI(messages);

        let fullAnswer = "";

        const stream = await retryWithBackoff(() =>
          ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents,
            config: {
              systemInstruction,
              temperature: 0.15,
              maxOutputTokens: 1400,
            },
          })
        );

        for await (const chunk of stream) {
          const token = chunk.text || "";
          if (token) {
            fullAnswer += token;
            sendEvent("token", { token });
          }
        }

        const generationMs = Date.now() - genStart;
        const totalMs = Date.now() - overallStart;

        // Step E: Save Assistant message to Database
        const assistantMessage = await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "ASSISTANT",
            content: fullAnswer,
            sources: context.sources as unknown as object[],
          },
        });

        // Step F: Save normalized Citation records
        if (context.sources.length > 0) {
          await prisma.citation.createMany({
            data: context.sources.map((src) => ({
              messageId: assistantMessage.id,
              documentId: src.documentId,
              chunkId: src.chunkId,
              snippet: src.snippet,
              pageNumber: src.pageNumber,
              similarity: src.relevanceScore,
              rerankScore: src.relevanceScore,
              citationIndex: src.citationIndex,
            })),
          });
        }

        // Update chat timestamp
        await prisma.chat.update({
          where: { id: chat.id },
          data: { updatedAt: new Date() },
        });

        // Step G: Log telemetry
        prisma.pipelineLog.create({
          data: {
            workspaceId: workspace.id,
            query: rawMessage,
            intent: multiQueryResult.analysis.intent,
            retrievalMs,
            rerankMs,
            llmMs: generationMs,
            totalMs,
            chunksRetrieved: multiQueryResult.chunks.length,
            chunksReranked: rerankedChunks.length,
            model: "gemini-flash-latest",
            success: true,
          },
        }).catch((e) => console.error("[Pipeline Telemetry Error]", e));

        sendEvent("done", {
          messageId: assistantMessage.id,
          totalMs,
        });

        controller.close();
      } catch (error) {
        console.error("[Chat Stream Error]", error);
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Failed to generate response",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
