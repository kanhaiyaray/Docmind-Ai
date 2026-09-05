import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ReactMarkdown from 'react-markdown';
import { Send, FileText, Menu, X, Plus, ChevronLeft } from 'lucide-react';

const Chat = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d._id === documentId);
      setSelectedDoc(doc);
      if (doc) fetchChatHistory(doc._id);
    }
  }, [documentId, documents]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      const completedDocs = response.data.filter(doc => doc.status === 'completed');
      setDocuments(completedDocs);
      
      // If no document selected and we have documents, select first one
      if (!documentId && completedDocs.length > 0) {
        navigate(`/chat/${completedDocs[0]._id}`);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (docId) => {
    try {
      const response = await api.get(`/chat/history?documentId=${docId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
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

      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources || [],
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <Loading fullPage />;

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* Sidebar - Document List */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white flex-shrink-0`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Documents</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No documents available</p>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-primary-600 text-sm mt-2 hover:underline"
                >
                  Upload a document
                </button>
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    navigate(`/chat/${doc._id}`);
                    setMessages([]);
                    fetchChatHistory(doc._id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDoc?._id === doc._id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {doc.pageCount || 0} pages
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {selectedDoc ? (
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{selectedDoc.title}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedDoc.pageCount || 0} pages
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                {documents.length > 0 ? 'Select a document' : 'No documents available'}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FileText className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">Start a conversation</p>
              <p className="text-sm">
                Ask questions about your document
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : msg.error
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                      <div className="space-y-1">
                        {msg.sources.map((source, i) => (
                          <div key={i} className="text-xs text-primary-600">
                            📄 {source.document || 'Document'} — Page {source.page}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedDoc ? "Ask a question about this document..." : "Select a document to start..."}
              disabled={!selectedDoc || sending}
              className="flex-1 input-field"
            />
            <button
              onClick={sendMessage}
              disabled={!selectedDoc || !input.trim() || sending}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
