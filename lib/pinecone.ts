import "server-only";

import { Pinecone } from "@pinecone-database/pinecone";

let _pineconeClient: Pinecone | null = null;

export function getPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY environment variable. Please set PINECONE_API_KEY in your Vercel/environment settings.");
  }
  if (!_pineconeClient) {
    _pineconeClient = new Pinecone({ apiKey });
  }
  const indexName =
    process.env.PINECONE_INDEX_NAME || process.env.PINECONE_INDEX || "braindock";

  return process.env.PINECONE_HOST
    ? _pineconeClient.index(indexName, process.env.PINECONE_HOST)
    : _pineconeClient.index(indexName);
}

export const pineconeIndex = new Proxy({} as ReturnType<Pinecone["index"]>, {
  get(_target, prop) {
    const index = getPineconeIndex();
    const val = (index as any)[prop];
    if (typeof val === "function") {
      return val.bind(index);
    }
    return val;
  },
});