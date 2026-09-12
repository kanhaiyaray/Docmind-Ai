<div align="center">

# 🧠 DocMind AI ( RAG )


**Enterprise-Grade Document Intelligence Platform**
Transform static PDFs into conversational knowledge bases — grounded, cited, and hallucination-free.

![Live Demo](https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-6c5ce7?style=for-the-badge&logo=vercel&logoColor=white)
![Stars](https://img.shields.io/github/stars/kanhaiyaray/Docmind-Ai?style=for-the-badge&logo=github&color=gold)
![Forks](https://img.shields.io/github/forks/kanhaiyaray/Docmind-Ai?style=for-the-badge&logo=github&color=blue)
![License](https://img.shields.io/badge/License-MIT-00b894?style=for-the-badge)

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)

[Overview](#-overview) · [Features](#-feature-highlights) · [Architecture](#%EF%B8%8F-system-architecture) · [Quick Start](#-quick-start) · [API](#-api-reference) · [Security](#-security-model) · [Roadmap](#%EF%B8%8F-roadmap)

</div>

## 📖 Overview

DocMind AI is a full-stack SaaS platform that turns static documents into an interactive knowledge base. Instead of manually skimming through hundreds of pages, you upload a PDF and converse with it — DocMind retrieves the exact passages relevant to your question, grounds the LLM's answer in that retrieved context, and returns a response with page-level citations so every claim can be traced back to its source.

This isn't a thin wrapper around a chat API. It's a complete Retrieval-Augmented Generation (RAG) pipeline built from the ground up — with authentication, refresh-token rotation, device-level session management, an admin dashboard, rate limiting, CSRF protection, and audit logging. The same concerns a real SaaS product has to solve.

## 🎯 Why DocMind?

<table>
<tr>
<td width="50%">

**The Problem**
- 📚 Long PDFs hide the answer in one paragraph
- 🤖 Generic LLMs hallucinate without grounded context
- ❓ No way to trace an AI answer back to its source
- 🔍 Manual multi-document comparison is tedious
- 🔐 "Chat with PDF" demos ignore session security

</td>
<td width="50%">

**The DocMind Solution**
- ⚡ Natural-language Q&A on any PDF in seconds
- 🎯 Answers retrieved from your document, not the model's memory
- 📄 Page-level citations on every response
- ⚖️ Built-in comparison across 2–3 documents
- 🛡️ Production-grade auth, CSRF, rate limiting, and audit logs

</td>
</tr>
</table>

## 🔬 The RAG Pipeline — Under the Hood

Every question flows through a battle-tested retrieval pipeline:

| Stage | What Happens |
|---|---|
| **1 · Ingestion** | `pdf-parse` extracts raw text page-by-page while preserving page boundaries — this is what later makes page-level citations possible. Image-based PDFs are detected and rejected early with a clear error. |
| **2 · Chunking** | Text is split into ~800-character semantic chunks with 150-character overlap, snapping to sentence boundaries where possible. Each chunk retains its source page number. |
| **3 · Embedding** | Every chunk is vectorized via OpenAI's `text-embedding-ada-002` in batches of 20 and stored alongside the chunk in MongoDB. |
| **4 · Retrieval** | Query is embedded, and a `$vectorSearch` aggregation finds the most semantically relevant chunks. If Atlas Vector Search is unavailable, the system transparently falls back to keyword-based search. |
| **5 · Augmentation** | Retrieved chunks are injected into the prompt as labelled `POSITION N of M` blocks with page numbers, giving the LLM explicit positional and citation anchors. |
| **6 · Citation Mapping** | The response is post-processed to map claims back to their originating page numbers, rendered as clickable source references in the frontend. |

### Adaptive Retrieval Strategy

Not all documents are equal. DocMind picks the right retrieval mode per document size:

| Document Size | Strategy | Rationale |
|---|---|---|
| ≤ 30 chunks | Send all chunks to the LLM | Small enough to fit in context — retrieval overhead not worth it |
| 30–200 chunks | Vector top-15 similarity search | Balance between precision and context window |
| > 200 chunks | Vector top-15 with hard char cap | Enforces a 60k-char context ceiling to avoid token budget blowouts |

## ✨ Feature Highlights

<table>
<tr>
<td width="50%" valign="top">

**🎨 Conversational AI**
- 💬 Single & multi-document chat
- 📄 Page-level source citations
- 🧠 AI-suggested starter questions
- 📚 Persistent, searchable history
- 🔄 Streaming-ready architecture

**📂 Document Management**
- 📤 Drag & drop PDF upload (10 MB cap)
- ⚙️ Automatic background processing
- 📊 Live status tracking (processing → completed → failed)
- 🔍 Full-text search with debounced input
- ♾️ Pagination + infinite scroll

</td>
<td width="50%" valign="top">

**🧩 Smart Study Tools**
- ⚖️ Document Comparison — themes, similarities, differences, complementary insights
- 📝 Quiz Generator — MCQ / True-False / Fill-in-blank, difficulty control
- 🎴 Flashcards — 3D flip cards with keyboard navigation
- 📋 AI Summarization — executive summaries on demand

**🔐 Auth & Security**
- 🍪 JWT in HTTP-only cookies
- 🔁 15-min access + 7-day rotating refresh tokens
- 🛡️ CSRF double-submit cookie protection
- 📧 Email verification & password reset
- 📱 Per-device session listing + remote revoke
- 🚦 IP-based rate limiting on sensitive endpoints

</td>
</tr>
</table>

## 🛠️ Admin Control Center

A complete back-office for platform operators:

| Module | Capabilities |
|---|---|
| 📊 Dashboard | Total users, docs, conversations, active-today, avg docs/user, 30-day registration & upload charts |
| 👥 Users | Full CRUD, role management, bulk select & delete, cascade cleanup |
| 📄 Documents | Cross-user visibility, filter by user/status, bulk delete |
| 📋 Activity Logs | Full audit trail with filters (user, action, date range) |
| ⚙️ System Settings | Live key/value config panel, upsert on the fly |

Every admin route requires JWT auth + valid CSRF token + admin role, and every action is written to the activity log with IP and user-agent.

## 🏗️ System Architecture

### Project Structure

```text
DocMind-Ai/
├── 📁 docmind-client/                  # React frontend
│   ├── src/
│   │   ├── components/                 # DocumentUpload, Sidebar, Topbar,
│   │   │                               # PrivateRoute, AdminRoute, ErrorBoundary
│   │   ├── pages/                      # Login, Register, Dashboard, Documents,
│   │   │   └── Admin/                  # Chat, Compare, Quiz, Flashcards,
│   │   │                               # Settings, History, Sessions, Admin/*
│   │   ├── context/                    # AuthContext
│   │   ├── hooks/                      # useDebounce, useErrorHandler, useLocalStorage
│   │   ├── services/api.js             # Axios + CSRF interceptor
│   │   └── App.jsx · main.jsx · index.css
│   ├── vite.config.js                  # Manual chunk splitting for perf
│   ├── tailwind.config.js
│   └── vercel.json
│
├── 📁 docmind-server/                  # Node.js backend
│   ├── config/db.js                    # Mongoose connection
│   ├── controllers/                    # auth · chat · document · compare · quiz · flashcard
│   ├── middleware/                     # auth · authRateLimiter · upload · error
│   ├── models/                         # User · Document · Chunk · Conversation
│   │                                   # RefreshToken · ActivityLog · Settings
│   ├── routes/                         # RESTful route definitions
│   ├── services/
│   │   ├── pdfService.js               # PDF extraction (rejects image PDFs)
│   │   ├── chunkService.js             # Semantic chunking
│   │   ├── embeddingService.js         # Batch embedding pipeline
│   │   ├── vectorSearchService.js      # Atlas Vector Search + text fallback
│   │   ├── ragService.js               # RAG orchestration
│   │   ├── aiService.js                # AI facade
│   │   ├── openaiService.js            # OpenAI chat client w/ token-param fallback
│   │   └── emailService.js             # Resend transactional email
│   ├── admin.js                        # Admin router
│   ├── server.js                       # Express entry point
│   └── Dockerfile
└── README.md
```

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

**🎨 Frontend**

| Tech | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 8.2.2 | Build tool & dev server |
| TailwindCSS | 3.4.19 | Utility-first styling |
| React Router | 7.18.3 | Client-side routing |
| Axios | 1.20.0 | HTTP client + CSRF interceptor |
| React Markdown | 9.1.0 | Rendering AI responses |
| Lucide React | 0.294.0 | Icon system |
| React Hot Toast | 2.6.0 | Toast notifications |

</td>
<td width="50%" valign="top">

**⚙️ Backend**

| Tech | Version | Purpose |
|---|---|---|
| Node.js | 22.x | Runtime |
| Express | 4.18.2 | Web framework |
| MongoDB Atlas | 6.x | DB + vector store |
| Mongoose | 6.8.0 | ODM |
| JWT | 9.0.0 | Auth tokens |
| Multer | 2.3.0 | File uploads |
| pdf-parse | 2.4.5 | PDF text extraction |
| OpenAI SDK | 7.10.0 | Embeddings + chat |
| Resend | 6.26.0 | Transactional email |
| Helmet | 7.2.0 | Security headers |
| csurf | 1.11.0 | CSRF protection |
| express-rate-limit | 8.7.0 | Rate limiting |

</td>
</tr>
</table>

## 💾 Database Schema

<details>
<summary><b>👤 User</b></summary>

```js
{
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt, salt=12, select:false),
  role: ['user', 'admin'],
  isActive: Boolean,
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  resetPasswordToken: String,
  lastLogin: Date,
  failedLoginAttempts: Number,
  accountLockedUntil: Date,
  settings: { theme, notifications },
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><b>📄 Document</b></summary>

```js
{
  userId: ObjectId (ref: User, indexed),
  title: String,
  filename: String,
  fileUrl: String,
  fileSize: Number,
  pageCount: Number,
  status: ['processing', 'completed', 'failed'],
  processingError: String,
  metadata: { author, title, subject, keywords, creationDate, modificationDate },
  summary: String,
  tags: [String],
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { userId, createdAt }, { userId, status }, { title: 'text' }
```
</details>

<details>
<summary><b>🧩 Chunk</b> — the vector store</summary>

```js
{
  documentId: ObjectId (ref: Document, indexed),
  userId: ObjectId (ref: User, indexed),
  content: String,
  pageNumber: Number,
  chunkIndex: Number,
  embedding: [Number],      // vector embedding (1536-dim)
  metadata: { filename, pageNumber, chunkSize },
  charCount: Number,
  wordCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><b>💬 Conversation</b></summary>

```js
{
  userId: ObjectId (ref: User, indexed),
  documentId: ObjectId (ref: Document, indexed),
  title: String,
  messages: [{
    role: ['user', 'assistant'],
    content: String,
    sources: [{ page, document, documentId }],
    timestamp: Date
  }],
  metadata: { totalTokens, processingTime },
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><b>🔐 RefreshToken</b></summary>

```js
{
  userId: ObjectId (ref: User, indexed),
  token: String (unique),
  expiresAt: Date,          // TTL index — auto-cleanup
  isRevoked: Boolean,
  deviceInfo: { userAgent, ipAddress },
  createdAt: Date
}
```
</details>

<details>
<summary><b>📋 ActivityLog & ⚙️ Settings</b></summary>

```js
// ActivityLog
{
  userId: ObjectId (ref: User),
  action: String,
  details: Mixed,
  ip: String,
  userAgent: String,
  timestamp: Date
}

// Settings
{
  key: String (unique),
  value: Mixed,
  description: String,
  updatedBy: ObjectId (ref: User),
  updatedAt: Date
}
```
</details>

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 20.x | 22.x recommended |
| npm | ≥ 9.x | or pnpm / yarn |
| MongoDB Atlas | — | Free tier works; Vector Search recommended |
| OpenAI API Key | — | For embeddings + chat |
| Resend API Key | — | For transactional email (free tier available) |

**1 · Clone the repository**

```bash
git clone https://github.com/kanhaiyaray/Docmind-Ai.git
cd Docmind-Ai
```

**2 · Backend setup**

```bash
cd docmind-server
npm install
cp .env.example .env
# → edit .env with your credentials
npm run dev
```

API boots on `http://localhost:5000` → check `/api/health`.

**3 · Frontend setup**

```bash
cd ../docmind-client
npm install
cp .env.example .env.local
# → set VITE_API_URL=http://localhost:5000/api
npm run dev
```

App opens on `http://localhost:5173`.

**4 · First-time admin access**

```bash
# 1. Register a regular account via the UI
# 2. Verify your email
# 3. In MongoDB Atlas → set role: "admin" on your user doc
# 4. Log back in → visit /admin
```

## 📝 Environment Variables

<details>
<summary><b>⚙️ Backend — <code>docmind-server/.env</code></b></summary>

```env
# ─── Server ──────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Database ────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/docmind

# ─── JWT ─────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# ─── Email (Resend) ──────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173

# ─── OpenAI ──────────────────────────────────
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENAI_CHAT_MODEL=gpt-4-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSION=1536

# ─── CORS (comma-separated) ──────────────────
CORS_ORIGINS=http://localhost:5173

# ─── Upload ──────────────────────────────────
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760      # 10 MB

# ─── Chunking ────────────────────────────────
CHUNK_SIZE=800
OVERLAP=150

# ─── Rate Limiting ───────────────────────────
RATE_LIMIT_WINDOW=15        # minutes
RATE_LIMIT_MAX=100          # requests / window

# ─── Logging ─────────────────────────────────
LOG_LEVEL=debug
```
</details>

<details>
<summary><b>🎨 Frontend — <code>docmind-client/.env.local</code></b></summary>

```env
VITE_API_URL=http://localhost:5000/api

VITE_APP_NAME=DocMind
VITE_APP_DESCRIPTION=AI Document Intelligence Platform

# Feature flags
VITE_ENABLE_DOCUMENT_COMPARISON=true
VITE_ENABLE_QUIZ_GENERATOR=true
VITE_ENABLE_FLASHCARDS=true
VITE_ENABLE_STREAMING_RESPONSES=true
VITE_ENABLE_DARK_MODE=true

# Upload
VITE_MAX_FILE_SIZE_MB=10
VITE_ALLOWED_FILE_TYPES=.pdf

# UI
VITE_DEFAULT_THEME=light
VITE_ENABLE_ANIMATIONS=true
VITE_DEBUG_MODE=true
```
</details>

⚠️ **Never commit `.env` files.** Only `.env.example` should be tracked in version control.

## 📡 API Reference

Base URL: `/api` · Auth: HTTP-only cookies · CSRF: mutating requests require `X-CSRF-Token` from `GET /api/csrf-token`

<details open>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| POST | `/auth/register` | Create new account | 5 / hr |
| POST | `/auth/login` | Authenticate | 5 / 15 min |
| GET | `/auth/verify-email` | Verify email via token | — |
| POST | `/auth/resend-verification` | Resend verification email | 3 / hr |
| POST | `/auth/forgot-password` | Request password reset | 3 / hr |
| POST | `/auth/reset-password` | Reset with token | 5 / hr |
| POST | `/auth/refresh` | Rotate refresh token | — |
| POST | `/auth/logout` | Logout current session | 🔒 |
| POST | `/auth/logout-all` | Logout every session | 🔒 |
| GET | `/auth/me` | Get current user | 🔒 |
| PUT | `/auth/profile` | Update name/settings | 🔒 |
| PUT | `/auth/password` | Change password | 🔒 |
| GET | `/auth/sessions` | List active sessions | 🔒 |
| DELETE | `/auth/sessions/:id` | Revoke a session | 🔒 |
| POST | `/auth/sessions/revoke-others` | Logout other devices | 🔒 |

</details>

<details>
<summary><b>📄 Documents</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/documents/upload` | Upload PDF (multipart/form-data, field: `document`) |
| GET | `/documents` | List user docs `?status=&search=&page=&limit=` |
| GET | `/documents/:id` | Document detail |
| PUT | `/documents/:id` | Update title / tags / favorite |
| DELETE | `/documents/:id` | Delete doc + chunks |
| GET | `/documents/:id/file` | Download original file |
| POST | `/documents/summary` | Generate AI summary |
| POST | `/documents/suggest-questions` | AI-suggested questions |

</details>

<details>
<summary><b>💬 Chat (RAG)</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Single-doc query `{ question, documentId }` |
| POST | `/chat/multi` | Multi-doc query `{ question, documentIds[] }` |
| GET | `/chat/history` | List conversations |
| GET | `/chat/:id` | Get full conversation |
| DELETE | `/chat/:id` | Delete a conversation |
| DELETE | `/chat/clear/:documentId` | Clear history for a doc |

</details>

<details>
<summary><b>🧩 AI Tools</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/compare` | Compare 2–3 documents |
| POST | `/quiz/generate` | Generate quiz from a document |
| POST | `/flashcards/generate` | Generate flashcards from a document |

</details>

<details>
<summary><b>🛡️ Admin</b> — requires <code>role: admin</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | System-wide counters |
| GET | `/admin/analytics` | Registrations & uploads over 30 days |
| GET | `/admin/users` | Paginated user list |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user + cascade |
| DELETE | `/admin/users` | Bulk delete users |
| GET | `/admin/documents` | All documents |
| DELETE | `/admin/documents/:id` | Delete any document |
| GET | `/admin/logs` | Activity audit log |
| GET | `/admin/settings` | System settings |
| PUT | `/admin/settings/:key` | Upsert setting |

</details>

### Example Request

```bash
# 1. Get a CSRF token (required for any mutating request)
curl -c cookies.txt http://localhost:5000/api/csrf-token

# 2. Login
curl -b cookies.txt -c cookies.txt \
  -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass123!"}'

# 3. Ask a question (authenticated + CSRF)
curl -b cookies.txt \
  -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"question":"What are the key findings?","documentId":"<id>"}'
```

## 🔒 Security Model

DocMind treats security as a first-class requirement, not an afterthought.

<table>
<tr>
<td width="50%" valign="top">

| Layer | Implementation |
|---|---|
| Password hashing | bcryptjs · salt rounds = 12 |
| Access tokens | JWT · HTTP-only cookies · 15-min expiry |
| Refresh tokens | 7-day expiry · rotated on every use |
| Token storage | Server-side RefreshToken collection with TTL index |
| CSRF | csurf double-submit cookie pattern |
| Rate limiting | IP-based · per-route · skip on `/auth/*` for custom limits |

</td>
<td width="50%" valign="top">

| Layer | Implementation |
|---|---|
| Security headers | Helmet (XSS, CSP, HSTS-ready) |
| CORS | Strict origin allow-list · credentials: true |
| Input validation | express-validator on all auth routes |
| Injection protection | Mongoose ODM parameterization |
| File uploads | MIME whitelist (PDF only) · 10 MB cap · sandboxed dir |
| Session revocation | Per-device revoke + revoke-all-others |
| Audit trail | Activity logs capture IP + user-agent on sensitive ops |

</td>
</tr>
</table>

### Password Policy

✅ Minimum 8 characters · ✅ One uppercase · ✅ One lowercase · ✅ One digit · ✅ One special character · ✅ Common-password blacklist (`password`, `12345678`, `qwerty`, `abc123`, …)

### Session Security

- **Rotation on every use** — a used refresh token is immediately revoked and a new one issued
- **Account lockout** — 5 failed login attempts → 15-minute lockout
- **Multi-device visibility** — every active session listed with device/user-agent/IP
- **One-tap revoke** — logout other devices without touching the current session
- **Automatic cleanup** — MongoDB TTL index expires stale tokens

🔐 Found a vulnerability? Please open a private security advisory on GitHub rather than a public issue.

## ⚡ Performance Notes

- **Adaptive retrieval** — small docs skip vector search entirely; large docs get a hard 60k-char context cap
- **Batched embeddings** — chunks are embedded in batches of 20 to reduce OpenAI round-trips
- **Vector search fallback** — automatic keyword-based fallback keeps the app running on any Atlas tier
- **Manual chunk splitting** — `vite.config.js` splits vendor and UI libraries into separate bundles for faster cold loads
- **Debounced search** — `useDebounce(400ms)` on document search prevents request storms
- **Memoized list items** — `React.memo` on `DocumentItem` reduces re-renders during infinite scroll
- **Intersection Observer** — pagination loads new pages only when the user scrolls near the bottom

## 🚢 Deployment

### Backend — Render / Railway / Fly.io

```yaml
Build Command : npm install
Start Command : node server.js
Port          : 10000 (or $PORT)
```

### Frontend — Vercel / Netlify

```bash
npm i -g vercel
vercel
```

`docmind-client/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Docker

```bash
cd docmind-server
docker build -t docmind-server .
docker run -p 10000:10000 --env-file .env docmind-server
```

### Environments

| Environment | Backend | Frontend |
|---|---|---|
| Development | `http://localhost:5000` | `http://localhost:5173` |
| Production | `https://api.yourdomain.com` | `https://docmind-ai-opal.vercel.app` |

## 🗺️ Roadmap

<table>
<tr>
<td width="33%" valign="top">

**🎯 Near-term**
- [ ] SSE token streaming
- [ ] DOCX / TXT / MD upload
- [ ] OCR fallback for scanned PDFs
- [ ] Inline PDF viewer with citation highlights

</td>
<td width="33%" valign="top">

**🚀 Mid-term**
- [ ] Team / workspace collaboration
- [ ] Usage-based billing tiers
- [ ] Response caching for repeated queries
- [ ] Multi-language document support

</td>
<td width="33%" valign="top">

**🔬 Long-term**
- [ ] Self-hosted LLM option (Ollama / vLLM)
- [ ] Agentic multi-step document research
- [ ] Public API + developer SDK
- [ ] Mobile app (React Native)

</td>
</tr>
</table>

Track progress on the open issues →

## ❓ FAQ

<details>
<summary><b>Does DocMind work with scanned (image-only) PDFs?</b></summary>
Not yet — image-based PDFs are detected during ingestion and rejected with a clear error. OCR fallback is on the roadmap.
</details>

<details>
<summary><b>What happens if Atlas Vector Search isn't available?</b></summary>
The retrieval layer transparently falls back to keyword-based text search, so the app keeps working on any MongoDB Atlas tier or in local development.
</details>

<details>
<summary><b>Can I chat across multiple documents at once?</b></summary>
Yes — the <code>/chat/multi</code> endpoint retrieves and blends relevant chunks across every selected document, then labels each retrieved chunk with its source document so the LLM can differentiate.
</details>

<details>
<summary><b>How is my data isolated from other users?</b></summary>
Every document, chunk, and conversation is scoped to a <code>userId</code> at the database level, and every query is filtered accordingly. Cross-user access is only possible through the admin role.
</details>

<details>
<summary><b>How much does it cost to run?</b></summary>
MongoDB Atlas has a generous free tier, Resend's free tier covers ~3,000 emails/month, and OpenAI costs depend on usage — typically a few cents per document for embedding + a fraction of a cent per query.
</details>

<details>
<summary><b>Why gpt-4-turbo and text-embedding-ada-002?</b></summary>
The embedding model is a stable, well-priced default that plays nicely with Atlas Vector Search's 1536-dim index. The chat model is configurable via <code>OPENAI_CHAT_MODEL</code> — the OpenAI client includes fallback logic for models that require <code>max_completion_tokens</code> instead of <code>max_tokens</code>.
</details>

## 🤝 Contributing

Contributions make open source a great place to learn and build. Any contribution is greatly appreciated.

1. Fork the repository
2. Create your branch — `git checkout -b feature/amazing-feature`
3. Commit your changes — `git commit -m 'Add amazing feature'`
4. Push to the branch — `git push origin feature/amazing-feature`
5. Open a Pull Request

### Guidelines

| Area | Convention |
|---|---|
| Backend | Follow Express.js best practices; keep controllers thin, services fat |
| Frontend | Functional components + hooks only; no class components |
| API | RESTful with consistent `{ success, data?, message? }` envelope |
| Testing | Add tests for any new feature |
| Docs | Update this README for any API change |
| Commits | Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) |

## 🙏 Acknowledgments

Built on the shoulders of giants:

- [OpenAI](https://openai.com) — GPT models and embeddings
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Database + vector storage
- [Resend](https://resend.com) — Transactional email delivery
- [TailwindCSS](https://tailwindcss.com) — Utility-first styling
- [Lucide](https://lucide.dev) — Beautiful icon set
- [Vite](https://vitejs.dev) — Next-generation frontend tooling
- [Express](https://expressjs.com) — Minimalist web framework

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">

⭐ If DocMind helped you, consider giving it a star!
It takes 2 seconds and helps others discover the project.

![Stars](https://img.shields.io/github/stars/kanhaiyaray/Docmind-Ai?style=social)

Built with ❤️ by **Kanhaiya Ray**

[⬆ Back to Top](#-docmind-ai) · [🐛 Report Bug](https://github.com/kanhaiyaray/Docmind-Ai/issues) · [✨ Request Feature](https://github.com/kanhaiyaray/Docmind-Ai/issues)

</div>
