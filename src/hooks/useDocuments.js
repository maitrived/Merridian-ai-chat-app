import { useState, useCallback, useEffect } from 'react';
import mammoth from 'mammoth';
import { storage } from '../lib/storage';

export function useDocuments(session) {
  const [documents, setDocuments] = useState([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');

  // Fetch initial docs
  useEffect(() => {
    if (!session) return;
    async function fetchDocs() {
      try {
        const docsData = await storage.getDocuments(session);
        if (docsData) {
          setDocuments(docsData);
        }
      } catch (err) {
        console.error("Storage Error fetching docs:", err);
      }
    }
    fetchDocs();
  }, [session]);

  const handleFileUpload = useCallback(async (e, onSuccess) => {
    const file = e.target.files[0];
    if (!file) return;

    let textContent = '';
    
    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } catch (error) {
        console.error("Error parsing DOCX:", error);
        alert("Could not extract text from this Word document.");
        e.target.value = null;
        return;
      }
    } else {
      textContent = await file.text();
    }
    
    try {
      const newDoc = await storage.saveDocument(session, file.name, textContent);
      setDocuments(prev => [newDoc, ...prev]);
      
      setDocumentTitle(newDoc.title);
      setDocumentContent(newDoc.content);
      
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Save doc error:", err);
      alert("Failed to save document.");
    }
    
    e.target.value = null; // reset
  }, [session]);

  const downloadDocument = useCallback(() => {
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documentTitle || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [documentContent, documentTitle]);

  const deleteDocument = useCallback(async (e, docId) => {
    e.stopPropagation();
    try {
      await storage.deleteDocument(session, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      
      // We return true if we deleted the currently active document
      return true;
    } catch(err) { 
      alert(err.message); 
      return false;
    }
  }, [session]);

  return {
    documents,
    setDocuments,
    documentTitle,
    setDocumentTitle,
    documentContent,
    setDocumentContent,
    handleFileUpload,
    downloadDocument,
    deleteDocument
  };
}
