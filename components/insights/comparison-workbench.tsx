"use client";

import { useState, useTransition } from "react";
import { Sparkles, GitCompare, CheckSquare, Square, Play, Loader2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { compareSelectedDocuments } from "@/actions/documents/compare-documents";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  status: string;
  tokenCount?: number | null;
}

interface ComparisonWorkbenchProps {
  documents: DocumentItem[];
}

export function ComparisonWorkbench({ documents }: ComparisonWorkbenchProps) {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [comparisonTopic, setComparisonTopic] = useState("");
  const [result, setResult] = useState<{
    comparisonAnswer: string;
    documentsCompared: { id: string; title: string; fileName: string; chunksUsed: number }[];
    sources: { citationIndex: number; chunkId: string; documentTitle: string; snippet: string }[];
  } | null>(null);
  const [running, startRunning] = useTransition();
  const [error, setError] = useState("");

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedDocIds.length < 2) {
      setError("Please select at least 2 documents to compare.");
      return;
    }

    setError("");
    startRunning(async () => {
      try {
        const res = await compareSelectedDocuments(
          selectedDocIds,
          comparisonTopic.trim() || undefined
        );
        setResult(res);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Comparison synthesis failed.");
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Document Selection Grid */}
      <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-xs shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold tracking-tight">Select 2+ Documents to Compare</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedDocIds.length} of {documents.length} selected
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p className="text-xs">No documents available yet. Upload documents to compare them.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelectDoc(doc.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "bg-background/40 hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  <button type="button" className="mt-0.5 text-primary">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 fill-primary text-primary-foreground" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{doc.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{doc.fileName}</p>
                    {doc.tokenCount && (
                      <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">
                        {doc.tokenCount.toLocaleString()} tokens
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 space-y-4 border-t pt-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Specific Comparison Focus (Optional)
            </label>
            <input
              type="text"
              value={comparisonTopic}
              onChange={(e) => setComparisonTopic(e.target.value)}
              placeholder="e.g. Compare pricing models, feature matrix, or security architectures..."
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              disabled={running}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleCompare}
              disabled={running || selectedDocIds.length < 2}
              className="gap-2 text-xs"
            >
              {running ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Comparative Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Run Cross-Document Synthesis</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Synthesis Result Display */}
      {result && (
        <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-xs shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold tracking-tight">Comparative Research Synthesis</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {result.documentsCompared.map((doc) => (
                <Badge key={doc.id} variant="secondary" className="text-xs gap-1">
                  <FileText className="h-3 w-3 text-primary" />
                  <span>{doc.title}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.comparisonAnswer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
