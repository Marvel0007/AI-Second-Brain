"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { deleteDocumentVectors } from "@/lib/rag/embeddings/pinecone-batch";

/**
 * Search documents by title or file name within the current workspace.
 */
export async function searchDocuments(query: string) {
  const workspace = await requireCurrentWorkspace();

  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  return prisma.document.findMany({
    where: {
      workspaceId: workspace.id,
      isTrashed: false,
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { fileName: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Toggle the isFavorite flag on a document.
 */
export async function toggleFavorite(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: workspace.id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { isFavorite: !document.isFavorite },
  });

  revalidatePath("/dashboard");
}

/**
 * Get all favorited documents for the current workspace.
 */
export async function getFavoriteDocuments() {
  const workspace = await requireCurrentWorkspace();

  return prisma.document.findMany({
    where: {
      workspaceId: workspace.id,
      isFavorite: true,
      isTrashed: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Soft-delete: move a document to trash.
 */
export async function trashDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: workspace.id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { isTrashed: true, trashedAt: new Date() },
  });

  revalidatePath("/dashboard");
}

/**
 * Restore a document from the trash.
 */
export async function restoreDocument(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: workspace.id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { isTrashed: false, trashedAt: null },
  });

  revalidatePath("/dashboard");
}

/**
 * Permanently delete a document.
 */
export async function deleteDocumentPermanently(documentId: string) {
  const workspace = await requireCurrentWorkspace();

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: workspace.id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Delete vectors in Pinecone
  await deleteDocumentVectors(documentId, workspace.id);

  await prisma.document.delete({
    where: { id: documentId },
  });

  revalidatePath("/dashboard");
}

/**
 * Get all trashed documents for the current workspace.
 */
export async function getTrashedDocuments() {
  const workspace = await requireCurrentWorkspace();

  return prisma.document.findMany({
    where: {
      workspaceId: workspace.id,
      isTrashed: true,
    },
    orderBy: { trashedAt: "desc" },
  });
}

/**
 * Empty trash: permanently delete all trashed documents.
 */
export async function emptyTrash() {
  const workspace = await requireCurrentWorkspace();

  await prisma.document.deleteMany({
    where: {
      workspaceId: workspace.id,
      isTrashed: true,
    },
  });

  revalidatePath("/dashboard");
}
