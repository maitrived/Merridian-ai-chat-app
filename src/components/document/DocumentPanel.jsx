import React from 'react';
import { FileText, Download, X } from 'lucide-react';

export default function DocumentPanel({
  documentTitle,
  setDocumentTitle,
  documentContent,
  setDocumentContent,
  downloadDocument,
  handleToggleDocument
}) {
  return (
    <aside className="document-panel">
      <div className="document-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <FileText size={16} color="var(--primary)" />
          <input 
            className="document-title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="Document Title"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="icon-btn" onClick={downloadDocument} title="Download Document">
            <Download size={14} />
          </button>
          <button className="icon-btn" onClick={handleToggleDocument}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="document-editor-wrapper">
        <textarea 
          className="document-textarea"
          value={documentContent}
          onChange={(e) => setDocumentContent(e.target.value)}
          placeholder="Start typing or upload a text file..."
        />
      </div>
    </aside>
  );
}
