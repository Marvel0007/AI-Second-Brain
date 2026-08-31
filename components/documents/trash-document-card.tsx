"use client";

import { useTransition } from "react";
import {
  RotateCcw,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TrashDocumentCardProps = {
  id: string;
  title: string;
  fileName: string;
  trashedAt: string | null;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function TrashDocumentCard({
  id,
  title,
  fileName,
  trashedAt,
  onRestore,
  onDelete,
}: TrashDocumentCardProps) {
  const [isRestoring, startRestore] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <article className="group relative rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isRestoring || isDeleting}
            aria-label={`Restore ${title}`}
            onClick={() =>
              startRestore(async () => {
                await onRestore(id);
              })
            }
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            disabled={isRestoring || isDeleting}
            aria-label={`Permanently delete ${title}`}
            onClick={() =>
              startDelete(async () => {
                await onDelete(id);
              })
            }
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <h2 className="truncate font-semibold">{title}</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {fileName}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {trashedAt
            ? `Trashed ${new Date(trashedAt).toLocaleDateString()}`
            : "Trashed"}
        </span>
      </div>
    </article>
  );
}
