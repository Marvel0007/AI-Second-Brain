"use client";

import { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  ListCheck,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  summarizeDocument,
  getDocumentStudyNotes,
  getDocumentFlashcards,
} from "@/actions/documents/generate-insights";

interface DocumentInsightsTabProps {
  documentId: string;
}

type TabType = "summary" | "study-notes" | "quiz";

interface SummaryData {
  summary: string;
  keyTakeaways: string[];
  mainTopics: string[];
  actionItems?: string[];
}

interface StudyNotesData {
  title: string;
  overview: string;
  keyConcepts: Array<{ term: string; explanation: string }>;
  detailedSections: Array<{ sectionName: string; keyPoints: string[] }>;
  summaryTakeaway: string;
}

interface FlashcardsQuizData {
  flashcards: Array<{ question: string; answer: string; topic: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export function DocumentInsightsTab({ documentId }: DocumentInsightsTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [studyNotesData, setStudyNotesData] = useState<StudyNotesData | null>(null);
  const [quizData, setQuizData] = useState<FlashcardsQuizData | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedFlashcards, setRevealedFlashcards] = useState<Record<number, boolean>>({});

  async function handleLoadSummary() {
    setLoading(true);
    setError("");
    try {
      const data = await summarizeDocument(documentId);
      setSummaryData(data as unknown as SummaryData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadStudyNotes() {
    setLoading(true);
    setError("");
    try {
      const data = await getDocumentStudyNotes(documentId);
      setStudyNotesData(data as unknown as StudyNotesData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate study notes");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadQuiz() {
    setLoading(true);
    setError("");
    try {
      const data = await getDocumentFlashcards(documentId);
      setQuizData(data as unknown as FlashcardsQuizData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("summary");
            if (!summaryData && !loading) handleLoadSummary();
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "summary"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Executive Summary</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("study-notes");
            if (!studyNotesData && !loading) handleLoadStudyNotes();
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "study-notes"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Study Guide</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("quiz");
            if (!quizData && !loading) handleLoadQuiz();
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "quiz"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Flashcards & Quiz</span>
        </button>
      </div>

      {loading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground animate-in fade-in">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs">Generating AI insights with Llama-3.3-70B...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* --- TAB 1: SUMMARY --- */}
      {activeTab === "summary" && !loading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!summaryData ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
              <Sparkles className="h-8 w-8 text-primary/70 mb-3" />
              <h4 className="font-semibold text-sm">Generate AI Executive Summary</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Synthesize key themes, high-level takeaways, and actionable bullet points from this document.
              </p>
              <Button
                onClick={handleLoadSummary}
                className="mt-4 gap-2 rounded-xl text-xs cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Summary
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Summary */}
              <div className="rounded-2xl border bg-card/70 p-5 backdrop-blur-xs shadow-xs">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Overview</span>
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {summaryData.summary}
                </p>
              </div>

              {/* Main Topics */}
              {summaryData.mainTopics?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Main Topics Covered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.mainTopics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 text-xs font-medium">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {summaryData.keyTakeaways?.length > 0 && (
                <div className="rounded-2xl border bg-card/70 p-5 shadow-xs">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <ListCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Key Takeaways</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {summaryData.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: STUDY NOTES --- */}
      {activeTab === "study-notes" && !loading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!studyNotesData ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
              <BookOpen className="h-8 w-8 text-primary/70 mb-3" />
              <h4 className="font-semibold text-sm">Generate Comprehensive Study Guide</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Extract key definitions, detailed section breakdowns, and structured study notes.
              </p>
              <Button
                onClick={handleLoadStudyNotes}
                className="mt-4 gap-2 rounded-xl text-xs cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Generate Study Guide
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Concept Glossary */}
              {studyNotesData.keyConcepts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Key Concepts & Terminology
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {studyNotesData.keyConcepts.map((item, idx) => (
                      <div key={idx} className="rounded-xl border bg-card/60 p-4 shadow-xs">
                        <p className="text-xs font-bold text-primary">{item.term}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Breakdown */}
              {studyNotesData.detailedSections?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Section Breakdown
                  </h4>
                  {studyNotesData.detailedSections.map((sec, sIdx) => (
                    <div key={sIdx} className="rounded-2xl border bg-card/70 p-5 shadow-xs">
                      <h5 className="font-semibold text-xs text-foreground mb-3 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                          {sIdx + 1}
                        </span>
                        <span>{sec.sectionName}</span>
                      </h5>
                      <ul className="space-y-2 list-disc list-inside text-xs text-muted-foreground leading-relaxed">
                        {sec.keyPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FLASHCARDS & QUIZ --- */}
      {activeTab === "quiz" && !loading && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {!quizData ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center bg-muted/10">
              <GraduationCap className="h-8 w-8 text-primary/70 mb-3" />
              <h4 className="font-semibold text-sm">Generate Flashcards & Knowledge Quiz</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Test your understanding with active recall flashcards and interactive multiple-choice questions.
              </p>
              <Button
                onClick={handleLoadQuiz}
                className="mt-4 gap-2 rounded-xl text-xs cursor-pointer"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Generate Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Flashcards */}
              {quizData.flashcards?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                    <span>Interactive Flashcards ({quizData.flashcards.length})</span>
                    <span className="text-[11px] font-normal">Click card to reveal answer</span>
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {quizData.flashcards.map((card, idx) => {
                      const isRevealed = revealedFlashcards[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setRevealedFlashcards((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className={`cursor-pointer rounded-2xl border p-5 transition-all min-h-[140px] flex flex-col justify-between ${
                            isRevealed
                              ? "bg-primary/5 border-primary/40 shadow-xs"
                              : "bg-card hover:border-primary/30"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-[10px]">
                                {card.topic || `Card #${idx + 1}`}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {isRevealed ? "Hide Answer" : "Show Answer"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              {card.question}
                            </p>
                          </div>

                          {isRevealed && (
                            <div className="mt-3 border-t pt-2.5 text-xs text-primary font-medium animate-in fade-in">
                              {card.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multiple Choice Quiz */}
              {quizData.quiz?.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Multiple-Choice Knowledge Check
                  </h4>
                  {quizData.quiz.map((q, qIdx) => {
                    const chosen = selectedAnswers[qIdx];
                    const isAnswered = chosen !== undefined;
                    const isCorrect = isAnswered && chosen === q.correctIndex;

                    return (
                      <div key={qIdx} className="rounded-2xl border bg-card/70 p-5 shadow-xs space-y-4">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {qIdx + 1}
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">
                            {q.question}
                          </p>
                        </div>

                        <div className="grid gap-2 pl-7">
                          {q.options.map((opt, optIdx) => {
                            const selected = chosen === optIdx;
                            let style = "border-border/60 bg-muted/20 hover:bg-muted/40";
                            if (isAnswered) {
                              if (optIdx === q.correctIndex) {
                                style = "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-medium";
                              } else if (selected && !isCorrect) {
                                style = "border-destructive bg-destructive/10 text-destructive";
                              } else {
                                style = "opacity-50";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={isAnswered}
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [qIdx]: optIdx,
                                  }))
                                }
                                className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-all cursor-pointer ${style}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && optIdx === q.correctIndex && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                                )}
                                {isAnswered && selected && !isCorrect && (
                                  <XCircle className="h-4 w-4 text-destructive shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="pl-7 pt-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
