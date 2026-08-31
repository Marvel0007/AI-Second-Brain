"use client";

import { testEmbedDocument } from "@/actions/documents/test-embed";
import { useState } from "react";
import { askQuestion } from "@/actions/chat/ask-question";

export default function TestRagPage() {
  const DOCUMENT_ID = "cmsxdyr34000ic4ri9u3gr1j8";
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<
    {
      chunkId?: unknown;
      documentId?: unknown;
      score?: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk() {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const result = await askQuestion(question);

      setAnswer(result.answer);
      setSources(result.sources);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Test BrainDock RAG</h1>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAsk();
            }
          }}
          placeholder="Ask something about your document..."
          className="flex-1 rounded-lg border px-4 py-3"
        />

        <button
          onClick={handleAsk}
          disabled={loading}
          className="rounded-lg border px-5 py-3"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>

        <button
          onClick={async () => {
            try {
              const result = await testEmbedDocument(DOCUMENT_ID);

              console.log("Embedding result:", result);
              alert(`Embedded ${result.chunksProcessed} chunks`);
            } catch (error) {
              console.error(error);

              alert(
                error instanceof Error ? error.message : "Embedding failed",
              );
            }
          }}
          className="mt-4 rounded-lg border px-5 py-3"
        >
          Generate Pinecone Embeddings
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border p-4 text-sm">{error}</div>
      )}

      {answer && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Answer</h2>

          <div className="rounded-xl border p-5 whitespace-pre-wrap">
            {answer}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Sources</h2>

          <div className="space-y-2">
            {sources.map((source, index) => (
              <div
                key={String(source.chunkId ?? index)}
                className="rounded-lg border p-3 text-sm"
              >
                <p>Source {index + 1}</p>

                <p className="text-muted-foreground">
                  Score: {source.score?.toFixed(4) ?? "N/A"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
