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
      const doc = await uploadDocument(formData);

      // 2. Automatically chunk and embed in Pinecone
      setProgressMsg("Parsing document structure & indexing vectors in Pinecone...");
      await processDocument(doc.id);

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
    <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-xs">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="mt-4 font-semibold text-base">
          Upload knowledge document
        </h3>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
          Drag & drop or browse files. Supports PDF, Markdown (.md), TXT, JSON, CSV, and Code files up to 25MB.
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
            className="mt-5 rounded-xl cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select File from Device
          </Button>
        ) : (
          <div className="mt-5 w-full max-w-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {getFileIcon(file.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
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
                className="h-7 w-7 rounded-lg"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {progressMsg && (
              <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{progressMsg}</span>
              </div>
            )}

            <Button
              type="button"
              className="mt-4 w-full rounded-xl gap-2 font-medium cursor-pointer"
              onClick={handleUploadAndIndex}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Upload & Index with RAG</span>
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}