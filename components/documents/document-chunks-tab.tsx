"use client";

import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Copy, Check, Hash, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  parentContent?: string | null;
  pageNumber?: number | null;
  sectionTitle?: string | null;
  tokenCount?: number | null;
}

interface DocumentChunksTabProps {
  chunks: ChunkItem[];
}

export function DocumentChunksTab({ chunks }: DocumentChunksTabProps) {
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  if (chunks.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
        <Layers className="h-8 w-8 text-muted-foreground mb-3" />
        <h4 className="font-semibold text-sm">No Chunks Indexed</h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          This document has not been chunked yet. Click &quot;Process Document&quot; above to parse and chunk into Pinecone vectors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hierarchical Parent-Child Chunks ({chunks.length})
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Child chunks: ~500 tokens • Parent context: ~1800 tokens
        </span>
      </div>

      <div className="space-y-3">
        {chunks.map((chunk) => {
          const isExpanded = expandedChunkId === chunk.id;
          const hasParent = chunk.parentContent && chunk.parentContent !== chunk.content;

          return (
            <div
              key={chunk.id}
              className="rounded-2xl border bg-card/70 p-4 transition-all hover:border-primary/30 shadow-xs"
            >
              {/* Chunk Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs font-mono">
                    <Hash className="h-3 w-3" />
                    <span>Chunk #{chunk.chunkIndex + 1}</span>
                  </Badge>

                  {chunk.pageNumber && (
                    <Badge variant="outline" className="text-xs">
                      Page {chunk.pageNumber}
                    </Badge>
                  )}

                  {chunk.sectionTitle && (
                    <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                      {chunk.sectionTitle}
                    </Badge>
                  )}

                  {chunk.tokenCount && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {chunk.tokenCount} tokens
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(chunk.content, chunk.id)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    title="Copy chunk text"
                  >
                    {copiedId === chunk.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {hasParent && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedChunkId(isExpanded ? null : chunk.id)
                      }
                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide Parent Context" : "Show Parent Context"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Exact Child Chunk Content */}
              <div className="mt-3">
                <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/30 p-3 rounded-xl">
                  {chunk.content}
                </p>
              </div>

              {/* Expanded Parent Context */}
              {isExpanded && chunk.parentContent && (
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary mb-2">
                    <Sparkles className="h-3 w-3" />
                    <span>Expanded Parent Document Window</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-60 overflow-y-auto">
                    {chunk.parentContent}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
