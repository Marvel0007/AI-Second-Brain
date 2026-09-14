"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  RefreshCw,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { getChatMessages } from "@/actions/chat/get-messages";
import { regenerateMessage } from "@/actions/chat/regenerate-message";
import { MarkdownRenderer } from "./markdown-renderer";
import { CitationDrawer } from "./citation-drawer";
import { Badge } from "@/components/ui/badge";

type Source = {
  chunkId: string;
  documentId: string;
  title: string;
  fileName: string;
  pageNumber?: number;
  sectionTitle?: string;
  snippet?: string;
  score?: number;
  relevanceScore?: number;
  citationIndex?: number;
};

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
  sources?: Source[];
};

type ChatWindowProps = {
  chatId: string;
};

const STARTER_PROMPTS = [
  "Summarize the key themes across my uploaded documents",
  "What are the main findings and conclusions?",
  "Extract actionable recommendations and next steps",
  "List any risks, limitations, or caveats mentioned",
];

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [citationDrawerOpen, setCitationDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Load chat messages on mount/chatId change
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        setError("");

        const data = await getChatMessages(chatId);

        setMessages(
          data.map((message) => ({
            ...message,
            sources: Array.isArray(message.sources)
              ? (message.sources as unknown as Source[])
              : [],
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load chat history.");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId]);

  // Smooth scroll to bottom on new tokens / messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending, streamingStatus]);

  function handleOpenCitation(chunkId: string) {
    setSelectedChunkId(chunkId);
    setCitationDrawerOpen(true);
  }

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  }

  async function handleRegenerate(userMessageId: string) {
    if (regeneratingId || sending) return;

    setError("");
    setRegeneratingId(userMessageId);

    try {
      const result = await regenerateMessage(chatId, userMessageId);

      const assistantMessage: Message = {
        id: result.message.id,
        role: result.message.role,
        content: result.message.content,
        createdAt: result.message.createdAt,
        sources: Array.isArray(result.message.sources)
          ? (result.message.sources as unknown as Source[])
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate response."
      );
    } finally {
      setRegeneratingId(null);
    }
  }

  // SSE Streaming Send Handler
  async function handleSend(customText?: string) {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || sending) return;

    setInput("");
    setError("");
    setSending(true);
    setStreamingStatus("Analyzing query & searching knowledge base...");

    // 1. Optimistic User Message
    const userMsgId = crypto.randomUUID();
    const temporaryUserMessage: Message = {
      id: userMsgId,
      role: "USER",
      content: textToSend,
      createdAt: new Date(),
    };

    // 2. Placeholder Assistant Message for live token appending
    const assistantMsgId = crypto.randomUUID();
    const temporaryAssistantMessage: Message = {
      id: assistantMsgId,
      role: "ASSISTANT",
      content: "",
      createdAt: new Date(),
      sources: [],
    };

    setMessages((prev) => [...prev, temporaryUserMessage, temporaryAssistantMessage]);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          content: textToSend,
          messageId: userMsgId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const streamAccumulator = {
        content: "",
        sources: [] as Source[],
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const eventMatch = block.match(/^event:\s*(\w+)/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (eventType === "status") {
            setStreamingStatus(data.message);
          } else if (eventType === "metadata") {
            if (Array.isArray(data.sources)) {
              streamAccumulator.sources = data.sources;
              const currentSources = streamAccumulator.sources;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, sources: currentSources }
                    : msg
                )
              );
            }
          } else if (eventType === "token") {
            setStreamingStatus(null);
            streamAccumulator.content += data.token;
            const updatedContent = streamAccumulator.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: updatedContent }
                  : msg
              )
            );
          } else if (eventType === "done") {
            setStreamingStatus(null);
            if (data.messageId) {
              const finalContent = streamAccumulator.content;
              const finalSources = streamAccumulator.sources;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, id: data.messageId, content: finalContent, sources: finalSources }
                    : msg
                )
              );
            }
            window.dispatchEvent(new Event("chat-updated"));
          } else if (eventType === "error") {
            throw new Error(data.message || "Error during streaming");
          }
        }
      }
    } catch (err) {
      console.error("[Stream Client Error]", err);
      // Remove failed placeholder assistant message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMsgId)
      );
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
      setStreamingStatus(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background/50">
      {/* Scrollable Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="my-auto flex min-h-[55vh] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                <Sparkles className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-xl font-bold tracking-tight">
                Ask BrainDock AI
              </h2>

              <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Query your documents with grounded citations, multi-query expansion, and cross-encoder reranking.
              </p>

              {/* Starter Prompt Chips */}
              <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between rounded-xl border bg-card/60 p-3 text-left text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground hover:shadow-xs group cursor-pointer"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-primary shrink-0 ml-2 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Loop */}
          {messages.map((message) => {
            const isUser = message.role === "USER";
            const msgSources = message.sources || [];

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
              >
                <div
                  className={
                    isUser
                      ? "flex max-w-[85%] flex-col items-end sm:max-w-[80%]"
                      : "w-full max-w-[92%] sm:max-w-[85%]"
                  }
                >
                  {/* Bubble Container */}
                  <div
                    className={
                      isUser
                        ? "rounded-2xl rounded-tr-xs bg-gradient-to-br from-primary to-primary/80 px-4 py-3 text-primary-foreground shadow-md transition-shadow"
                        : "rounded-2xl rounded-tl-xs border border-border/50 bg-card/95 p-5 shadow-sm backdrop-blur-md"
                    }
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <div>
                        {/* Assistant Header */}
                        <div className="mb-3 flex items-center justify-between border-b pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Sparkles className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-semibold tracking-tight">BrainDock AI</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(message.id, message.content)}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Streamed or Rendered Content */}
                        {message.content ? (
                          <MarkdownRenderer
                            content={message.content}
                            sources={msgSources}
                            onCitationClick={handleOpenCitation}
                          />
                        ) : sending && streamingStatus ? (
                          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground animate-pulse">
                            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                            <span>{streamingStatus}</span>
                          </div>
                        ) : null}

                        {/* Grounded Sources Footer Pills */}
                        {msgSources.length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <div className="mb-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <BookOpen className="h-3 w-3 text-primary" />
                                Grounded Sources ({msgSources.length})
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Click to verify citation
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {msgSources.map((source, sIdx) => {
                                const score = source.relevanceScore ?? source.score ?? 0;
                                const matchPct = Math.round(score * 100);

                                return (
                                  <button
                                    key={source.chunkId || sIdx}
                                    type="button"
                                    onClick={() => handleOpenCitation(source.chunkId)}
                                    className="group flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-left text-xs transition-all hover:border-primary/40 hover:bg-muted hover:shadow-xs cursor-pointer"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    <span className="max-w-[140px] truncate font-medium text-foreground">
                                      {source.title || source.fileName}
                                    </span>
                                    {matchPct > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="h-4 px-1 text-[10px] font-mono font-medium"
                                      >
                                        {matchPct}%
                                      </Badge>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User message regenerate action */}
                  {isUser && (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegenerate(message.id)}
                        disabled={!!regeneratingId || sending}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 cursor-pointer"
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${regeneratingId === message.id ? "animate-spin text-primary" : ""
                            }`}
                        />
                        {regeneratingId === message.id ? "Regenerating..." : "Regenerate"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Live Status Pill when initializing retrieval/reranking */}
          {sending && streamingStatus && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary max-w-fit animate-in fade-in duration-150">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="font-medium">{streamingStatus}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="shrink-0 border-t bg-card/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-4xl p-4 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-primary/50 transition-all"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
              rows={1}
              placeholder="Ask anything about your documents... (Shift+Enter for newline)"
              className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Send message"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Grounded with Hybrid RRF + Cohere Cross-Encoder Rerank
            </span>
            <span>Llama-3.3-70B</span>
          </div>
        </div>
      </div>

      {/* Slide-out Citation Inspection Drawer */}
      <CitationDrawer
        chunkId={selectedChunkId}
        open={citationDrawerOpen}
        onOpenChange={setCitationDrawerOpen}
      />
    </div>
  );
}
