import { useState, useCallback, useEffect } from 'react';

export function useAppLayout() {
  // Persist Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('merridian_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [isDocumentOpen, setIsDocumentOpen] = useState(() => {
    const saved = localStorage.getItem('merridian_doc_open');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isCanvasOpen, setIsCanvasOpen] = useState(() => {
    const saved = localStorage.getItem('merridian_canvas_open');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('merridian_sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('merridian_doc_open', JSON.stringify(isDocumentOpen));
  }, [isDocumentOpen]);

  useEffect(() => {
    localStorage.setItem('merridian_canvas_open', JSON.stringify(isCanvasOpen));
  }, [isCanvasOpen]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (!isSidebarOpen && isDocumentOpen && isCanvasOpen) {
      showToast("Maximum 3 panels allowed. Please close the Document or Canvas panel first.");
      return;
    }
    setIsSidebarOpen(prev => !prev);
  }, [isSidebarOpen, isDocumentOpen, isCanvasOpen, showToast]);

  const handleToggleDocument = useCallback(() => {
    if (!isDocumentOpen && isSidebarOpen && isCanvasOpen) {
      setIsSidebarOpen(false); // auto collapse sidebar
    }
    setIsDocumentOpen(prev => !prev);
  }, [isDocumentOpen, isSidebarOpen, isCanvasOpen]);

  const handleToggleCanvas = useCallback(() => {
    if (!isCanvasOpen && isSidebarOpen && isDocumentOpen) {
      setIsSidebarOpen(false); // auto collapse sidebar
    }
    setIsCanvasOpen(prev => !prev);
  }, [isCanvasOpen, isSidebarOpen, isDocumentOpen]);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    toastMessage,
    showToast,
    isDocumentOpen,
    setIsDocumentOpen,
    isCanvasOpen,
    setIsCanvasOpen,
    handleToggleSidebar,
    handleToggleDocument,
    handleToggleCanvas
  };
}
