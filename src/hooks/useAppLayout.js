import { useState, useCallback } from 'react';

export function useAppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

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
