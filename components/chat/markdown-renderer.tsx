"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { CitationDrawer } from "./citation-drawer";

interface MarkdownRendererProps {
  content: string;
  sources?: Array<{
    chunkId: string;
    documentId: string;
    title: string;
    fileName: string;
    score?: number;
    relevanceScore?: number;
    pageNumber?: number;
    sectionTitle?: string;
  }>;
  onCitationClick?: (chunkId: string) => void;
}

export function MarkdownRenderer({
  content,
  sources = [],
  onCitationClick,
}: MarkdownRendererProps) {
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  function handleBadgeClick(chunkId: string) {
    if (onCitationClick) {
      onCitationClick(chunkId);
    } else {
      setSelectedChunkId(chunkId);
      setDrawerOpen(true);
    }
  }

  async function handleCopyCode(codeText: string, index: number) {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  }

  // Pre-process text to convert [cite:docId:chunkId:index] tags into special markdown spans
  const processedContent = content.replace(
    /\[cite:([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+):([0-9]+)\]/g,
    (_, docId, chunkId, citationIndex) => {
      return `[[citation:${chunkId}:${citationIndex}]]`;
    }
  );

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom Code Blocks with Copy button
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && !codeString.includes("\n");

            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeIndex = Math.random();

            return (
              <div className="relative my-3 rounded-xl border bg-muted/60 overflow-hidden not-prose">
                <div className="flex items-center justify-between border-b bg-muted/90 px-4 py-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">{match ? match[1] : "code"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeString, codeIndex)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {copiedCodeIndex === codeIndex ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[11px] text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },

          // Intercept paragraph text to render interactive citation badges
          p({ children }) {
            return (
              <p className="mb-3 leading-7">
                {React.Children.map(children, (child) => {
                  if (typeof child !== "string") return child;

                  // Parse [[citation:chunkId:index]] markers
                  const parts = child.split(/(\[\[citation:[a-zA-Z0-9_-]+:[0-9]+\]\])/g);

                  return parts.map((part, i) => {
                    const citeMatch = part.match(/\[\[citation:([a-zA-Z0-9_-]+):([0-9]+)\]\]/);
                    if (!citeMatch) return part;

                    const chunkId = citeMatch[1];
                    const citeIndex = citeMatch[2];

                    const source = sources.find((s) => s.chunkId === chunkId);
                    const label = source ? `${citeIndex}` : `${citeIndex}`;
                    const tooltip = source ? `${source.title} (Page ${source.pageNumber ?? 1})` : "View Source";

                    return (
                      <button
                        type="button"
                        key={`${chunkId}-${i}`}
                        onClick={() => handleBadgeClick(chunkId)}
                        title={tooltip}
                        className="inline-flex items-center justify-center mx-1 h-4 min-w-4 px-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-bold transition-colors align-baseline -translate-y-0.5 border border-primary/20 shadow-xs"
                      >
                        [{label}]
                      </button>
                    );
                  });
                })}
              </p>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>

      <CitationDrawer
        chunkId={selectedChunkId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
