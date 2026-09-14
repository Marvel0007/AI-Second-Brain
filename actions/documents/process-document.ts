"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { chunkDocument } from "./chunk-document";
import { embedDocument } from "./embed-document";

export type ProcessDocumentResult =
  | {
      success: true;
      documentId: string;
      chunkCount: number;
      totalTokens: number;
      chunksProcessed: number;
      status: "COMPLETED";
    }
  | {
      success: false;
      error: string;
    };

export async function processDocument(
  documentId: string
): Promise<ProcessDocumentResult> {
  try {
    const workspace = await requireCurrentWorkspace();

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        workspaceId: workspace.id,
      },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found in current workspace",
      };
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "PROCESSING" },
    });

    // 1. Structure-aware parsing and Parent-Child Chunking
    const chunkResult = await chunkDocument(documentId);

    // 2. Batch Embedding and Pinecone Indexing
    const embedResult = await embedDocument(documentId);

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "COMPLETED" },
    });

    return {
      success: true,
      documentId,
      chunkCount: chunkResult.chunkCount,
      totalTokens: chunkResult.totalTokens,
      chunksProcessed: embedResult.chunksProcessed,
      status: "COMPLETED",
    };
  } catch (error: any) {
    console.error(`[Process Document Error] ID: ${documentId}`, error);

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED" },
      });
    } catch (_) {}

    return {
      success: false,
      error: error instanceof Error ? error.message : `Processing failed: ${String(error)}`,
    };
  }
}