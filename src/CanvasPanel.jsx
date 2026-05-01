import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  MarkerType,
  ReactFlowProvider,
} from '@xyflow/react';
import { Sparkles, Minimize2, Undo2, Redo2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import TextNode from './TextNode';
import LabeledEdge from './LabeledEdge';
import { CanvasActionContext } from './CanvasContext';
import './CanvasPanel.css';

// Stable references — defined outside component so React doesn't re-register on every render
const nodeTypes = { textNode: TextNode };
const edgeTypes = { labeled: LabeledEdge };

// Default connection params: use our custom LabeledEdge with an arrowhead
const defaultEdgeOptions = {
  type: 'labeled',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: 'rgba(100,110,160,0.55)',
  },
  data: { label: '' },
};

// Connection line style while dragging (before it snaps to a target)
const connectionLineStyle = {
  stroke: 'rgba(91,141,238,0.6)',
  strokeWidth: 2,
  strokeDasharray: '6 3',
};

function CanvasFlow({ nodes, edges, onNodesChange, onEdgesChange, setEdges, saveHistory }) {
  const onConnect = useCallback(
    (params) => {
      saveHistory?.();
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'labeled',
            markerEnd: defaultEdgeOptions.markerEnd,
            data: { label: '' },
          },
          eds
        )
      );
    },
    [setEdges, saveHistory]
  );

  const isEmpty = nodes.length === 0;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStart={saveHistory}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      fitView={isEmpty}
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.2}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
      // Makes edge labels editable via the ReactFlowProvider context
      elevateEdgesOnSelect
    >
      <Background
        variant={BackgroundVariant.Lines}
        gap={20}
        size={1}
        color="rgba(120, 120, 180, 0.1)"
      />
      <Controls
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
        }}
      />
      <MiniMap
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '12px',
        }}
        nodeColor={(n) => {
          const colors = { response: '#5b8dee', prompt: '#9b6dff', idea: '#f5a623' };
          return colors[n.data?.nodeType] || '#5b8dee';
        }}
        maskColor="rgba(0,0,0,0.06)"
      />

      {/* Empty State Overlay — only shown when no nodes exist */}
      {isEmpty && (
        <div className="canvas-empty-state">
          <div className="canvas-empty-icon">✦</div>
          <p className="canvas-empty-title">Canvas is empty</p>
          <p className="canvas-empty-sub">
            Click <strong>↗</strong> on any AI message to send it here.<br />
            Drag nodes · Draw connections · Double-click edges to label them.
          </p>
        </div>
      )}
    </ReactFlow>
  );
}

function CanvasPanel({ nodes, edges, onNodesChange, onEdgesChange, setEdges, fillGap, sendToChat, summarizeSelection, collapseCluster, addIdeaNode, branchOpposite, fanOut, undo, redo, canUndo, canRedo, saveHistory }) {
  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const selectedCount = selectedNodes.length;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo?.();
        } else {
          undo?.();
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onSummarizeClick = () => {
    const contents = selectedNodes.map(n => n.data.content);
    summarizeSelection(contents);
  };

  const onCollapseClick = () => {
    const nodeIds = selectedNodes.map(n => n.id);
    collapseCluster(nodeIds);
  };

  const onExportClick = () => {
    const flowContainer = document.querySelector('.react-flow__viewport');
    if (!flowContainer) return;

    toPng(flowContainer, {
      backgroundColor: 'transparent',
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', `thinking-canvas-${Date.now()}.png`);
      a.setAttribute('href', dataUrl);
      a.click();
    }).catch(err => {
      console.error('Export failed:', err);
    });
  };

  return (
    <aside className="canvas-panel">
      <div className="canvas-panel-header">
        <div className="canvas-panel-title">
          <span className="canvas-icon">🧠</span>
          <span>Thinking Canvas</span>
          {nodes.length > 0 && (
            <span className="canvas-node-count">{nodes.length}</span>
          )}
        </div>
        
        <div className="canvas-panel-actions">
          <button className="canvas-action-pill" onClick={undo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.4, background: 'transparent', color: 'var(--on-surface)' }} title="Undo (Cmd+Z)">
            <Undo2 size={12} />
          </button>
          <button className="canvas-action-pill" onClick={redo} disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.4, background: 'transparent', color: 'var(--on-surface)', marginRight: '4px' }} title="Redo (Cmd+Shift+Z)">
            <Redo2 size={12} />
          </button>
          <div style={{ width: '1px', height: '16px', background: 'var(--outline-variant)', marginRight: '4px' }} />

          {addIdeaNode && (
            <button className="canvas-action-pill" onClick={addIdeaNode} style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }} title="Add a new idea node">
              <span className="btn-text">+ Add Idea</span>
              <span className="btn-icon-only">+</span>
            </button>
          )}
          {selectedCount > 1 && (
            <>
              <button className="canvas-action-pill ai-action" onClick={onSummarizeClick} title={`Summarize ${selectedCount} notes`}>
                <Sparkles size={10} />
                <span className="btn-text">Summarize</span>
              </button>
              <button className="canvas-action-pill ai-action collapse-btn" onClick={onCollapseClick} title={`Collapse ${selectedCount} into one`}>
                <Minimize2 size={10} />
                <span className="btn-text">Collapse</span>
              </button>
            </>
          )}
          <button className="canvas-action-pill" onClick={onExportClick} style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', marginLeft: '4px' }} title="Export as PNG">
            <Download size={12} />
          </button>
        </div>
      </div>

      <div className="canvas-flow-wrapper">
        <CanvasActionContext.Provider value={{ sendToChat, branchOpposite, fanOut, fillGap }}>
          <ReactFlowProvider>
            <CanvasFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange} 
              setEdges={setEdges}
              saveHistory={saveHistory}
            />
          </ReactFlowProvider>
        </CanvasActionContext.Provider>
      </div>
    </aside>
  );
}

export default CanvasPanel;
