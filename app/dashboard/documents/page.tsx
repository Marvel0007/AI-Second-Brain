import { FileText, Sparkles, FolderOpen } from "lucide-react";
import { DocumentCard } from "@/components/documents/document-card";
import { getDocuments } from "@/actions/documents";
import { UploadBox } from "@/components/documents/upload-box";

export default async function DocumentsPage() {
  const documents = await getDocuments();

  const totalTokens = documents.reduce((acc, doc) => acc + (doc.tokenCount || 0), 0);
  const indexedCount = documents.filter((d) => d.status === "COMPLETED").length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-foreground">
            Documents
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload PDFs, Markdown, and text files. Content is parsed and indexed for search and citations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-md border border-border bg-card px-3 py-1.5">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold text-foreground">{documents.length}</span>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-1.5">
            <span className="text-muted-foreground">Indexed: </span>
            <span className="font-semibold text-emerald-600">{indexedCount}</span>
          </div>
          {totalTokens > 0 && (
            <div className="rounded-md border border-border bg-card px-3 py-1.5">
              <span className="text-muted-foreground">Tokens: </span>
              <span className="font-semibold text-foreground">{totalTokens.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Box */}
      <UploadBox />

      {/* Documents Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>All Documents</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-normal">
              {documents.length}
            </span>
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-base font-semibold">No documents uploaded yet</h3>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
              Upload PDF or text documents above to start generating embeddings and asking questions in chat.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                id={document.id}
                title={document.title}
                fileName={document.fileName}
                status={document.status}
                fileSize={document.fileSize}
                tokenCount={document.tokenCount}
                isFavorite={document.isFavorite}
                fileType={document.fileType}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
