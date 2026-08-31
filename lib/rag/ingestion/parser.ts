import { extractText as extractPdfText } from "unpdf";
import { cleanExtractedText, estimateTokenCount } from "./cleaner";

export interface ParsedSection {
  pageNumber: number;
  content: string;
  sectionTitle?: string;
  tokenCount: number;
}

export interface ParsedDocument {
  fileName: string;
  fileType: string;
  sections: ParsedSection[];
  fullText: string;
  totalCharacters: number;
  totalTokens: number;
}

/**
 * Detect primary heading or section title in a text chunk.
 */
function extractSectionTitle(text: string): string | undefined {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  for (const line of lines.slice(0, 3)) {
    // Markdown headers (# Title, ## Title)
    const mdMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (mdMatch) return mdMatch[1].trim();

    // All-caps headers (e.g., "1. INTRODUCTION", "SECTION A")
    if (/^[A-Z0-9\s.,:-]{4,60}$/.test(line) && line.length > 5) {
      return line.trim();
    }
  }
  return undefined;
}

/**
 * Universal document parser supporting PDFs, Markdown, Plain Text, Code, CSV, and JSON.
 */
export async function parseDocument(
  fileBuffer: ArrayBuffer | Uint8Array,
  fileName: string,
  mimeType?: string
): Promise<ParsedDocument> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const uint8 = new Uint8Array(fileBuffer);
  const sections: ParsedSection[] = [];

  const isPdf = mimeType === "application/pdf" || ext === "pdf";

  if (isPdf) {
    try {
      const { text: pages } = await extractPdfText(uint8);

      pages.forEach((rawPageText, index) => {
        const cleaned = cleanExtractedText(rawPageText);
        if (cleaned.length > 0) {
          const sectionTitle = extractSectionTitle(cleaned);
          sections.push({
            pageNumber: index + 1,
            content: cleaned,
            sectionTitle,
            tokenCount: estimateTokenCount(cleaned),
          });
        }
      });
    } catch (err) {
      throw new Error(
        `Failed to parse PDF "${fileName}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  } else {
    // Text-based formats: Markdown, TXT, Code, CSV, JSON
    const decoder = new TextDecoder("utf-8");
    const rawContent = decoder.decode(uint8);
    const cleaned = cleanExtractedText(rawContent);

    if (!cleaned) {
      throw new Error(`File "${fileName}" contains no readable text content.`);
    }

    // Split markdown / text by headers or large section breaks if long
    const markdownSections = cleaned.split(/(?=\n#{1,3}\s+)/g);

    if (markdownSections.length > 1) {
      markdownSections.forEach((sectionContent) => {
        const trimmed = sectionContent.trim();
        if (trimmed) {
          sections.push({
            pageNumber: 1,
            content: trimmed,
            sectionTitle: extractSectionTitle(trimmed),
            tokenCount: estimateTokenCount(trimmed),
          });
        }
      });
    } else {
      sections.push({
        pageNumber: 1,
        content: cleaned,
        sectionTitle: extractSectionTitle(cleaned),
        tokenCount: estimateTokenCount(cleaned),
      });
    }
  }

  if (sections.length === 0) {
    throw new Error(`No extractable text found in file "${fileName}".`);
  }

  const fullText = sections.map((s) => s.content).join("\n\n");
  const totalCharacters = fullText.length;
  const totalTokens = sections.reduce((acc, s) => acc + s.tokenCount, 0);

  return {
    fileName,
    fileType: isPdf ? "application/pdf" : mimeType || `text/${ext}`,
    sections,
    fullText,
    totalCharacters,
    totalTokens,
  };
}
