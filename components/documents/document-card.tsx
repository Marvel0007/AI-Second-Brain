"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText,
  Star,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProcessDocumentButton } from "@/components/documents/process-document-button";
import {
  toggleFavorite,
  trashDocument,
} from "@/actions/documents/manage-documents";

type DocumentCardProps = {
  id: string;
  title: string;
  fileName: string;
  status: string;
  fileSize?: number | null;
  tokenCount?: number | null;
  isFavorite?: boolean;
  fileType?: string | null;
};

export function DocumentCard({
  id,
  title,
  fileName,
  status,
  fileSize,
  tokenCount,
  isFavorite: initialFavorite = false,
  fileType,
}: DocumentCardProps) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [trashing, setTrashing] = useState(false);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !favorite;
    setFavorite(nextState);
    try {
      await toggleFavorite(id);
    } catch (err) {
      setFavorite(!nextState);
      console.error(err);
    }
  }

  async function handleTrash(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Move "${title}" to trash?`)) {
      setTrashing(true);
      try {
        await trashDocument(id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        setTrashing(false);
      }
    }
  }

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="secondary" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[10px]">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Indexed</span>
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="secondary" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-600 text-[10px]">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Processing</span>
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border bg-card/70 p-5 backdrop-blur-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`rounded-lg p-1.5 transition-colors hover:bg-muted ${
                favorite ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-4 w-4 ${favorite ? "fill-amber-500" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleTrash}
              disabled={trashing}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Move to trash"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="mt-4">
          <Link href={`/dashboard/documents/${id}`} className="block group-hover:underline">
            <h3 className="truncate font-semibold text-sm text-foreground" title={title}>
              {title}
            </h3>
          </Link>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={fileName}>
            {fileName}
          </p>
        </div>

        {/* Badges & Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {getStatusBadge()}

          {tokenCount !== undefined && tokenCount !== null && tokenCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
              <Layers className="h-2.5 w-2.5" />
              <span>{tokenCount.toLocaleString()} tokens</span>
            </Badge>
          )}

          {fileType && (
            <Badge variant="outline" className="text-[10px] uppercase font-mono text-muted-foreground">
              {fileType.split("/").pop()}
            </Badge>
          )}

          {formatSize(fileSize) && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {formatSize(fileSize)}
            </Badge>
          )}
        </div>
      </div>

      {/* Card Footer: Quick Actions */}
      <div className="mt-5 space-y-2 border-t pt-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/dashboard/documents/${id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            <span>AI Insights & Chunks</span>
          </Link>
        </div>

        <ProcessDocumentButton documentId={id} />
      </div>
    </article>
  );
}