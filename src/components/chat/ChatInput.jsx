import React, { useState, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSend,
  handleFileUpload,
  documents
}) {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }

    // Detect @ mention
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleMentionSelect = (doc) => {
    const cursorPosition = textareaRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);
    
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    if (mentionMatch) {
      const newTextBefore = textBeforeCursor.slice(0, mentionMatch.index) + `@${doc.title.replace(/\s+/g, '_')} `;
      setInput(newTextBefore + textAfterCursor);
      setShowMentionMenu(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-box" style={{ position: 'relative' }}>
      {showMentionMenu && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, 
          background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)',
          borderRadius: '12px', padding: '8px', marginBottom: '8px', width: '250px',
          boxShadow: 'var(--shadow-lg)', zIndex: 10
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '4px', padding: '0 4px' }}>Select Document</div>
          {documents.filter(d => d.title.toLowerCase().includes(mentionQuery)).map(doc => (
            <div 
              key={doc.id}
              onClick={() => handleMentionSelect(doc)}
              style={{ padding: '6px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px' }}
              onMouseEnter={(e) => e.target.style.background = 'var(--surface-container)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              📄 {doc.title}
            </div>
          ))}
          {documents.filter(d => d.title.toLowerCase().includes(mentionQuery)).length === 0 && (
            <div style={{ padding: '6px 8px', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>No matching documents</div>
          )}
        </div>
      )}
      
      <div className="action-buttons">
        <input 
          type="file" 
          id="file-upload"
          accept=".txt,.md,.json,.csv,.docx"
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        <label htmlFor="file-upload" className="icon-btn" title="Upload specific file context">
          <Paperclip size={16} />
        </label>
      </div>
      
      <div className="textarea-wrapper">
        <textarea 
          className="chat-input-area"
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Merridian..."
          rows={1}
        />
      </div>

      <div className="action-buttons">
        <button 
          className={`icon-btn send-btn`}
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
