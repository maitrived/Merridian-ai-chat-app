# Thinking Canvas — Feature Guide

This document provides a comprehensive breakdown of all features implemented across the six development phases of the "Thinking Canvas" in the AI Chat App.

## Phase 1: Foundation & Layout
- **Infinite 2D Graph Canvas**: Added an expandable third pane powered by `@xyflow/react` that renders a smooth, panning, and zoomable 2D workspace alongside the main chat.
- **Node-Based UI**: Established the foundational `TextNode` allowing ideas to be represented as draggable cards floating in spatial relation to one another.

## Phase 2: The Node System
- **Node Tints & Typing**: Nodes are categorized and tinted visually: 
  - **Prompt Nodes** (Purple): Represent user inputs.
  - **Response Nodes** (Blue): Represent AI-generated answers.
  - **Idea Nodes** (Yellow): Represent freeform, user-generated manual notes.
- **Send to Canvas**: A dedicated button (↗) on chat messages that instantly pushes text from the linear chat thread into the spatial canvas as a new node.
- **Inline Editing**: Double-clicking any node on the canvas instantly flips it into an editable textarea, allowing you to tweak the AI's responses or flesh out your own ideas.
- **Right-Click Node Context Menu**: Right-clicking a node opens a custom context menu allowing you to:
  - Duplicate the node.
  - Delete the node.
  - Change the node's type (e.g., convert a Response to a Prompt, updating its color coding).

## Phase 3: Connections & Context
- **Labeled Edges**: Nodes can be wired together by dragging from their side handles. Double-clicking the connection line opens an inline input to label the edge (e.g., "leads to", "contradicts").
- **Edge Types**: Right-clicking the label of an edge lets you switch it between:
  - **Directed (→)**: A standard directional flow.
  - **Bidirectional (⟺)**: Two-way relationship.
  - **Conflict (✗)**: Renders as a dashed red line to represent opposing ideas.
- **Visual Cluster Highlighting**: Selecting any node on a crowded canvas will immediately dim all non-connected nodes and edges, throwing the immediate cluster into sharp focus.
- **Collapse Cluster**: Selecting multiple nodes reveals a `Collapse` action. Clicking it sends the selected nodes to the AI, which synthesizes them into a single Summary node. The system intelligently removes the old nodes and remaps all existing incoming/outgoing edges to the new master node.

## Phase 4: AI-Assisted Reasoning Tools
- **Fill the Gap**: Selecting an empty edge between two nodes reveals a `✨ Fill Gap` button. The AI analyzes the source and target nodes and automatically generates 1-2 intermediate bridging nodes to logically connect the ideas.
- **Branch Opposite**: Clicking the branch icon (`GitBranch`) in a node's header asks the AI to generate a complete counter-argument or opposing view, streaming it into a new connected node.
- **Fan Out**: Clicking the split icon (`Split`) triggers 3 concurrent AI streams. It simultaneously generates three connected nodes branching off the original idea: a logical next step, a lateral alternative, and a wild-card creative step.
- **Real-time Local Streaming**: All node generations use the local Ollama streaming API. New nodes display a `Thinking...` spinner and a blinking cursor as the AI types directly into the canvas.

## Phase 5: Re-Injection into Chat
- **Node to Chat Context**: Every node features a `MessageSquare` icon. Clicking it sends the node's content back to the linear chat thread as a stylized "Canvas Context Added" system pill. This forces the AI to consider this specific node in its next conversational reply.
- **Summarize & Send**: Selecting multiple nodes reveals a `Summarize` button. This synthesizes the selected cluster into a single insight and injects that summary directly into the chat history.

## Phase 6: Polish & Performance
- **Cloud Persistence**: The canvas state (all nodes, coordinates, and edges) and chat history are synced directly to a Supabase PostgreSQL database with debounced updates, enabling reliable cross-device persistence and ensuring your mind map survives page reloads.
- **Undo / Redo Stack**: Integrated a full history stack. Pressing `Cmd+Z` / `Cmd+Shift+Z` or using the header buttons allows you to step backward/forward through your structural changes.
- **Export to Image**: A download button (`Download` icon) uses `html-to-image` to render the ReactFlow viewport into a high-quality transparent PNG for easy sharing.
- **Keyboard & Touch**: Full support for native keyboard shortcuts (e.g., `Delete` / `Backspace` to remove elements) and seamless touch/trackpad panning and zooming.
