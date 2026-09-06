import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileText, Send, Upload } from 'lucide-react';
import Loading from '../components/Loading';
import { useErrorHandler } from '../hooks/useErrorHandler';

const Chat = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d._id === documentId);
      setSelectedDoc(doc);
      if (doc) fetchConversationHistory(doc._id);
    }
  }, [documentId, documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      const docs = Array.isArray(response.data) ? response.data : response.data.documents || [];
      setDocuments(docs);
      const processing = docs.filter(d => d.status === 'processing');
      if (processing.length > 0) {
        setIsProcessing(true);
        pollProcessing(processing.map(d => d._id));
      } else setIsProcessing(false);
      if (!documentId && docs.length > 0) {
        const first = docs.find(d => d.status === 'completed') || docs[0];
        if (first) navigate(`/chat/${first._id}`);
      }
    } catch (error) {
      handleError(error, 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate, handleError]);

  const pollProcessing = useCallback((ids) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/documents');
        const docs = Array.isArray(response.data) ? response.data : response.data.documents || [];
        const still = docs.filter(d => ids.includes(d._id) && d.status === 'processing');
        if (still.length === 0) {
          clearInterval(interval);
          setIsProcessing(false);
          fetchDocuments();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  }, [fetchDocuments]);

  const fetchConversationHistory = useCallback(async (docId) => {
    try {
      const response = await api.get(`/chat/history?documentId=${docId}&limit=50`);
      const convs = response.data.conversations || [];
      if (convs.length > 0) setMessages(convs[0].messages || []);
      else setMessages([]);
    } catch (error) {
      console.error('History error:', error);
      setMessages([]);
    }
  }, []);

  // ---- Optimistic send ----
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedDoc || selectedDoc.status !== 'completed') return;

    // Optimistic user message
    const tempId = Date.now();
    const userMsg = { role: 'user', content: trimmed, _temp: true, id: tempId };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    if (inputRef.current) inputRef.current.focus();

    try {
      const response = await api.post('/chat', {
        question: trimmed,
        documentId: selectedDoc._id,
      });
      // Replace the temporary message with the real one (or keep it) and add assistant reply
      setMessages(prev => {
        const filtered = prev.filter(m => !(m._temp && m.id === tempId));
        return [
          ...filtered,
          { role: 'user', content: trimmed }, // real user message
          {
            role: 'assistant',
            content: response.data.answer || 'No response.',
            sources: response.data.sources || [],
          },
        ];
      });
      handleSuccess('Response received');
    } catch (error) {
      // Remove optimistic message and show error
      setMessages(prev => prev.filter(m => !(m._temp && m.id === tempId)));
      handleError(error, 'Failed to get response');
    } finally {
      setSending(false);
    }
  }, [input, selectedDoc, handleError, handleSuccess]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggested = (q) => setInput(q);

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '✅ Ready';
      case 'processing': return '⏳ Processing...';
      case 'failed': return '❌ Failed';
      default: return '⏳ Pending';
    }
  };

  if (loading) return <Loading fullPage />;

  // No documents
  if (documents.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a2e', marginBottom: '8px' }}>No Documents Available</h2>
            <p style={{ color: '#a0a7b5', marginBottom: '24px' }}>Upload a PDF to start chatting.</p>
            <button onClick={() => navigate('/documents')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableDocs = documents;
  const completedDocs = availableDocs.filter(d => d.status === 'completed');

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">Your Documents</div>
        {isProcessing && <div style={{ padding: '10px 12px', background: '#fff8e8', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#fdcb6e' }}>⏳ Processing...</div>}
        {availableDocs.map((doc) => (
          <div
            key={doc._id}
            className={`chat-doc-item ${selectedDoc?._id === doc._id ? 'active' : ''}`}
            onClick={() => {
              if (doc.status === 'completed') {
                setSelectedDoc(doc);
                navigate(`/chat/${doc._id}`);
                setMessages([]);
                fetchConversationHistory(doc._id);
              }
            }}
            style={{ opacity: doc.status === 'completed' ? 1 : 0.5, cursor: doc.status === 'completed' ? 'pointer' : 'not-allowed' }}
          >
            <FileText className="h-4 w-4" />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title || 'Untitled'}</span>
            <span style={{ fontSize: '10px', color: '#a0a7b5' }}>{getStatusText(doc.status)}</span>
          </div>
        ))}
      </div>

      {/* Chat main */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">✨</div>
              <div className="chat-welcome-title">{selectedDoc ? `Ask about "${selectedDoc.title}"` : 'Select a document'}</div>
              <div className="chat-welcome-sub">{selectedDoc ? 'Ask anything about your PDF' : completedDocs.length ? 'Choose a document from the sidebar' : 'Upload a document to get started'}</div>
              {selectedDoc && (
                <div className="chat-suggestions">
                  <button className="chat-suggestion" onClick={() => handleSuggested('Summarize this document')}>📝 Summarize</button>
                  <button className="chat-suggestion" onClick={() => handleSuggested('What are the key concepts?')}>🔑 Key concepts</button>
                  <button className="chat-suggestion" onClick={() => handleSuggested('What are the main findings?')}>📊 Main findings</button>
                </div>
              )}
              {!selectedDoc && completedDocs.length === 0 && (
                <button onClick={() => navigate('/documents')} className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Upload className="h-4 w-4" /> Upload
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '12px 18px',
                      borderRadius: '16px',
                      background: isUser ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : 'white',
                      color: isUser ? 'white' : '#1a1a2e',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: isUser ? 'none' : '1px solid #eef0f3',
                      opacity: msg._temp ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    {msg.sources?.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#a0a7b5' }}>
                        📄 Sources: {msg.sources.map(s => `Page ${s.page}`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
              {sending && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 18px', background: 'white', borderRadius: '16px', border: '1px solid #eef0f3' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ animation: 'pulse 1.4s infinite', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.2s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.4s', display: 'inline-block' }}>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={selectedDoc ? "Ask a question..." : "Select a document first..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!selectedDoc || sending || selectedDoc?.status !== 'completed'}
          />
          <button className="chat-send-btn" onClick={sendMessage} disabled={!selectedDoc || !input.trim() || sending || selectedDoc?.status !== 'completed'}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
