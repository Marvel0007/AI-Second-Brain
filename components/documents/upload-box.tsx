"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileText, Upload, X, Loader2, Sparkles, FileCode, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/actions/documents/upload-document";
import { processDocument } from "@/actions/documents/process-document";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function UploadBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function validateAndSetFile(selectedFile: File) {
    setError("");

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File must be smaller than 25MB.");
      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }

  function removeFile() {
    setFile(null);
    setError("");
    setProgressMsg("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUploadAndIndex() {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setProgressMsg("Uploading file to cloud storage...");

      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload file and create document record
      const uploadRes = await uploadDocument(formData);
      if (!uploadRes.success) {
        setError(uploadRes.error);
        setProgressMsg("");
        return;
      }

      // 2. Automatically chunk and embed in Pinecone
      setProgressMsg("Parsing document structure & indexing vectors in Pinecone...");
      const processRes = await processDocument(uploadRes.document.id);
      if (!processRes.success) {
        setError(`File uploaded, but indexing failed: ${processRes.error}`);
        setProgressMsg("");
        return;
      }

      setProgressMsg("Completed! Refreshing knowledge base...");
      removeFile();
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload and indexing failed.");
      setProgressMsg("");
    } finally {
      setUploading(false);
    }
  }

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["py", "ts", "tsx", "js", "jsx", "sql", "html", "json"].includes(ext || "")) {
      return <FileCode className="h-5 w-5 text-primary" />;
    }
    if (["csv", "xlsx"].includes(ext || "")) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    return <FileText className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-foreground bg-muted/40"
            : "border-border hover:border-muted-foreground/60"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Upload className="h-5 w-5" />
        </div>

        <h3 className="mt-3 font-medium text-sm text-foreground">
          Upload file
        </h3>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
          Drag and drop or browse from your device. Supports PDF, Markdown (.md), TXT, JSON, CSV, and code files up to 25MB.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.json,.csv,.py,.ts,.tsx,.js,.jsx,.sql,.html,application/pdf,text/plain,text/markdown,application/json,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 text-xs font-normal"
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </Button>
        ) : (
          <div className="mt-4 w-full max-w-sm">
            <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2.5 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                {getFileIcon(file.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={uploading}
                aria-label="Remove file"
                className="h-6 w-6 rounded"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {progressMsg && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                <span>{progressMsg}</span>
              </div>
            )}

            <Button
              type="button"
              size="sm"
              className="mt-3 w-full bg-foreground text-background text-xs font-medium hover:opacity-90"
              onClick={handleUploadAndIndex}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload and index</span>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-3 w-full max-w-sm rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive text-left">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}