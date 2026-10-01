<div align="center">

# Sensei
### Next-Gen AI-Powered Technical Interview & Screening Platform

Sensei is an end-to-end intelligent interview preparation and candidate screening platform. Powered by state-of-the-art LLMs, real-time voice transcription, and automated resume analysis, Sensei empowers candidates to master technical interviews and enables recruiters to screen and interview candidates with zero bias and superhuman efficiency.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-6.x-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Candidate Portal](#-candidate-portal)
  - [Recruiter Portal](#-recruiter-portal)
  - [Platform Admin Portal](#-platform-admin-portal)
- [System Architecture](#-system-architecture)
  - [1. Tiered Component Architecture](#1-high-level-tiered-component-architecture)
  - [2. Real-Time Multimodal Interview Loop](#2-real-time-multimodal-interview-loop)
  - [3. Asynchronous Resume Screening Pipeline](#3-asynchronous-resume-screening-pipeline)
  - [4. Architectural Patterns & Principles](#4-key-architectural-patterns--design-principles)
- [Anti-Abuse & Fair Play System](#-anti-abuse--fair-play-system)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database & Seed Scripts](#database--seed-scripts)
- [Environment Configuration](#-environment-configuration)
- [Scripts Reference](#-scripts-reference)
- [License](#-license)

---

## 🎯 Overview

Sensei bridges the gap between hiring teams and candidates:
- **For Candidates**: An interactive AI mock interviewer that conducts dynamic technical and behavioral interviews over text and voice, analyzes answers using STAR method criteria, and delivers detailed scorecards and resume improvement plans.
- **For Recruiters**: An automated pipeline that parses candidate resumes, computes matching scores, conducts preliminary screening interviews, and generates candidate evaluations.
- **For Administrators**: A unified portal to manage users, evaluate custom credit purchase requests (UPI/UTR verification), and supervise interview activities across the platform.

---

## 🌟 Key Features

### 👨‍💻 Candidate Portal
- **Practice Interviews**: Practice across diverse domains (Frontend, Backend, Fullstack, System Design, DevOps, Machine Learning, HR, Sales, etc.).
- **Real-Time Multimodal Voice & Text Interview**:
  - Live conversational UI with speech-to-text powered by Groq Whisper (`whisper-large-v3-turbo`).
  - Adaptive follow-ups: The AI probe deeper based on candidate responses.
  - Live pacing and filler word detection.
- **Comprehensive Scorecards & Analytics**:
  - Breakdown across Technical Knowledge, Communication, Problem Solving, Confidence, and STAR Method alignment.
  - Identification of key strengths, weaknesses, and targeted advice.
  - Tailored resume optimization tips based on the candidate's performance.
- **Application Tracking**: Submit applications for recruiter-posted openings and track screening and interview milestones in real time.

### 🏢 Recruiter Portal
- **Job Posting & Configuration**:
  - Define required and preferred technical skills, experience bands, and role expectations.
  - Configurable AI screening thresholds (e.g. automatic interview invitations for candidates scoring $\ge 80\%$).
- **AI Resume Screening Engine**:
  - Automated PDF/DOCX resume extraction via background workers.
  - Deep matching report: Skill match analysis, experience relevance, project credibility, and hire/pass recommendations.
- **Interview Review & Candidate Ranking**:
  - Review automated AI screening interviews, transcripts, and evaluation scorecards before scheduling final human rounds.
- **Credit & Billing Management**:
  - Flexible credit system with Razorpay integration and manual UPI QR-code purchase workflows.

### 🛡️ Platform Admin Portal
- **User & Role Management**: Oversee recruiters, candidates, and administrative access.
- **Credit Purchase Approvals**: Review and approve manual UPI payments and UTR transaction numbers submitted by users.
- **Practice Catalog Control**: Create, publish, feature, and manage practice scenarios and difficulty tiers.
- **Platform Analytics**: Monitor overall interview completion rates, active sessions, and system health.

---

## 🏗️ System Architecture

Sensei is built around an enterprise-grade, distributed architecture designed for low-latency voice interactions, resilient asynchronous document processing, and strict data consistency.

### 1. High-Level Tiered Component Architecture

```mermaid
flowchart TB
    %% Client Tier
    subgraph ClientTier["💻 Client Layer (Next.js 16 + React 19)"]
        UI["Candidate & Recruiter UI (Tailwind v4 / Framer Motion)"]
        AudioRec["Web Audio / MediaRecorder (Live Voice Stream)"]
        FPModule["@fingerprintjs/fingerprintjs (Free MIT Client FP)"]
        SocketCl["Socket.io Client (Real-time WSS Connection)"]
        QueryCache["TanStack Query Cache & Zustand State"]
    end

    %% Edge & Security Gateway
    subgraph GatewayTier["🛡️ Security & Ingress Layer"]
        ClerkAuth["Clerk Authentication (JWT / Session Verification)"]
        FPMiddleware["Device Binding & Anti-Abuse Lockout Guard"]
        RateLimit["Express Rate Limiter & Helmet Headers"]
        CORSMid["CORS Policy & Request Validation (Zod)"]
    end

    %% Application Core
    subgraph AppTier["⚙️ Application Core (Express 5 + TypeScript)"]
        APIRouters["REST API Controllers (Jobs, Applications, Credits)"]
        WSServer["Interview Socket.io Server (Clustered)"]
        SessionMgr["Interview Session & Timeout Manager"]
        QueueProducers["BullMQ Job Producers (Enqueue Heavy Workloads)"]
    end

    %% Real-time AI Engine
    subgraph AIEngineTier["🧠 Real-Time AI & Speech Engine"]
        WhisperSTT["Speech-to-Text: Groq Whisper (whisper-large-v3-turbo)"]
        LangGraphAgent["LangGraph Stateful Interview Graph\n(Adaptive Probing & Rubric Machine)"]
        LLMInference["LLM Reasoning: Google Gemini 3.8 Flash / Groq LLMs"]
        ScorecardEval["Multidimensional Scorecard & STAR Evaluator"]
    end

    %% Asynchronous Worker Tier
    subgraph WorkerTier["⚡ Asynchronous Background Workers (BullMQ)"]
        ResumeWorker["Resume Parser Worker (PDF-Parse / Mammoth)"]
        ScreeningWorker["AI Screening Engine (Skill Match & Credibility)"]
        ReportWorker["Final Scorecard & Feedback Synthesizer"]
    end

    %% Storage & Caching Tier
    subgraph DataTier["🗄️ Persistence & Cache Layer"]
        PostgresDB[("PostgreSQL\n(Prisma ORM 7 - Users, Jobs, Scorecards)")]
        RedisStore[("Redis\n(Socket Adapter Pub/Sub, BullMQ Queues, Sessions)")]
        S3Storage[("AWS S3 Bucket\n(Resumes, Transcripts, Artifacts)")]
    end

    %% External Cloud Integrations
    subgraph CloudTier["☁️ Cloud Services & Integrations"]
        BrevoAPI["Brevo REST API (sib-api-v3-sdk - Transactional Emails)"]
        PaymentGateway["Razorpay Gateway & UPI Payment Processing"]
    end

    %% Connections - Client to Gateway
    UI -->|HTTPS / REST| CORSMid
    UI -->|Clerk Session| ClerkAuth
    AudioRec -->|PCM / WebM Audio Chunks| SocketCl
    FPModule -->|Hardware Fingerprint| FPMiddleware
    SocketCl -->|WSS Protocol| WSServer

    %% Gateway to App
    CORSMid --> RateLimit
    RateLimit --> FPMiddleware
    FPMiddleware --> APIRouters

    %% App to AI & Workers
    APIRouters --> PostgresDB
    APIRouters --> QueueProducers
    QueueProducers -->|Enqueue Jobs| RedisStore
    RedisStore -->|Job Dispatch| WorkerTier

    %% WebSocket to AI Flow
    WSServer <-->|Pub/Sub Clustering| RedisStore
    WSServer --> SessionMgr
    WSServer -->|Raw Audio| WhisperSTT
    WhisperSTT -->|Transcribed Text| LangGraphAgent
    LangGraphAgent <-->|Context & Prompts| LLMInference
    LangGraphAgent --> WSServer

    %% Workers Processing
    ResumeWorker -->|Fetch Document| S3Storage
    ResumeWorker --> ScreeningWorker
    ScreeningWorker -->|Evaluate Profile| LLMInference
    ScreeningWorker --> PostgresDB
    ReportWorker --> ScorecardEval
    ReportWorker --> PostgresDB

    %% External Services
    APIRouters --> PaymentGateway
    ScreeningWorker -->|Email Status Alerts| BrevoAPI
    APIRouters -->|Pre-signed URLs| S3Storage
```

---

### 2. Real-Time Multimodal Interview Loop

The interview room operates on a bidirectional WebSocket state loop orchestrated by **LangGraph** and accelerated by **Groq Whisper**:

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as 👨‍💻 Candidate
    participant Browser as 🌐 Frontend Client
    participant SocketServer as ⚡ Socket.io Server
    participant Whisper as 🎙️ Groq Whisper STT
    participant LangGraph as 🧠 LangGraph Engine
    participant LLM as 🤖 Gemini / Groq LLM
    participant DB as 🗄️ PostgreSQL / Redis
    participant Queue as 📦 BullMQ Worker

    Candidate->>Browser: Enters interview room
    Browser->>SocketServer: connect { sessionToken, candidateId }
    SocketServer->>DB: Validate sessionToken & lock status
    SocketServer-->>Browser: session-authenticated { totalQuestions, currentQuestion }

    rect rgb(240, 248, 255)
        Note over Candidate, LLM: Interactive Q&A & Adaptive Probing Loop
        Candidate->>Browser: Speaks answer (or types text)
        Browser->>SocketServer: submit-answer { audioBlob / text, questionIndex }
        
        alt Voice Mode
            SocketServer->>Whisper: Transcribe audio stream (whisper-large-v3-turbo)
            Whisper-->>SocketServer: Raw transcript text & timing
        end

        SocketServer->>LangGraph: Process answer in InterviewState machine
        LangGraph->>LLM: Evaluate answer quality (Strong/Adequate/Weak/Vague)
        LLM-->>LangGraph: Quality rating & identified knowledge gaps
        
        alt Answer is vague or weak on key topic (≤ 2 follow-ups)
            LangGraph->>LLM: Generate targeted follow-up probe
        else Topic satisfied or max follow-ups reached
            LangGraph->>LLM: Rotate to next required skill / question
        end
        
        LLM-->>LangGraph: Next question generated
        LangGraph->>DB: Append Q&A to InterviewTranscript
        LangGraph-->>SocketServer: { nextQuestion, paceWPM, fillerWords, isFollowUp }
        SocketServer-->>Browser: question-delivered { question, index, progress }
        Browser-->>Candidate: Renders question & plays audio TTS
    end

    rect rgb(255, 245, 238)
        Note over Candidate, Queue: Final Question Completed & Scorecard Generation
        SocketServer->>DB: Mark session status = COMPLETED
        SocketServer->>Queue: Enqueue 'generate-scorecard' job
        SocketServer-->>Browser: interview-completed { redirectUrl }
        Queue->>LLM: Synthesize multi-dimensional rubric & STAR scorecard
        LLM-->>Queue: Scorecard (Technical, Problem Solving, Communication, Strengths/Weaknesses)
        Queue->>DB: Save Scorecard & ResumeFeedback records
    end
```

---

### 3. Asynchronous Resume Screening Pipeline

Resume evaluation and applicant ranking are offloaded to background queues to maintain sub-second UI responsiveness:

```mermaid
flowchart LR
    subgraph Step1["1. Resume Upload"]
        A[Candidate / Recruiter] -->|PDF / DOCX| B[Pre-signed AWS S3 URL]
        B --> C[(AWS S3 Bucket)]
    end

    subgraph Step2["2. Async Job Enqueue"]
        B -->|POST /applications| D[Express Controller]
        D -->|Add Job| E[BullMQ 'screening-queue']
        E --> F[(Redis Queue Broker)]
    end

    subgraph Step3["3. Extraction & Evaluation"]
        F --> G[Screening Background Worker]
        G -->|Fetch File| C
        G -->|Parse Text| H[PDF-Parse / Mammoth]
        H -->|Extracted Profile + Job Description| I[Google Gemini 3.8 Flash]
        I -->|Structured JSON Evaluation| J[Skill Match, Credibility & Decision]
    end

    subgraph Step4["4. Persistence & Notification"]
        J --> K[(PostgreSQL Database)]
        K --> L{Match Score ≥ Threshold?}
        L -->|Yes| M[Auto-Invite to AI Screening Interview]
        L -->|No| N[Review Status Updated]
        M --> O[Brevo REST API]
        O -->|Dispatch Invitation Email| A
    end
```

---

### 4. Key Architectural Patterns & Design Principles

| Architecture Pattern | Implementation in Sensei | Key Advantage |
| :--- | :--- | :--- |
| **Stateful AI Agent Loop** | Built with `@langchain/langgraph` state machines tracking topics covered, consecutive probes, and weak areas. | Prevents repetitive questions; enables contextual, human-like follow-up probing. |
| **Clustered WebSockets with Redis Pub/Sub** | Socket.io server wrapped with `@socket.io/redis-adapter` backed by Redis pub/sub. | Allows horizontal scaling across multiple application instances without dropping user connections. |
| **Multi-Tier Audio Transcription** | Primary: Groq Whisper (`whisper-large-v3-turbo` on Groq LPUs) $\rightarrow$ Fallback: OpenAI Whisper $\rightarrow$ Gemini Multimodal. | Delivers ultra-low latency transcription ($<500\text{ms}$) while guaranteeing 99.9% voice uptime. |
| **Resilient Background Processing** | BullMQ queues for resume text parsing, AI screening evaluations, and post-interview scorecard generation. | Isolates slow, compute-heavy LLM calls from user-facing HTTP request cycles, with auto-retry and dead-letter handling. |
| **Zero-Trust Device Integrity** | Free client-side `@fingerprintjs/fingerprintjs` integrated with backend candidate device binding. | Eliminates free-trial abuse and multiple-account switching without requiring costly paid third-party fingerprint APIs. |
| **Privacy-First Data Display** | Backend and frontend email masking pipelines (`s***7@gmail.com`). | Ensures sensitive identity data is never exposed on shared computers or kiosk devices during account collision events. |

---

## 🛡️ Anti-Abuse & Fair Play System

Sensei includes built-in protection against multi-accounting and free-trial abuse:
- **Free Open-Source Device Fingerprinting**: Powered by `@fingerprintjs/fingerprintjs` (MIT License) running directly in the browser with zero external API fees or third-party keys required.
- **Hardware/Browser Device Lock**: Upon first registration or candidate activity, the device fingerprint is bound to the candidate profile. Subsequent signup or account-switching attempts from the same physical machine are blocked with a `403 Forbidden` lockout guard.
- **Privacy-Preserving Email Masking**: Whenever an account collision or lock is displayed, email identifiers are masked (e.g. `s***7@gmail.com`), preventing sensitive user exposure across shared devices.

---

## 💻 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Data & State**: [TanStack React Query v5](https://tanstack.com/query/latest), [Zustand](https://github.com/pmndrs/zustand)
- **Form Management**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Fingerprinting**: `@fingerprintjs/fingerprintjs` (MIT Open Source)

### Backend
- **Runtime & Server**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM 7](https://www.prisma.io/)
- **In-Memory Store & Queues**: [Redis](https://redis.io/), [BullMQ](https://bullmq.io/), [ioredis](https://github.com/redis/ioredis)
- **Real-Time Communication**: [Socket.io](https://socket.io/) with Redis adapter
- **AI Orchestration**: [LangChain](https://www.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraphjs/), Google Gemini SDK
- **Speech Processing**: Groq Whisper API (`whisper-large-v3-turbo`)
- **Document Parsing**: `pdf-parse`, `mammoth`
- **Email Delivery**: Brevo REST API (`sib-api-v3-sdk`)
- **Object Storage**: [AWS S3](https://aws.amazon.com/s3/) via `@aws-sdk/client-s3`

---

## 📂 Project Structure

```text
Sensei/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # PostgreSQL models & relationships
│   │   └── migrations/              # Database migration history
│   ├── src/
│   │   ├── config/                  # Environment & service configurations
│   │   ├── database/                # Prisma client & connection logic
│   │   ├── middleware/              # Auth, validation, device lock & error handling
│   │   ├── routes/                  # Express API route declarations
│   │   ├── controllers/             # Request handling logic
│   │   ├── services/                # Business services (AI, Email, Fingerprint, Screening, etc.)
│   │   ├── sockets/                 # Real-time interview session handlers
│   │   ├── types/                   # TypeScript interfaces and declarations
│   │   ├── utils/                   # Helpers, logger, response wrappers
│   │   ├── validations/             # Zod validation schemas
│   │   └── server.ts                # Application entrypoint
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                  # Sign-in & sign-up routes with device verification
│   │   ├── (platform)/
│   │   │   ├── candidate/           # Candidate dashboard, practice, and applications
│   │   │   ├── recruiter/           # Recruiter dashboard, job creation, and candidate reviews
│   │   │   ├── admin/               # Platform administrator portals & UTR approvals
│   │   │   └── interview/           # Live multimodal interview room & scorecard results
│   │   ├── onboarding/              # Role-selection and initial profile setup
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Landing page
│   ├── components/                  # UI components (auth guards, resume upload, modals, etc.)
│   ├── hooks/                       # Custom React hooks (socket, audio recorder, etc.)
│   ├── lib/                         # API client, fingerprint generator, utils
│   ├── types/                       # Shared frontend TypeScript interfaces
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your development machine:
- **Node.js**: `v20.x` or later
- **npm** or **pnpm**
- **PostgreSQL**: `v15+` (local instance or cloud database such as Supabase/Neon/RDS)
- **Redis**: `v6+` (local instance or Upstash/Redis Cloud)
- **Clerk Account**: For user authentication

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file and update with your credentials:
   ```bash
   cp .env.example .env
   ```
   *(See [Environment Configuration](#-environment-configuration) for required keys).*

4. **Initialize Database & Prisma**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Seed Initial Practice Interview Jobs** *(Optional)*:
   ```bash
   npm run seed-practice
   ```

6. **Start Backend Development Server**:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```
   Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with your Clerk dashboard keys.

4. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will be accessible at `http://localhost:3000`.

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Allowed origin URL for CORS | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/sensei` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CLERK_SECRET_KEY` | Clerk Backend Secret Key | `sk_test_...` |
| `CLERK_WEBHOOK_SECRET` | Webhook verification secret | `whsec_...` |
| `GOOGLE_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini Model Identifier | `gemini-3.8-flash` |
| `GROQ_API_KEY` | Groq API Key (for LLM & Whisper STT) | `gsk_...` |
| `GROQ_PRIMARY_MODEL` | Primary Groq LLM model | `openai/gpt-oss-120b` |
| `GROQ_WHISPER_MODEL` | Speech-to-Text Whisper model | `whisper-large-v3-turbo` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for S3 | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | `...` |
| `AWS_S3_BUCKET_NAME` | S3 Bucket for candidate resumes | `sensei-resumes` |
| `AWS_REGION` | AWS Region | `ap-south-1` |
| `BREVO_API_KEY` | Brevo REST API Key for emails | `xkeysib-...` |
| `EMAIL_FROM` | Sender email address | `no-reply@sensei.dev` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `...` |
| `PAYMENT_UPI_ID` | Default UPI identifier for QR payments | `sensei@upi` |
| `JWT_SECRET` | Fallback internal JWT secret ($\ge 32$ chars) | `your-secure-secret-key-32-chars` |

---

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Secret Key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route path | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route path | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post sign-in redirect | `/onboarding` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post sign-up redirect | `/onboarding` |
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint | `http://localhost:5000/api` |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket endpoint | `ws://localhost:5000` |
| `NEXT_PUBLIC_APP_URL` | Application root URL | `http://localhost:3000` |

---

## 📜 Scripts Reference

### Backend

```bash
npm run dev              # Starts development server with tsx watch
npm run build            # Compiles TypeScript into JavaScript (dist/)
npm run start            # Runs compiled production server
npm run prisma:migrate   # Applies new Prisma migrations
npm run prisma:studio    # Launches Prisma web database studio
npm run seed-practice    # Seeds the database with default practice interview categories
npm run promote-admin    # Promotes a user to Platform Admin
npm run type-check       # Runs TypeScript compiler check without emitting files
```

### Frontend

```bash
npm run dev              # Starts Next.js development server on port 3000
npm run build            # Creates optimized production Next.js build
npm run start            # Starts production Next.js server
npm run lint             # Runs ESLint checks
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
The device fingerprinting submodule utilizes `@fingerprintjs/fingerprintjs`, distributed under the [MIT License](https://github.com/fingerprintjs/fingerprintjs/blob/master/LICENSE).
