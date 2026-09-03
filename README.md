# StreamForge — High-Performance File Processing & Background Job System

StreamForge is a scalable backend system for **asynchronous file processing** using **Node.js, TypeScript, Fastify, PostgreSQL, Prisma, Redis, and BullMQ**.

The system separates file uploads from heavy background processing by using a reliable job queue, allowing the API to remain responsive while workers process files asynchronously.

## 🚀 Features

* 📤 File upload and storage management
* ⚡ Asynchronous background file processing
* 🔄 BullMQ-based job queue with Redis
* 🔁 Automatic job retries with exponential backoff
* ❌ Job cancellation support
* 🔂 Duplicate job prevention and idempotency
* 🗄️ PostgreSQL database with Prisma ORM
* 🔐 Database-level protection against concurrent active jobs
* 📊 Job processing metadata and statistics
* ⏸️ Queue pause/resume controls
* 🧵 Configurable worker concurrency
* 🐳 Dockerized PostgreSQL and Redis infrastructure
* 🛡️ Centralized error handling and validation
* ❤️ Graceful worker shutdown
* 📈 Processing metrics such as processed bytes and processing time

## 🏗️ Architecture

```text
Client
  │
  ▼
Fastify API
  │
  ├── File Upload
  │      │
  │      ▼
  │   Storage
  │
  └── Job Creation
         │
         ▼
      Redis
     BullMQ Queue
         │
         ▼
   Background Worker
         │
         ▼
   File Processing
         │
         ▼
 PostgreSQL
   Job + File Status
```

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Fastify
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Queue:** BullMQ
* **Message Broker:** Redis
* **Infrastructure:** Docker & Docker Compose
* **Validation:** Zod
* **API Testing:** cURL / Postman
* **Version Control:** Git & GitHub

## 🎯 Engineering Concepts

StreamForge focuses on real-world backend engineering concepts including:

* Asynchronous processing
* Distributed job queues
* Worker architecture
* Retry strategies
* Exponential backoff
* Idempotency
* Race-condition prevention
* Database transactions
* Partial unique indexes
* Graceful shutdown
* Concurrency control
* Failure handling
* Queue management
* Observability and processing metrics

## 📌 Example Workflow

1. Client uploads a file.
2. API validates and stores the file.
3. A processing job is created.
4. Job is added to the BullMQ queue.
5. Background worker picks up the job.
6. Worker processes the stored file.
7. Processing metadata is recorded.
8. Job and file status are updated to `COMPLETED`.
9. Failed jobs can automatically retry or be manually retried.

## 📂 Project Goal

StreamForge was built to demonstrate how production-style backend systems handle **large workloads, asynchronous tasks, failures, retries, concurrency, and data consistency** without blocking API requests.

The project is designed as a foundation that can be extended with features such as object storage, authentication, multiple processing pipelines, monitoring, rate limiting, and distributed workers.
