<div align="center">

# 🧠 DocMind AI (RAG)

### Enterprise-Grade Document Intelligence Platform Powered by Retrieval-Augmented Generation(RAG)

*Upload. Ask. Understand. — Turn static PDFs into conversational knowledge bases with page-accurate citations.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-00C7B7?style=for-the-badge)](https://docmind-ai-opal.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github)](https://github.com/kanhaiyaray/Docmind-Ai)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4--Turbo-412991?logo=openai&logoColor=white)


</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Why DocMind?](#-why-docmind)
- [RAG Pipeline — The Engine](#-rag-pipeline--the-engine)
- [Feature Highlights](#-feature-highlights)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Admin Panel](#-admin-panel)
- [Security](#-security)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 About The Project

**DocMind AI** is a full-stack SaaS platform that turns static documents into an interactive knowledge base. Instead of manually skimming through PDFs, users upload a document and *converse* with it — DocMind retrieves the exact passages relevant to a question, grounds the LLM's answer in that retrieved context, and returns a response with **page-level citations** so every claim can be traced back to its source.

This isn't a thin wrapper around a chat API — it's a complete **Retrieval-Augmented Generation (RAG) pipeline** built from the ground up:

```
PDF Upload → Text Extraction → Semantic Chunking → Embedding Generation
    → Vector Similarity Search → Context-Augmented Prompt → LLM Response
```

Built as a production-style application with authentication, session management, an admin dashboard, rate limiting, and CSRF protection — the same concerns a real SaaS product has to solve.

## 💡 Why DocMind?

| Problem | DocMind's Solution |
|---|---|
| Reading long PDFs to find one answer wastes time | Ask a natural-language question, get a grounded answer in seconds |
| LLMs hallucinate when they don't have real context | Every answer is retrieved from the actual document — not the model's memory |
| "Where did that answer come from?" | Page-level citations link every response back to its source |
| Comparing multiple documents manually is tedious | Built-in document comparison surfaces themes, similarities, and differences |
| Studying long documents for retention | AI-generated quizzes and spaced-repetition flashcards from the content itself |

---

## 🔬 RAG Pipeline — The Engine

The core of DocMind is its retrieval pipeline. Here's what happens under the hood every time a document is uploaded and queried:

```mermaid
flowchart LR
    A[📄 PDF Upload] --> B[pdf-parse<br/>Text Extraction]
    B --> C[Semantic Chunking<br/>800 chars / 150 overlap]
    C --> D[OpenAI Embeddings<br/>text-embedding-ada-002]
    D --> E[(MongoDB Atlas<br/>Vector Store)]
    F[💬 User Query] --> G[Query Embedding]
    G --> H[Vector Similarity Search]
    E --> H
    H --> I[Top-K Relevant Chunks]
    I --> J[Context-Augmented Prompt]
    J --> K[GPT-4 Turbo]
    K --> L[Answer + Page Citations]
```

**1. Ingestion** — On upload, `pdf-parse` extracts raw text page-by-page while preserving page boundaries, which is what later makes page-level citations possible.

**2. Chunking** — Text is split into ~800-character semantic chunks with a 150-character overlap, so context isn't lost at chunk boundaries. Each chunk retains its source page number.

**3. Embedding** — Every chunk is passed through OpenAI's `text-embedding-ada-002` model, producing a 1536-dimensional vector that's stored alongside the chunk in MongoDB.

**4. Retrieval** — When a user asks a question, the query itself is embedded, and a vector similarity search finds the most semantically relevant chunks across the document (or documents, for multi-doc chat).

**5. Augmentation & Generation** — The retrieved chunks are injected into the prompt as grounding context before being sent to GPT-4 Turbo, which is instructed to answer *only* from the supplied context and to cite the page(s) it drew from.

**6. Citation Mapping** — The response is post-processed to map cited claims back to their originating page numbers and document, which the frontend renders as clickable source references.

---

## ✨ Feature Highlights

### 🔐 Authentication & Security
- JWT-based auth with HTTP-only cookies (15-min access token, 7-day rotating refresh token)
- CSRF protection (double-submit cookie pattern) on all state-changing requests
- Email verification and password reset flows via Resend
- Full session management — view and revoke active sessions per device
- IP-based rate limiting on sensitive endpoints

### 📄 Document Management
- Drag-and-drop PDF upload (up to 10MB)
- Automatic text extraction and background processing with live status tracking (`processing → completed → failed`)
- Intelligent overlap-based chunking tuned for semantic preservation

### 💬 AI-Powered Chat (RAG)
- Single-document and multi-document conversational chat
- Page-level source citations on every answer
- AI-suggested starter questions per document
- Persistent, searchable conversation history

### 🧩 Smart Tools
- **Document Comparison** — surfaces shared themes, contradictions, and unique points across documents
- **Quiz Generator** — multiple-choice, true/false, and fill-in-the-blank questions from document content
- **Flashcard Generator** — spaced-repetition-ready flashcards
- **AI Summarization** — executive-style document summaries on demand

### 📊 Admin Dashboard
- Full user CRUD with bulk actions
- Cross-user document oversight and moderation
- Activity logs for audit trails
- Live analytics: registrations, uploads, active users
- System-wide configuration panel

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**

| Tech | Version | Role |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 8.2.2 | Build tool / dev server |
| TailwindCSS | 3.4.19 | Styling |
| React Router DOM | 7.18.3 | Client-side routing |
| Axios | 1.20.0 | HTTP client |
| React Markdown | 9.1.0 | Rendering AI responses |
| Lucide React | 0.294.0 | Icons |
| React Hot Toast | 2.6.0 | Notifications |

</td>
<td valign="top" width="50%">

**Backend**

| Tech | Version | Role |
|---|---|---|
| Node.js | 22.x | Runtime |
| Express | 4.18.2 | Web framework |
| MongoDB (Atlas) | 6.x | Database + vector store |
| Mongoose | 6.8.0 | ODM |
| JWT | 9.0.0 | Auth tokens |
| Multer | 2.3.0 | File uploads |
| pdf-parse | 2.4.5 | PDF text extraction |
| OpenAI SDK | 7.10.0 | Embeddings + chat completion |
| Resend | 6.26.0 | Transactional email |
| Helmet | 7.2.0 | Security headers |
| CSRF | 1.11.0 | CSRF protection |
| express-rate-limit | 8.7.0 | Rate limiting |

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Client (React + Vite)                    │
│   Auth Context │ Chat Pages │ Document Pages │ Admin Pages         │
│                              ↓                                     │
│                 Axios API layer (CSRF-aware)                       │
└──────────────────────────────────────────────────────────────────┘
                               ↓ HTTPS
┌──────────────────────────────────────────────────────────────────┐
│                       Backend (Express)                           │
│   Helmet → CORS → CookieParser → CSRF → RateLimit  (middleware)    │
│                              ↓                                     │
│   Auth Routes │ Document Routes │ Chat & RAG Routes │ Admin Routes │
│                              ↓                                     │
│         Services: PDF → Chunk → Embed → VectorSearch → RAG         │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                               │
│  Users │ Documents │ Chunks (vectors) │ Conversations               │
│  RefreshTokens │ ActivityLogs │ Settings                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

<details>
<summary><strong>User</strong></summary>

```js
{
  name: String,
  email: String (unique),
  password: String (bcrypt-hashed),
  role: ['user', 'admin'],
  isActive: Boolean,
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  resetPasswordToken: String,
  lastLogin: Date,
  settings: { theme, notifications },
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><strong>Document</strong></summary>

```js
{
  userId: ObjectId (ref: User),
  title: String,
  filename: String,
  fileUrl: String,
  fileSize: Number,
  pageCount: Number,
  status: ['processing', 'completed', 'failed'],
  processingError: String,
  metadata: { author, title, subject, keywords },
  summary: String,
  tags: [String],
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><strong>Chunk</strong> (the vector store)</summary>

```js
{
  documentId: ObjectId (ref: Document),
  userId: ObjectId (ref: User),
  content: String,
  pageNumber: Number,
  chunkIndex: Number,
  embedding: [Number],  // 1536-dim vector
  metadata: { filename, pageNumber, chunkSize },
  charCount: Number,
  wordCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```
</details>

<details>
<summary><strong>Conversation</strong></summary>

```js
{
  userId: ObjectId (ref: User),
  documentId: ObjectId (ref: Document),
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
<summary><strong>RefreshToken</strong></summary>

```js
{
  userId: ObjectId (ref: User),
  token: String (unique),
  expiresAt: Date,
  isRevoked: Boolean,
  deviceInfo: { userAgent, ipAddress },
  createdAt: Date
}
```
</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- MongoDB Atlas account (or local MongoDB instance)
- OpenAI API key (embeddings + chat)
- Resend API key (transactional email)

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/kanhaiyaray/Docmind-Ai.git
cd Docmind-Ai/docmind-server

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# edit .env — see Environment Variables below

# 4. Start the server
npm run dev
```

### Frontend Setup

```bash
cd ../docmind-client

npm install
cp .env.example .env.local
# edit .env.local with your API URL

npm run dev
```

---

## 📝 Environment Variables

<details>
<summary><strong>Backend (.env)</strong></summary>

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/docmind

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# OpenAI
OPENAI_API_KEY=sk_your_openai_api_key
OPENAI_CHAT_MODEL=gpt-4-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# CORS
CORS_ORIGINS=http://localhost:5173

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Chunking
CHUNK_SIZE=800
OVERLAP=150

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
```
</details>

<details>
<summary><strong>Frontend (.env.local)</strong></summary>

```env
VITE_API_URL=http://localhost:5000/api

VITE_ENABLE_DOCUMENT_COMPARISON=true
VITE_ENABLE_QUIZ_GENERATOR=true
VITE_ENABLE_FLASHCARDS=true
VITE_ENABLE_STREAMING_RESPONSES=true

VITE_MAX_FILE_SIZE_MB=10
VITE_ALLOWED_FILE_TYPES=.pdf

VITE_DEFAULT_THEME=light
VITE_ENABLE_ANIMATIONS=true
VITE_ENABLE_DARK_MODE=true
```
</details>

---

## 📡 API Reference

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout current session |
| POST | `/api/auth/logout-all` | Logout all sessions |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/sessions` | Get active sessions |
| DELETE | `/api/auth/sessions/:id` | Revoke specific session |

</details>

<details>
<summary><strong>Documents</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents` | Get user documents |
| GET | `/api/documents/:id` | Get document details |
| PUT | `/api/documents/:id` | Update document metadata |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/:id/file` | Download document |
| POST | `/api/documents/summary` | Generate summary |
| POST | `/api/documents/suggest-questions` | Get suggested questions |

</details>

<details>
<summary><strong>Chat</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send single-document query |
| POST | `/api/chat/multi` | Send multi-document query |
| GET | `/api/chat/history` | Get chat history |
| GET | `/api/chat/:id` | Get conversation |
| DELETE | `/api/chat/:id` | Delete conversation |
| DELETE | `/api/chat/clear/:docId` | Clear document history |

</details>

<details>
<summary><strong>AI Tools</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/compare` | Compare documents |
| POST | `/api/quiz/generate` | Generate quiz |
| POST | `/api/flashcards/generate` | Generate flashcards |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/:id` | Get user details |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/documents` | List documents |
| DELETE | `/api/admin/documents/:id` | Delete document |
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/analytics` | Advanced analytics |
| GET | `/api/admin/logs` | Activity logs |
| GET | `/api/admin/settings` | System settings |
| PUT | `/api/admin/settings/:key` | Update setting |

</details>

---

## 🔧 Admin Panel

**Access:** Register a regular account → manually set `role: "admin"` on the user document in MongoDB → log in and open `/admin`.

**Capabilities:**
- **Dashboard** — key metrics, registration trends, upload volume, activity charts
- **Users** — view/create/edit/delete, bulk actions
- **Documents** — cross-user visibility, filter by user/status, bulk delete
- **Logs** — full activity audit trail with filtering
- **Settings** — live system configuration

Every admin route requires JWT auth **+** a valid CSRF token **+** admin-role verification, and every admin action is written to the activity log.

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs, salt rounds = 12 |
| Access tokens | JWT, HTTP-only cookies, 15-min expiry |
| Refresh tokens | 7-day expiry with rotation on use |
| CSRF protection | Double-submit cookie pattern |
| Rate limiting | IP-based, 100 requests / 15 min |
| Security headers | Helmet |
| CORS | Strict origin allow-list |
| Input validation | express-validator |
| XSS prevention | sanitize-html, strict content-type headers |
| Injection protection | Mongoose ODM parameterization |

**Session security:** refresh-token rotation on every use, per-device session listing and revocation, user-agent/IP logging, and automatic cleanup of expired tokens via a MongoDB TTL index.

**Password policy:** minimum 8 characters, at least one uppercase, one lowercase, one number, one special character, and a common-password blacklist.

---

## 🚢 Deployment

**Backend — Render**
```yaml
Build Command: npm install
Start Command: node server.js
Port: 10000 (configurable)
```

**Frontend — Vercel**
```bash
npm i -g vercel
vercel
```
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Docker**
```bash
cd docmind-server
docker build -t docmind-server .
docker run -p 10000:10000 --env-file .env docmind-server
```

| Environment | Backend | Frontend |
|---|---|---|
| Development | `http://localhost:5000` | `http://localhost:5173` |
| Production | `https://api.docmind.ai` | [`https://docmind-ai-opal.vercel.app`](https://docmind-ai-opal.vercel.app) |

---

## 📁 Project Structure

```
DocMind-Ai/
├── docmind-client/                 # React frontend
│   ├── src/
│   │   ├── components/             # DocumentUpload, Sidebar, Topbar, AdminRoute...
│   │   ├── pages/                  # Login, Dashboard, Chat, Documents, Compare,
│   │   │                           # Quiz, Flashcards, Settings, Admin/*
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── hooks/
│   │   ├── services/api.js
│   │   ├── App.jsx / main.jsx / index.css
│   ├── vite.config.js / tailwind.config.js / vercel.json
│
├── docmind-server/                 # Node.js backend
│   ├── config/db.js
│   ├── controllers/                # auth, chat, document, compare, quiz, flashcard
│   ├── middleware/                 # auth, upload, error, rate-limiter
│   ├── models/                     # User, Document, Chunk, Conversation,
│   │                               # RefreshToken, ActivityLog, Settings
│   ├── routes/
│   ├── services/                   # pdf, chunk, embedding, vectorSearch, rag,
│   │                               # ai, openai, email
│   ├── admin.js / server.js / Dockerfile
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Streaming token-by-token chat responses
- [ ] Support for DOCX / TXT / Markdown uploads (beyond PDF)
- [ ] Native vector index (MongoDB Atlas Vector Search) for faster similarity search at scale
- [ ] Team / workspace collaboration on shared documents
- [ ] Usage-based billing and subscription tiers
- [ ] Self-hosted / open-source LLM option (e.g. via Ollama) as an OpenAI alternative

See the [open issues](https://github.com/kanhaiyaray/Docmind-Ai/issues) for the full list of proposed features and known issues.

---

## 🤝 Contributing

Contributions make the open-source community a great place to learn and build. Any contribution is **greatly appreciated**.

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/amazing-feature`
3. Commit your changes — `git commit -m 'Add amazing feature'`
4. Push to the branch — `git push origin feature/amazing-feature`
5. Open a Pull Request

**Guidelines:** follow Express.js best practices on the backend, use functional components and hooks on the frontend, keep the API RESTful with consistent error shapes, add tests for new features, and update this README for any API changes.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) — GPT models and embeddings
- [MongoDB Atlas](https://www.mongodb.com/atlas) — database and vector storage
- [Resend](https://resend.com) — transactional email delivery
- [TailwindCSS](https://tailwindcss.com) — utility-first styling
- [Lucide](https://lucide.dev) — icon set

---

<div align="center">

**Built by [Kanhaiya Ray](https://github.com/kanhaiyaray)**

⬆ [Back to Top](#-docmind-ai)

</div>
