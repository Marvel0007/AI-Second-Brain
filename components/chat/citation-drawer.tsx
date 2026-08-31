"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getSource } from "@/actions/chat/get-source";
import { FileText, ExternalLink, Sparkles, Loader2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CitationDrawerProps {
  chunkId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relevanceScore?: number;
}

interface SourceDetail {
  id: string;
  content: string;
  parentContent: string;
  chunkIndex: number;
  pageNumber: number;
  sectionTitle?: string | null;
  tokenCount?: number | null;
  document: {
    id: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileType?: string | null;
  };
}

export function CitationDrawer({
  chunkId,
  open,
  onOpenChange,
  relevanceScore,
}: CitationDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<SourceDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chunkId || !open) return;

    let isMounted = true;

    async function loadSource(id: string) {
      setLoading(true);
      setError("");

      try {
        const data = await getSource(id);
        if (isMounted) {
          setSource(data as unknown as SourceDetail);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError("Failed to load source details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSource(chunkId);

    return () => {
      isMounted = false;
    };
  }, [chunkId, open]);

  const similarityPct = relevanceScore ? Math.round(relevanceScore * 100) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6">
        <SheetHeader className="p-0 border-b pb-4">
          <div className="flex items-center gap-2 text-primary font-medium text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Grounded Knowledge Source</span>
          </div>

          <SheetTitle className="text-lg font-bold truncate mt-1">
            {source ? source.document.title : "Source Citation"}
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{source?.document.fileName}</span>
            {source && (
              <>
                <span>•</span>
                <span>Page {source.pageNumber}</span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Fetching source context...</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
            {error}
          </div>
        ) : source ? (
          <div className="mt-6 space-y-6">
            {/* Relevance & Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {similarityPct !== null && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span>Match Confidence:</span>
                  <span className="font-semibold text-foreground">{similarityPct}%</span>
                </Badge>
              )}

              {source.sectionTitle && (
                <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                  Section: {source.sectionTitle}
                </Badge>
              )}

              <Badge variant="outline" className="text-xs">
                Chunk #{source.chunkIndex + 1}
              </Badge>
            </div>

            {/* Exact Search Chunk */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Matched Text Snippet</span>
              </h4>
              <div className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap selection:bg-primary/20">
                {source.content}
              </div>
            </div>

            {/* Surrounding Parent Context */}
            {source.parentContent && source.parentContent !== source.content && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Expanded Surrounding Context
                </h4>
                <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {source.parentContent}
                </div>
              </div>
            )}

            {/* Document Link */}
            {source.document.fileUrl && (
              <div className="pt-2">
                <a
                  href={source.document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border bg-card px-4 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <span>Open Full Original File</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
