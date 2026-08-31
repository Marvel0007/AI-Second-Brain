import "server-only";

import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;

if (!apiKey) {
  throw new Error("Missing PINECONE_API_KEY");
}

const pinecone = new Pinecone({
  apiKey,
});

const indexName =
  process.env.PINECONE_INDEX_NAME || process.env.PINECONE_INDEX || "braindock";

export const pineconeIndex = process.env.PINECONE_HOST
  ? pinecone.index(indexName, process.env.PINECONE_HOST)
  : pinecone.index(indexName);