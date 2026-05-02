# Merridian — Local AI Chat & Thinking Canvas

A privacy-first AI chat application that runs entirely on your machine via [Ollama](https://ollama.com). Merridian pairs a polished chat interface with a **Thinking Canvas** — a 2D spatial reasoning workspace where you can visually map, connect, and branch ideas generated from your conversations.

---

## Features
### 💬 Chat
- **Local LLM inference** via Ollama (supports Llama 3, Phi-3, Mistral, and any Ollama-compatible model)
- **Streaming responses** with a live blinking cursor
- **Session history** — conversations are persisted to Supabase and reload on refresh
- **Document context** — upload `.txt`, `.md`, `.json`, `.csv`, or `.docx` files to give the AI context without copy-pasting
- **Markdown rendering** for AI responses

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

### ⚙️ Persistence & Polish
- **Supabase backend** — chat sessions, messages, and canvas state all sync to PostgreSQL
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
| Graph Engine | `@xyflow/react` (React Flow) |
| AI Inference | Ollama (local, any model) |
| Database | Supabase (PostgreSQL) |
| Document Parsing | `mammoth` (DOCX), native FileReader |
| Icons | `lucide-react` |
| Canvas Export | `html-to-image` |

---

## Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **Ollama** — [install here](https://ollama.com/download), then pull at least one model:
   ```bash
   ollama pull llama3
   ```
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
```

### Running Locally

```bash
# Start Ollama (if not already running as a system service)
ollama serve

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
│   │   └── canvas/                 # Thinking Canvas components
│   │       ├── CanvasPanel.jsx     # Main canvas panel + toolbar
│   │       ├── CanvasPanel.css
│   │       ├── TextNode.jsx        # Draggable idea card node
│   │       ├── TextNode.css
│   │       ├── LabeledEdge.jsx     # Custom edge with inline labels
│   │       └── LabeledEdge.css
│   ├── context/
│   │   └── CanvasContext.js        # React context for canvas actions
│   ├── lib/
│   │   └── supabaseClient.js       # Supabase client singleton
│   ├── assets/
│   ├── App.jsx                     # Root component & all app logic
│   ├── App.css                     # Main stylesheet
│   ├── index.css                   # Global CSS variables & resets
│   └── main.jsx                    # App entry point
├── docs/
│   └── supabase_schema.sql         # Database schema
├── scripts/
│   └── test-crash.js               # Puppeteer smoke test script
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

- All AI inference runs **100% locally** — no data is sent to any cloud AI provider.
- For production use, enable Supabase Row-Level Security with proper auth policies.
