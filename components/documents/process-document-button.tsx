"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { processDocument } from "@/actions/documents/process-document";
import { Button } from "@/components/ui/button";

type ProcessDocumentButtonProps = {
  documentId: string;
};

export function ProcessDocumentButton({
  documentId,
}: ProcessDocumentButtonProps) {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleProcess() {
    try {
      setProcessing(true);
      setMessage("Parsing, chunking & indexing vectors in Pinecone...");

      const result = await processDocument(documentId);

      if (!result.success) {
        setMessage(`Indexing failed: ${result.error}`);
        return;
      }

      setMessage(`Indexed ${result.chunkCount} chunks (${result.totalTokens} tokens) successfully!`);

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Processing failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={handleProcess}
        disabled={processing}
        className="w-full text-xs font-medium"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
            Indexing RAG...
          </>
        ) : (
          <>
            <Play className="mr-2 h-3.5 w-3.5 text-primary" />
            Index Document
          </>
        )}
      </Button>

      {message && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {message}
        </p>
      )}
    </div>
  );
}