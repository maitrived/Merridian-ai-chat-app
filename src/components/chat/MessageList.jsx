import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Network, ArrowUpRight, RefreshCw } from 'lucide-react';

export default function MessageList({ messages, isGenerating, sendToCanvas, handleRegenerate, chatEndRef }) {
  return (
    <div className="messages-list" style={{ width: '100%', maxWidth: '600px' }}>
      {messages.map((msg, idx) => (
        <div key={idx} className={`message-wrapper ${msg.role}`}>
          {msg.role !== 'system' && (
            <div className={`avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
            <div className="message-bubble" style={{ maxWidth: '100%' }}>
              {msg.role === 'user' ? (
                <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              ) : msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {(isGenerating && idx === messages.length - 1) && <span className="blinking-cursor" />}
                </div>
              ) : (
                <div className="system-context-note">
                  <Network size={10} />
                  <span>Canvas Context Added</span>
                  <div className="system-context-preview">{msg.content.replace('Context from Thinking Canvas:', '').trim()}</div>
                </div>
              )}
            </div>
            {/* Action buttons */}
            {msg.role !== 'system' && msg.content && !(msg.role === 'assistant' && isGenerating && idx === messages.length - 1) && (
              <div className={`message-actions-container ${msg.role === 'user' ? 'user' : 'bot'}`}>
                <button
                  className="icon-btn"
                  onClick={() => sendToCanvas(msg.content, msg.role === 'user' ? 'prompt' : 'response')}
                  title="Send to Thinking Canvas"
                >
                  <ArrowUpRight size={12} />
                </button>
                {msg.role === 'assistant' && (
                  <button
                    className="icon-btn"
                    onClick={() => handleRegenerate(idx)}
                    title="Regenerate Response"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
