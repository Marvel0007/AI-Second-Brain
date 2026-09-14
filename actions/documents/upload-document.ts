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

export async function uploadDocument(formData: FormData) {
  const workspace = await requireCurrentWorkspace();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed size of 25MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
  const isAllowedMime =
    file.type &&
    ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));

  if (!isAllowedExt && !isAllowedMime) {
    throw new Error(
      `Unsupported file format (.${ext}). Supported formats: PDF, Markdown, Text, Code, JSON, and CSV.`
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing Vercel Blob configuration. Please set BLOB_READ_WRITE_TOKEN in your .env file.");
  }

  try {
    const blob = await put(
      `workspaces/${workspace.id}/${crypto.randomUUID()}-${file.name}`,
      file,
      {
        access: "public",
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

    return document;
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}