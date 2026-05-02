import { memo, useState, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { MessageSquare, GitBranch, Split, Loader2 } from 'lucide-react';
import { CanvasActionContext } from '../../context/CanvasContext';
import './TextNode.css';

const NODE_COLORS = {
  response: { accent: '#5b8dee', bg: 'rgba(91,141,238,0.08)',  label: 'AI Response' },
  prompt:   { accent: '#9b6dff', bg: 'rgba(155,109,255,0.08)', label: 'Prompt' },
  idea:     { accent: '#f5a623', bg: 'rgba(245,166,35,0.08)',   label: 'Idea' },
};

function TextNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  const allNodes = useNodes();
  const allEdges = useEdges();
  
  const { sendToChat, branchOpposite, fanOut } = useContext(CanvasActionContext);

  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const colors = NODE_COLORS[data.nodeType] || NODE_COLORS.response;
  const isLong = data.content && data.content.length > 220;

  // Visual Cluster Highlighting
  const hasSelection = allNodes.some(n => n.selected);
  const isConnected = allEdges.some(e => 
    (e.source === id && allNodes.find(n => n.id === e.target)?.selected) ||
    (e.target === id && allNodes.find(n => n.id === e.source)?.selected)
  );
  const isHighlighted = selected || isConnected;
  const nodeOpacity = hasSelection && !isHighlighted ? 0.4 : 1;
  const nodeScale = selected ? 1.02 : 1;

  // -- Editing --
  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(data.content);
  };

  const saveEdit = () => {
    setIsEditing(false);
    setNodes(nds => nds.map(n => n.id === data.id ? { ...n, data: { ...n.data, content: editValue } } : n));
  };

  // -- Context Menu --
  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (menuOpen) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [menuOpen]);

  const handleDelete = () => setNodes(nds => nds.filter(n => n.id !== data.id));
  const handleDuplicate = () => {
    setNodes(nds => {
      const node = nds.find(n => n.id === data.id);
      if (!node) return nds;
      const newId = `node-${Date.now()}`;
      return [...nds, {
        ...node,
        id: newId,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        data: { ...node.data, id: newId },
        selected: false
      }];
    });
  };
  const handleChangeType = (type) => {
    setNodes(nds => nds.map(n => n.id === data.id ? { 
      ...n, 
      data: { ...n.data, nodeType: type, color: NODE_COLORS[type].accent } 
    } : n));
  };

  return (
    <div 
      className="text-node" 
      style={{ 
        '--node-accent': colors.accent, 
        '--node-bg': colors.bg,
        opacity: nodeOpacity,
        transform: `scale(${nodeScale})`,
        transition: 'opacity 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease'
      }} 
      onContextMenu={handleContextMenu}
    >
      {/* ── Connection handles on all 4 sides ── */}
      <Handle type="target" position={Position.Left}   className="node-handle" id="left"   />
      <Handle type="source" position={Position.Right}  className="node-handle" id="right"  />
      <Handle type="target" position={Position.Top}    className="node-handle" id="top"    />
      <Handle type="source" position={Position.Bottom} className="node-handle" id="bottom" />

      {/* ── Title bar / drag handle ── */}
      <div className="text-node-header">
        <div className="text-node-type-badge">
          <span className="text-node-dot" />
          {colors.label}
        </div>
        <div className="text-node-header-actions">
          {branchOpposite && (
            <button 
              className="text-node-action-btn nodrag nopan" 
              title="What if the opposite?"
              onClick={(e) => { e.stopPropagation(); branchOpposite(id, data.content); }}
            >
              <GitBranch size={12} />
            </button>
          )}
          {fanOut && (
            <button 
              className="text-node-action-btn nodrag nopan" 
              title="Fan Out (Generate 3 ideas)"
              onClick={(e) => { e.stopPropagation(); fanOut(id, data.content); }}
            >
              <Split size={12} />
            </button>
          )}
          <button 
            className="text-node-action-btn nodrag nopan" 
            title="Send to Chat"
            onClick={(e) => {
              e.stopPropagation();
              if (sendToChat) sendToChat(data.content);
            }}
          >
            <MessageSquare size={12} />
          </button>
          <div className="text-node-drag-grip" title="Drag to move">⠿</div>
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="text-node-body" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <textarea
            className="text-node-edit-input nodrag nopan"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) saveEdit(); }}
            autoFocus
          />
        ) : (
          <>
            <p className={`text-node-content ${!expanded && isLong ? 'truncated' : ''}`}>
              {data.content}
              {data.isGenerating && <span className="blinking-cursor" />}
            </p>
            {isLong && !data.isGenerating && (
              <button
                className="text-node-expand-btn nodrag nopan"
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              >
                {expanded ? 'Show less ↑' : 'Show more ↓'}
              </button>
            )}
            {data.isGenerating && (
              <div className="text-node-generating">
                <Loader2 size={12} className="spin" />
                <span>Thinking...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Context Menu ── */}
      {menuOpen && (
        <div className="text-node-context-menu nodrag nopan">
          <div className="context-menu-item" onClick={handleDuplicate}>Duplicate</div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleChangeType('prompt')}>Set to Prompt</div>
          <div className="context-menu-item" onClick={() => handleChangeType('idea')}>Set to Idea</div>
          <div className="context-menu-item" onClick={() => handleChangeType('response')}>Set to Response</div>
          <div className="context-menu-divider" />
          <div className="context-menu-item delete" onClick={handleDelete}>Delete</div>
        </div>
      )}
    </div>
  );
}

export default memo(TextNode);
