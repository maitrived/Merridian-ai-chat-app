import { memo, useState, useRef, useEffect, useCallback, useContext } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  useReactFlow,
  MarkerType,
  useNodes,
} from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { CanvasActionContext } from '../../context/CanvasContext';
import './LabeledEdge.css';

function LabeledEdge({
  id,
  source, target,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data = {},
  selected,
  markerEnd,
  style = {},
}) {
  const { setEdges } = useReactFlow();
  const { fillGap } = useContext(CanvasActionContext);
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label || '');
  const inputRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (menuOpen) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [menuOpen, closeMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  const handleChangeType = (type) => {
    setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, edgeType: type } } : e));
  };

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, label: labelValue.trim() } }
          : e
      )
    );
  }, [id, labelValue, setEdges]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitLabel();
    if (e.key === 'Escape') {
      setLabelValue(data.label || '');
      setIsEditing(false);
    }
  };

  // Visual Cluster Highlighting
  const allNodes = useNodes();
  const hasSelection = allNodes.some(n => n.selected);
  const isHighlighted = selected || allNodes.some(n => n.selected && (n.id === source || n.id === target));
  const edgeOpacity = hasSelection && !isHighlighted ? 0.2 : 1;

  const hasLabel = data.label && data.label.trim().length > 0;

  const isThinking = data.label === '✨ Thinking...';

  const onFillGapClick = (e) => {
    e.stopPropagation();
    if (fillGap) {
      fillGap(id);
    }
  };

  const edgeType = data.edgeType || 'directed';
  const isConflict = edgeType === 'conflict';
  
  const baseColor = selected ? '#5b8dee' : 'rgba(100,110,160,0.55)';
  const conflictColor = selected ? '#ef5350' : 'rgba(239,83,80,0.7)';
  const color = isConflict ? conflictColor : baseColor;

  const customMarkerEnd = !isConflict ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color } : undefined;
  const customMarkerStart = edgeType === 'bidirectional' ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color } : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={customMarkerEnd}
        markerStart={customMarkerStart}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.8,
          strokeDasharray: isConflict ? '4 4' : 'none',
          opacity: edgeOpacity,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.3s ease',
          ...style,
        }}
      />

      {/* Label rendered in HTML space via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          className={`edge-label-wrapper ${selected ? 'selected' : ''} ${hasLabel ? 'has-label' : 'no-label'} ${isThinking ? 'is-thinking' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            opacity: edgeOpacity,
            transition: 'opacity 0.3s ease',
            pointerEvents: edgeOpacity < 1 ? 'none' : 'all',
          }}
        >
          <div
            className="edge-label-container"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onContextMenu={handleContextMenu}
            title={isEditing ? '' : 'Double-click to edit, Right-click for options'}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="edge-label-input nodrag nopan"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitLabel}
                placeholder="e.g. leads to…"
                maxLength={40}
              />
            ) : (
              <span className="edge-label-text">
                {hasLabel ? data.label : <span className="edge-label-placeholder">+</span>}
              </span>
            )}
          </div>

          {/* 4.1 Fill the Gap Button */}
          {selected && !isEditing && !hasLabel && data.label !== '✨ Thinking...' && (
            <button 
              className="fill-gap-btn nodrag nopan"
              onClick={onFillGapClick}
              title="AI: Fill the Gap"
            >
              <Sparkles size={10} />
              <span>Fill Gap</span>
            </button>
          )}

          {/* Edge Context Menu */}
          {menuOpen && (
            <div className="edge-context-menu nodrag nopan">
              <div className="edge-context-menu-item" onClick={() => handleChangeType('directed')}>→ Directed</div>
              <div className="edge-context-menu-item" onClick={() => handleChangeType('bidirectional')}>⟺ Bidirectional</div>
              <div className="edge-context-menu-item" onClick={() => handleChangeType('conflict')}>✗ Conflict</div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(LabeledEdge);
