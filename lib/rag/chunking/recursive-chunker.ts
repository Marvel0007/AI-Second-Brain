export interface ChunkOptions {
  chunkSize?: number;       // Default ~800 chars (~200 tokens)
  chunkOverlap?: number;    // Default ~150 chars (~35 tokens)
  separators?: string[];
}

const DEFAULT_SEPARATORS = [
  "\n\n",  // Paragraphs
  "\n",    // Line breaks
  ". ",    // Sentences
  "? ",    // Question sentences
  "! ",    // Exclamation sentences
  "; ",    // Semicolons
  ", ",    // Clauses
  " ",     // Words
  "",      // Fallback: character level
];

/**
 * Production-grade Recursive Structure-Aware Text Splitter.
 * Recursively splits text using semantic boundaries (paragraphs -> sentences -> clauses -> words)
 * to ensure that semantic units remain intact while strictly adhering to token/character limits.
 */
export function recursiveSplitText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const chunkSize = options.chunkSize ?? 800;
  const chunkOverlap = options.chunkOverlap ?? 150;
  const separators = options.separators ?? DEFAULT_SEPARATORS;

  if (!text || text.trim().length === 0) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [text.trim()];
  }

  return splitTextInternal(text, chunkSize, chunkOverlap, separators);
}

function splitTextInternal(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separators: string[]
): string[] {
  const finalChunks: string[] = [];

  // Find the highest priority separator that exists in the text
  let chosenSeparator = separators[separators.length - 1]; // default to char level
  let newSeparators: string[] = [];

  for (let i = 0; i < separators.length; i++) {
    const sep = separators[i];
    if (sep === "" || text.includes(sep)) {
      chosenSeparator = sep;
      newSeparators = separators.slice(i + 1);
      break;
    }
  }

  // Split text by the chosen separator
  const splits = chosenSeparator === "" ? Array.from(text) : text.split(chosenSeparator);

  const goodSplits: string[] = [];

  for (const s of splits) {
    if (s.length < chunkSize) {
      goodSplits.push(s);
    } else {
      if (goodSplits.length > 0) {
        const merged = mergeSplits(goodSplits, chosenSeparator, chunkSize, chunkOverlap);
        finalChunks.push(...merged);
        goodSplits.length = 0;
      }
      if (newSeparators.length === 0) {
        finalChunks.push(s);
      } else {
        const subChunks = splitTextInternal(s, chunkSize, chunkOverlap, newSeparators);
        finalChunks.push(...subChunks);
      }
    }
  }

  if (goodSplits.length > 0) {
    const merged = mergeSplits(goodSplits, chosenSeparator, chunkSize, chunkOverlap);
    finalChunks.push(...merged);
  }

  return finalChunks.filter((c) => c.trim().length > 0);
}

function mergeSplits(
  splits: string[],
  separator: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const docs: string[] = [];
  const currentDoc: string[] = [];
  let totalLength = 0;

  for (const split of splits) {
    const splitLen = split.length;
    const separatorLen = currentDoc.length > 0 ? separator.length : 0;

    if (totalLength + separatorLen + splitLen > chunkSize && currentDoc.length > 0) {
      const doc = currentDoc.join(separator).trim();
      if (doc) docs.push(doc);

      // Apply overlap: Keep trailing splits that fit within chunkOverlap
      while (
        totalLength > chunkOverlap ||
        (totalLength + separatorLen + splitLen > chunkSize && totalLength > 0)
      ) {
        const removed = currentDoc.shift();
        if (removed) {
          totalLength -= removed.length + (currentDoc.length > 0 ? separator.length : 0);
        }
      }
    }

    currentDoc.push(split);
    totalLength += splitLen + (currentDoc.length > 1 ? separator.length : 0);
  }

  const finalDoc = currentDoc.join(separator).trim();
  if (finalDoc) {
    docs.push(finalDoc);
  }

  return docs;
}
