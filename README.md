# 🧠 BrainDock — AI Second Brain & Knowledge Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge&logo=pinecone)](https://www.pinecone.io/)
[![Cohere](https://img.shields.io/badge/Cohere-Embeddings_%26_Rerank-39594C?style=for-the-badge)](https://cohere.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)

> **A private, enterprise-grade AI knowledge base that answers with proof.** BrainDock lets you ingest, organize, search, analyze, and chat with your documents using an Advanced Retrieval-Augmented Generation (RAG) pipeline backed by verifiable, claim-level citations.

---

## 🎥 Demo Video

▶️ **Watch the Project Demo:** [https://www.youtube.com/watch?v=hZ1qRb72VWM](https://www.youtube.com/watch?v=hZ1qRb72VWM)

---

## 🌟 Key Highlights

- **🎯 100% Grounded Inline Citations**: Answers contain click-to-view source citations `[cite:docId:chunkId]` mapping directly to exact document snippets, page numbers, and similarity rankings.
- **⚡ Hybrid Retrieval with Reciprocal Rank Fusion (RRF)**: Combines dense vector semantic search (Pinecone) with sparse full-text keyword search (PostgreSQL) using RRF scoring.
- **🔄 Two-Stage Reranking (Cohere Rerank v3.5)**: Cross-encoder reranks top retrieved candidates to elevate high-relevance chunks and eliminate vector hallucinations.
- **🧩 Hierarchical Parent-Child Chunking**: Small child chunks optimized for vector search are mapped back to parent contextual blocks for high-fidelity LLM synthesis.
- **🔬 RAG Triad Automated Evaluation**: Live QA metrics evaluating **Faithfulness** (groundedness), **Answer Relevance**, and **Context Precision** with unsupported claims auditing.
- **📊 Real-time Pipeline Observability & Telemetry**: Measures granular latency across embedding generation, retrieval, reranking, and generation with token usage tracking.
- **💡 Document Intelligence & Study Tools**: Instant executive summaries, key takeaways, flashcards, and interactive multi-choice quizzes generated from your files.
- **⚖️ Cross-Document Comparison Workbench**: Side-by-side synthesis and contrast matrices across multiple documents.
- **🔐 Multi-Tenant Workspace Isolation**: Isolated document storage, vector namespaces, collections, tags, and trash recovery with Clerk authentication.

---

## 🏗️ System Architecture

```text
                                 ┌──────────────────────────────────┐
                                 │       Uploaded Document          │
                                 │   (PDF, Markdown, Code, CSV)     │
                                 └─────────────────┬────────────────┘
                                                   │
                                      [ unpdf / Document Parser ]
                                                   │
                                                   ▼
                                 ┌──────────────────────────────────┐
                                 │ Hierarchical Parent-Child Chunks │
                                 │  Parent: ~1800 chars (Context)   │
                                 │  Child:  ~500 chars (Search)     │
                                 └─────────────────┬────────────────┘
                                                   │
                        ┌──────────────────────────┴──────────────────────────┐
                        ▼                                                     ▼
         [ Cohere Embeddings (1024-dim) ]                             [ PostgreSQL ]
                        ▼                                                     ▼
           [ Pinecone Vector Index ]                                  [ Full-Text Index ]
                        │                                                     │
════════════════════════╪═════════════════════════════════════════════════════╪════════════════════════
                        │                   QUERY TIME                        │
════════════════════════╪═════════════════════════════════════════════════════╪════════════════════════
                        │
                User Query / Prompt
                        │
                        ▼
          [ Query Analyzer & Expander ]
          - Intent Classification
          - Multi-Query Variations
          - HyDE (Hypothetical Embeddings)
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    [ Dense Search ]          [ Sparse Search ]
   (Pinecone Vectors)        (Postgres Keywords)
           └────────────┬────────────┘
                        ▼
         [ Reciprocal Rank Fusion (RRF) ]
                        ▼
         [ Cohere Rerank v3.5 (Top-N) ]
                        ▼
        [ Grounded Context Construction ]
                        ▼
       [ Google Gemini 3.6 Flash / Groq ]
                        │
                        ├──────────────────────────┐
                        ▼                          ▼
               Streaming Answer           Telemetry & Observability
             with Inline Citations       (Latency, RAG Triad Scores)
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Route Handlers) |
| **Frontend UI** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), Base UI |
| **Markdown & Formatting** | `react-markdown`, `remark-gfm`, `@tailwindcss/typography` |
| **Authentication** | [Clerk](https://clerk.com/) (Session management, user workspaces) |
| **Database & ORM** | [Neon PostgreSQL](https://neon.tech/), [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| **Vector Storage** | [Pinecone Serverless](https://www.pinecone.io/) (1024-dimension index) |
| **File Storage** | [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) |
| **Embeddings** | [Cohere](https://cohere.com/) `embed-english-v3.0` (1024 dimensions, batch-processed) |
| **Reranking** | [Cohere](https://cohere.com/) `rerank-v3.5` Cross-Encoder |
| **LLM Inference** | [Google Gemini](https://ai.google.dev/) (`gemini-3.6-flash`), [Groq](https://groq.com/) |
| **Document Parsing** | [unpdf](https://github.com/unjs/unpdf) for robust multi-page PDF text extraction |

---

## 📁 Repository Structure

```text
ai-second-brain/
├── actions/                  # Next.js Server Actions
│   ├── chat/                 # Chat sessions, message handling & citation resolution
│   ├── documents/            # Ingestion, chunking, embeddings & insights generation
│   ├── evaluation/           # RAG Triad test execution & statistics
│   ├── observability/        # Query telemetry & latency retrieval
│   └── users.ts              # Clerk user-to-database synchronization
├── app/                      # Next.js App Router
│   ├── (auth)/               # Sign-in & sign-up pages
│   ├── api/chat/stream/      # SSE streaming endpoint for grounded RAG chat
│   ├── dashboard/
│   │   ├── chat/             # Interactive chat interface with source drawer
│   │   ├── documents/        # File library, chunk inspector & study insights
│   │   ├── evaluation/       # RAG Triad benchmark suite & accuracy logs
│   │   ├── favorites/        # Bookmarked high-priority documents
│   │   ├── search/           # Hybrid vector & keyword search explorer
│   │   ├── trash/            # Soft-delete recovery management
│   │   └── page.tsx          # Analytics dashboard (latency, tokens, document stats)
│   ├── layout.tsx            # Root layout & providers
│   └── page.tsx              # Landing page
├── components/               # UI & Feature Components
│   ├── chat/                 # Chat window, citation drawer, markdown renderer
│   ├── dashboard/            # Navigation, header, sidebar
│   ├── documents/            # Upload dropzone, document cards, chunk/insight tabs
│   ├── evaluation/           # RAG Triad dashboard & metrics visualizer
│   ├── insights/             # Multi-document comparison workbench
│   └── ui/                   # Reusable UI primitives
├── lib/
│   ├── ai/                   # Google Gemini & Groq SDK client instances
│   ├── prisma.ts             # Prisma client connection manager
│   ├── pinecone.ts           # Pinecone index client
│   └── rag/                  # Core RAG Modular Engine
│       ├── chunking/         # Parent-Child & recursive text chunkers
│       ├── embeddings/       # Batch Cohere embedder with retry backoff
│       ├── evaluation/       # Faithfulness, relevance & precision judge
│       ├── ingestion/        # Document text cleaner & multi-format parser
│       ├── observability/    # Pipeline latency & telemetry tracking
│       ├── pipeline/         # Orchestrated RAG execution engine
│       ├── reasoning/        # Query analyzer, HyDE & multi-doc synthesizer
│       ├── reranking/        # Cohere v3.5 cross-encoder reranker
│       ├── retrieval/        # Dense, sparse & RRF hybrid retrievers
│       └── tools/            # Summaries, flashcards & quiz generators
└── prisma/
    └── schema.prisma         # Database schema (Workspaces, Documents, Chunks, Evals, Logs)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.18+ or v20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Neon PostgreSQL](https://neon.tech/) database (or local PostgreSQL)
- API keys for:
  - [Clerk](https://clerk.com/) (Authentication)
  - [Cohere](https://cohere.com/) (Embeddings & Reranking)
  - [Pinecone](https://www.pinecone.io/) (Vector Database, 1024-dim cosine index)
  - [Google Gemini](https://ai.google.dev/) or [Groq](https://groq.com/) (LLM Generation)
  - [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (Document upload storage)

---

### 1. Clone the Repository

```bash
<<<<<<< HEAD
git clone https://github.com/Marvel0007/ai-second-brain.git
cd ai-second-brain
=======
git clone https://github.com/Marvel0007/Ai-Second-Brain.git
cd Ai-Second-Brain/ai-second-brain
>>>>>>> c80e295 (docs: update README with full system architecture, RAG pipeline, and tech stack)
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=verify-full"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BLOB_STORE_ID=store_...

# AI & LLM Providers
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
COHERE_API_KEY=...

# Vector Database (Pinecone)
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=braindock
PINECONE_HOST=https://braindock-...pinecone.io
```

> **Pinecone Setup Note**: When creating your Pinecone index, set the dimensions to **1024** and metric to **cosine** (matching Cohere `embed-english-v3.0`).

### 4. Initialize Database Schema

Generate Prisma client and push the schema to PostgreSQL:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 RAG Triad Quality Benchmarks

BrainDock incorporates automated RAG evaluation inspired by the RAG Triad framework:

| Metric | Target | Description |
| :--- | :---: | :--- |
| **Faithfulness** | `> 0.90` | Percentage of generated claims directly supported by retrieved context. |
| **Answer Relevance** | `> 0.85` | Degree to which the answer directly addresses the user's inquiry without extraneous fluff. |
| **Context Precision** | `> 0.80` | Proportion of retrieved chunks that contributed relevant signal to the final answer. |

You can execute evaluation suites directly from `/dashboard/evaluation` to test query accuracy against ground-truth benchmarks.

---

## 📈 Observability & Metrics

Every query processed through BrainDock records telemetry to `PipelineLog`:
- **Embedding Latency**: Time spent generating query embeddings via Cohere.
- **Retrieval Latency**: Dual dense/sparse parallel execution speed.
- **Rerank Latency**: Cross-encoder scoring time.
- **LLM Latency**: Generation time and token consumption.
- **Total Pipeline Time**: End-to-end user wait time.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Shivam Shukla**
- GitHub: [@Marvel0007](https://github.com/Marvel0007)
- Repository: [Ai-Second-Brain](https://github.com/Marvel0007/Ai-Second-Brain)
