# 🧠 Thinking Canvas — Implementation Task List

> A visual, spatial node-based canvas alongside the chat where AI responses become building blocks you can drag, connect, branch, and reason over — non-linearly.

---

## Phase 1 — Foundation & Layout (COMPLETE)

- [x] **1.1** Add a third panel slot in `App.jsx` for the Canvas view (alongside sidebar and main chat)
- [x] **1.2** Add a "Canvas" toggle button in the top nav (next to the existing PanelLeft button)
- [x] **1.3** Create `CanvasPanel.jsx` component with a full-height, full-width container
- [x] **1.4** Install `@xyflow/react` for the 2D node-graph renderer
- [x] **1.5** Render an empty, pannable/zoomable canvas surface with a subtle grid background
- [x] **1.6** Add CSS for the canvas panel, ensuring it doesn't break the existing flex layout

---

## Phase 2 — Node System (COMPLETE)

- [x] **2.1** Define a `CanvasNode` data shape: `{ id, type, content, position: {x, y}, color }`
- [x] **2.2** Create a `TextNode` component — a card with the AI response text, a title bar, and a drag handle
- [x] **2.3** Add a "Send to Canvas" button (↗ icon) on every AI message bubble in the chat
- [x] **2.4** Clicking "Send to Canvas" creates a new node on the canvas with the message content
- [x] **2.5** Nodes should be draggable and freely positionable on the canvas
- [x] **2.6** Add node types:
  - `response` — AI-generated text (blue tint)
  - `prompt` — User question (purple tint)
  - `idea` — Freeform user note (yellow tint)
- [x] **2.7** Double-click any node to edit its content inline
- [x] **2.8** Right-click a node to open a context menu (Delete, Duplicate, Change Color, Fork)

---

## Phase 3 — Connections & Context (COMPLETE)

- [x] **3.1** Use `EdgeLabelRenderer` to add a small double-clickable text input on the middle of edges
- [x] **3.2** Set up handles on all 4 sides of the node (`target` left/top, `source` right/bottom)
- [x] **3.3** Support edge types: `→` (default), `⟺` (bidirectional), `✗` (conflict)
- [x] **3.4** Highlight all connected nodes when one is selected (visual cluster highlighting)
- [x] **3.5** Add a "Collapse Cluster" button — select multiple nodes → merge into a Summary node

---

## Phase 4 — AI-Assisted Reasoning Tools (COMPLETE)

- [x] **4.1** Select an edge and click "✨ Fill Gap" → AI generates 1–2 intermediate step nodes between source and target
- [x] **4.2** Add a "Branch" button to nodes: "What if the opposite?" (AI generates an opposing node)
- [x] **4.3** Add a "Fan Out" button: Generates 3 potential next steps/ideas from the current node
- [x] **4.4** Add a "Summarize" button for clusters (select multiple nodes → AI synthesis)
- [x] **4.5** All AI canvas calls use the same Ollama `/api/chat` streaming endpoint already in `App.jsx`
- [x] **4.6** Show a loading spinner inside the node while AI is generating its content

---

## Phase 5 — Re-Injection into Chat (COMPLETE)

- [x] **5.1** Add a "Send to Chat" button on every node (chat bubble icon)
- [x] **5.2** Clicking it adds the node's content as a system message context for the next turn
- [x] **5.3** Support sending a "Cluster Summary" — summarize a group and send the summary back to chat

---

## Phase 6 — Polish & Performance (COMPLETE)

- [x] **6.1** Persistence — save canvas state (nodes/edges) to LocalStorage per session
- [x] **6.2** Undo/Redo support for node movements and deletions
- [x] **6.3** Multi-select nodes (Shift + Click or Box Select)
- [x] **6.4** Export Canvas as Image (PNG/SVG)
- [x] **6.5** Keyboard shortcuts (Del to delete, Cmd+Z to undo)
- [x] **6.6** Mobile-friendly touch support (pinch-zoom, tap to select)

---

## Suggested Build Order

```
Phase 1 → Phase 2 (2.1–2.5) → Phase 3 (3.1–3.2) → Phase 4 (4.1) → Phase 5 → Phase 2 (2.6–2.8) → Phase 3 (3.3–3.5) → Phase 4 (4.2–4.6) → Phase 6
```

Start lean — get nodes rendering and draggable first, then layer in AI and connections.
