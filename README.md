# Merridian — AI Chat & Thinking Canvas

A privacy-first AI chat application powered by cloud-hosted **NVIDIA NIM** models and **Vercel Edge Functions**. Merridian pairs a polished chat interface with a **Thinking Canvas** — a 2D spatial reasoning workspace where you can visually map, connect, and branch ideas generated from your conversations.

---

## Features
### 💬 Chat
- **NVIDIA NIM Acceleration** — high-performance AI inference via cloud-hosted models
- **Streaming responses** with a live blinking cursor
- **Session history** — conversations are persisted to Supabase and reload on refresh
- **Document context** — upload `.txt`, `.md`, `.json`, `.csv`, or `.docx` files to give the AI context without copy-pasting
- **Markdown rendering** for AI responses (powered by `react-markdown`)

### 🧠 Thinking Canvas
- **Infinite 2D canvas** powered by React Flow — pan, zoom, and drag nodes freely
- **Send to Canvas** — push any chat message to the canvas as an interactive node with one click
- **Node types**: Response (blue), Prompt (purple), Idea (yellow)
- **Inline editing** — double-click any node to edit its content
- **Labeled edges** — drag between nodes to connect them; double-click edges to add labels
- **Edge types**: Directed (→), Bidirectional (⟺), Conflict (✗ dashed red)
- **Visual cluster highlighting** — selecting a node dims all unconnected nodes

### 🤖 AI Canvas Tools
- **Fill the Gap** — select an edge and let the AI generate logical intermediate bridging nodes
- **Branch Opposite** — stream a counter-argument or opposing view into a new connected node
- **Fan Out** — concurrently stream 3 divergent ideas (next step, lateral, wildcard) from any node
- **Collapse Cluster** — merge multiple selected nodes into a single AI-synthesized summary node
- **Summarize & Send** — summarize a selected cluster and inject the result back into the chat

### 🔐 Authentication
- **Secure Sign In & Sign Up** pages featuring modern glassmorphism design
- **Forgot Password** flow with email verification
- **Guest Mode** — continue as a guest without creating an account
- **Supabase Auth** — handles session persistence securely

### ⚙️ Persistence & Polish
- **Supabase backend** — user auth, chat sessions, messages, and canvas state all sync to PostgreSQL
- **Undo / Redo** — full history stack (`Ctrl+Z` / `Ctrl+Shift+Z`)
- **Export to PNG** — download the canvas as a high-resolution image
- **Right-click context menus** on nodes and edges
- **Responsive layout** — document panel, chat, and canvas all resize gracefully

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Styling | Vanilla CSS |
| Backend | Vercel Edge Functions (`api/chat.js`) |
| Graph Engine | `@xyflow/react` (React Flow) |
| AI Inference | NVIDIA NIM (Llama 3.1 8B/70B, Mistral Large) |
| Database & Auth | Supabase (PostgreSQL, Supabase Auth) |
| Document Parsing | `mammoth` (DOCX), native FileReader |
| Icons | `lucide-react` |
| Canvas Export | `html-to-image` |
| Markdown | `react-markdown` |

---

## Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **NVIDIA API Key** — [get one here](https://build.nvidia.com/nvidia/llama-3-1-8b-instruct).
3. **Supabase** project — [create a free project](https://supabase.com). Run the schema from [`docs/supabase_schema.sql`](docs/supabase_schema.sql) in the Supabase SQL editor.

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd ai-chat-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
#    Copy the example below into a .env file at the project root
```

**`.env`**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
NVIDIA_API_KEY=your-nvidia-nim-api-key-here
```

### Running Locally

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
ai-chat-app/
├── public/                         # Static assets (favicon, icons)
├── src/
│   ├── components/
│   │   ├── auth/                   # Authentication UI
│   │   ├── canvas/                 # Thinking Canvas components
│   │   ├── chat/                   # Main chat interface and inputs
│   │   ├── document/               # Document editing/viewing panel
│   │   ├── layout/                 # Application layout (Sidebar)
│   │   └── settings/               # Settings modals
│   ├── context/
│   │   └── CanvasContext.js        # React context for canvas actions
│   ├── hooks/
│   │   ├── useAppLayout.js         # Core layout state logic
│   │   ├── useCanvasAI.js          # Graph-based AI reasoning tools
│   │   ├── useChat.js              # Streaming LLM message logic
│   │   └── useDocuments.js         # Document parsing and state
│   ├── lib/
│   │   ├── storage.js              # Supabase abstraction layer
│   │   └── supabaseClient.js       # Supabase client singleton
│   ├── App.jsx                     # Root orchestrator component
│   ├── App.css                     # Main stylesheet
│   ├── index.css                   # Global CSS variables & resets
│   └── main.jsx                    # App entry point
├── auth-module/                    # Drop-in Authentication module (source)
├── api/                            # Vercel Serverless Functions
├── docs/                           # Internal documentation and guides
├── .env                            # Environment variables (not committed)
├── index.html
├── package.json
└── vite.config.js
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Notes

- AI inference is powered by NVIDIA NIM serverless APIs routed securely through a Vercel Edge Function (`api/chat.js`) in production, and a local Vite proxy (`vite.config.js`) during development.
- For production use, ensure Supabase Row-Level Security is enabled as per the SQL schema provided.
