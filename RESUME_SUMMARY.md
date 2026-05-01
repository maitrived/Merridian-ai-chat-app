# Resume Summary: "Thinking Canvas" AI Integration

**Project Overview**
Architected and developed "Thinking Canvas," a highly interactive, 2D spatial reasoning workspace integrated into an existing React/Vite local AI chat application. The canvas allows users to visually break down, connect, and branch AI-generated ideas in a non-linear format, bridging the gap between standard linear chat threads and visual mind mapping. This project was efficiently built through pair-programming with advanced AI coding assistants, showcasing a modern, AI-augmented development workflow.

**Key Features & Impact**
- **Spatial AI Interaction:** Engineered a seamless bi-directional workflow where users can push chat messages to the canvas as interactive nodes, and conversely inject spatial node clusters back into the LLM’s context window as system prompts.
- **AI-Powered Graph Operations:** Built advanced graph operations leveraging the local Ollama `/api/chat` endpoint. Features include:
  - **"Fill the Gap"**: An algorithmic approach that automatically prompts the LLM to generate logical intermediate bridging steps between any two connected nodes.
  - **"Collapse Cluster"**: Synthesizes multiple user-selected nodes into a single summary node while computationally remapping all existing graph edges to maintain relational integrity.
  - **"Fan Out" & "Branch Opposite"**: Implemented concurrent streaming API calls that generate multiple divergent AI reasoning paths simultaneously, rendering directly into the React component state with real-time UI loading indicators.
- **Complex State Management:** Managed highly dynamic, deeply nested state architectures using React hooks (`useCallback`, `useMemo`, `useContext`) and the `@xyflow/react` state engine. Handled edge-case resolution for node positional calculation, overlapping state mutations, and a custom Undo/Redo history stack hooked into drag events.
- **Advanced UI/UX:** Designed a premium, highly responsive user interface featuring inline double-click editing, custom right-click context menus, visual cluster highlighting (dimming non-connected nodes based on active selection), and customizable edge types (directed, bidirectional, conflict).
- **Data Persistence & Export:** Migrated state management from LocalStorage to a robust cloud database using Supabase (PostgreSQL), enabling reliable cross-device synchronization of chat sessions, AI messages, and dynamic 2D canvas states. Maintained integrated DOM-to-image conversion for exporting complex mind maps to high-resolution PNGs.

**Technical Stack**
- **Frontend:** React 19, Vite, Vanilla CSS
- **Graphing Engine:** React Flow (`@xyflow/react`)
- **Backend & Database:** Supabase (PostgreSQL), Ollama (Local LLM Inference)
- **Icons / Utilities:** Lucide-react, html-to-image
