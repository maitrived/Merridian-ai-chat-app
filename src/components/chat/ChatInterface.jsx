import React, { useRef, useState, useEffect } from 'react';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatInterface({
  messages,
  isGenerating,
  handleSend,
  handleRegenerate,
  sendToCanvas,
  setIsSettingsOpen,
  handleFileUpload,
  documents
}) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSend = () => {
    if (!input.trim() || isGenerating) return;
    handleSend(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        <WelcomeScreen setIsSettingsOpen={setIsSettingsOpen} setInput={setInput} />
      ) : (
        <MessageList 
          messages={messages} 
          isGenerating={isGenerating} 
          sendToCanvas={sendToCanvas} 
          handleRegenerate={handleRegenerate} 
          chatEndRef={chatEndRef} 
        />
      )}
      <div className="input-container">
        {messages.length === 0 && (
          <div className="suggested-prompts">
            <button className="prompt-chip" onClick={() => setInput("Explain quantum computing in simple terms")}>Explain Quantum</button>
            <button className="prompt-chip" onClick={() => setInput("Help me write a React hook for local storage")}>React Hook</button>
            <button className="prompt-chip" onClick={() => setInput("Summarize my document")}>Summarize Doc</button>
          </div>
        )}
        <ChatInput 
          input={input}
          setInput={setInput}
          isGenerating={isGenerating}
          handleSend={onSend}
          handleFileUpload={handleFileUpload}
          documents={documents}
        />
        <div style={{ marginTop: '0.4rem', fontSize: '0.6rem', color: 'var(--on-surface-variant)', opacity: 0.6, textAlign: 'center' }}>
           Merridian Local AI may provide inaccurate information. Verify critical data.
        </div>
      </div>
    </div>
  );
}
