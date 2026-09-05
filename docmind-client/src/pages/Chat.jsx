import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileText, Send, Sparkles, Upload, Plus } from 'lucide-react';
import Loading from '../components/Loading';

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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d._id === documentId);
      setSelectedDoc(doc);
      if (doc) {
        fetchConversationHistory(doc._id);
      }
    }
  }, [documentId, documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      let docs = [];
      if (Array.isArray(response.data)) docs = response.data;
      else if (response.data.documents) docs = response.data.documents;
      
      console.log('📄 Documents fetched:', docs.length);
      
      // Show all documents, not just completed ones
      setDocuments(docs);
      
      // Check if any document is processing
      const processing = docs.filter(d => d.status === 'processing');
      if (processing.length > 0) {
        setIsProcessing(true);
        // Poll for completion
        checkProcessingStatus(processing.map(d => d._id));
      } else {
        setIsProcessing(false);
      }
      
      if (!documentId && docs.length > 0) {
        // Select first completed document, or any document
        const firstDoc = docs.find(d => d.status === 'completed') || docs[0];
        if (firstDoc) {
          navigate(`/chat/${firstDoc._id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProcessingStatus = async (docIds) => {
    // Poll every 3 seconds to check if documents are processed
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/documents');
        let docs = [];
        if (Array.isArray(response.data)) docs = response.data;
        else if (response.data.documents) docs = response.data.documents;
        
        const stillProcessing = docs.filter(d => 
          docIds.includes(d._id) && d.status === 'processing'
        );
        
        if (stillProcessing.length === 0) {
          clearInterval(interval);
          setIsProcessing(false);
          // Refresh documents
          fetchDocuments();
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 3000);
  };

  const fetchConversationHistory = async (docId) => {
    try {
      const response = await api.get(`/chat/history?documentId=${docId}&limit=50`);
      if (response.data.conversations && response.data.conversations.length > 0) {
        const latest = response.data.conversations[0];
        setMessages(latest.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedDoc) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await api.post('/chat', {
        question: input,
        documentId: selectedDoc._id,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer || 'No response received.',
        sources: response.data.sources || [],
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        error: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '✅ Ready';
      case 'processing': return '⏳ Processing...';
      case 'failed': return '❌ Failed';
      default: return '⏳ Pending';
    }
  };

  if (loading) return <Loading fullPage />;

  // No documents available - show upload prompt
  if (documents.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-main" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f8f9fc'
        }}>
          <div style={{ 
            textAlign: 'center', 
            maxWidth: '400px',
            padding: '40px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a2e', marginBottom: '8px' }}>
              No Documents Available
            </h2>
            <p style={{ color: '#a0a7b5', marginBottom: '24px' }}>
              Upload a PDF document to start chatting with it.
            </p>
            <button 
              onClick={() => navigate('/documents')}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only show documents that are completed or processing
  const availableDocs = documents;
  const completedDocs = availableDocs.filter(d => d.status === 'completed');
  const processingDocs = availableDocs.filter(d => d.status === 'processing');

  return (
    <div className="chat-container">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">Your Documents</div>
        
        {isProcessing && (
          <div style={{ 
            padding: '10px 12px', 
            background: '#fff8e8', 
            borderRadius: '8px', 
            marginBottom: '12px',
            fontSize: '12px',
            color: '#fdcb6e'
          }}>
            ⏳ Processing documents...
          </div>
        )}
        
        {availableDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#a0a7b5', fontSize: '13px' }}>
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No documents available
          </div>
        ) : (
          availableDocs.map((doc) => (
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
              style={{
                opacity: doc.status === 'completed' ? 1 : 0.5,
                cursor: doc.status === 'completed' ? 'pointer' : 'not-allowed'
              }}
            >
              <FileText className="h-4 w-4" />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title || 'Untitled'}
              </span>
              <span style={{ fontSize: '10px', color: '#a0a7b5' }}>
                {getStatusText(doc.status)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Chat Main */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">✨</div>
              <div className="chat-welcome-title">
                {selectedDoc ? `Ask about "${selectedDoc.title}"` : 'Select a document to start'}
              </div>
              <div className="chat-welcome-sub">
                {selectedDoc 
                  ? 'Ask anything about your PDF' 
                  : completedDocs.length > 0 
                    ? 'Choose a document from the sidebar' 
                    : 'Upload a document to get started'}
              </div>
              {selectedDoc && (
                <div className="chat-suggestions">
                  <button className="chat-suggestion" onClick={() => handleSuggestedQuestion('Summarize this document')}>
                    📝 Summarize
                  </button>
                  <button className="chat-suggestion" onClick={() => handleSuggestedQuestion('What are the key concepts?')}>
                    🔑 Key concepts
                  </button>
                  <button className="chat-suggestion" onClick={() => handleSuggestedQuestion('What are the main findings?')}>
                    📊 Main findings
                  </button>
                </div>
              )}
              {!selectedDoc && completedDocs.length === 0 && (
                <button 
                  onClick={() => navigate('/documents')}
                  className="btn-primary"
                  style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload className="h-4 w-4" />
                  Upload a Document
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    padding: '12px 18px',
                    borderRadius: '16px',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' 
                      : 'white',
                    color: msg.role === 'user' ? 'white' : '#1a1a2e',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: msg.role === 'assistant' ? '1px solid #eef0f3' : 'none',
                  }}
                >
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#a0a7b5' }}>
                      📄 Sources: {msg.sources.map(s => `Page ${s.page}`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 18px', background: 'white', borderRadius: '16px', border: '1px solid #eef0f3' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ animation: 'pulse 1.4s infinite', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.2s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite 0.4s', display: 'inline-block' }}>●</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={selectedDoc ? "Ask a question about this document..." : "Select a document first..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!selectedDoc || sending || selectedDoc?.status !== 'completed'}
          />
          <button 
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!selectedDoc || !input.trim() || sending || selectedDoc?.status !== 'completed'}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
