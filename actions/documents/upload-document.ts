"use server";

import { put } from "@vercel/blob";
import { requireCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
  "py",
  "ts",
  "tsx",
  "js",
  "jsx",
  "sql",
  "html",
];

const ALLOWED_MIME_PREFIXES = [
  "application/pdf",
  "text/",
  "application/json",
  "application/csv",
  "application/x-javascript",
  "application/javascript",
];

export type UploadDocumentResult =
  | {
      success: true;
      document: {
        id: string;
        title: string;
        fileName: string;
        fileUrl: string;
        fileType: string | null;
        fileSize: number | null;
        status: string;
        createdAt: string;
        updatedAt: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function uploadDocument(formData: FormData): Promise<UploadDocumentResult> {
  try {
    const workspace = await requireCurrentWorkspace();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }

    if (file.size === 0) {
      return { success: false, error: "The uploaded file is empty." };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File size exceeds the maximum allowed limit of 25MB.",
      };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    const isAllowedMime =
      file.type &&
      ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));

    if (!isAllowedExt && !isAllowedMime) {
      return {
        success: false,
        error: `Unsupported file format (.${ext}). Supported formats: PDF, Markdown, Text, Code, JSON, and CSV.`,
      };
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return {
        success: false,
        error:
          "Missing BLOB_READ_WRITE_TOKEN in Vercel environment variables. Please add BLOB_READ_WRITE_TOKEN to your Vercel Project Settings → Environment Variables and redeploy.",
      };
    }

    const blob = await put(
      `workspaces/${workspace.id}/${crypto.randomUUID()}-${file.name}`,
      file,
      {
        access: "public",
        token: blobToken,
      }
    );

    const title = file.name.replace(/\.[^/.]+$/, "");

    const document = await prisma.document.create({
      data: {
        title,
        fileName: file.name,
        fileUrl: blob.url,
        fileType: file.type || `text/${ext}`,
        fileSize: file.size,
        status: "PROCESSING",
        workspaceId: workspace.id,
      },
    });

    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[Upload Document Error]", error);
    return {
      success: false,
      error: `Upload failed: ${error?.message || "Unknown error"}`,
    };
  }
}