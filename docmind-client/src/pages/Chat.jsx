import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FileText, Send, Upload, Check, X, Plus } from "lucide-react";
import Loading from "../components/Loading";
import { useErrorHandler } from "../hooks/useErrorHandler";

const Chat = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documentId && documents.length > 0) {
      const exists = documents.some(d => d._id === documentId);
      if (exists) {
        setSelectedIds([documentId]);
        fetchConversationHistory(documentId);
      }
    }
  }, [documentId, documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      const docs = Array.isArray(response.data) ? response.data : response.data.documents || [];
      setDocuments(docs);
      if (!documentId && docs.length > 0) {
        // Optionally auto‑select first completed doc – uncomment if desired
        // const first = docs.find(d => d.status === "completed") || docs[0];
        // if (first) navigate(`/chat/${first._id}`);
      }
    } catch (error) {
      handleError(error, "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationHistory = async (docId) => {
    try {
      const response = await api.get(`/chat/history?documentId=${docId}&limit=50`);
      const convs = response.data.conversations || [];
      if (convs.length > 0) setMessages(convs[0].messages || []);
      else setMessages([]);
    } catch (error) {
      console.error("History error:", error);
      setMessages([]);
    }
  };

  const toggleSelect = (docId) => {
    setSelectedIds(prev => {
      const exists = prev.includes(docId);
      if (exists) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
    setMessages([]); // clear conversation when selection changes
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (selectedIds.length === 0) {
      handleError(new Error("No document selected"), "Please select at least one document");
      return;
    }

    const targetDocs = documents.filter(d => selectedIds.includes(d._id));
    const allReady = targetDocs.every(d => d.status === "completed");
    if (!allReady) {
      handleError(new Error("Some documents are not ready"), "Please wait for all selected documents to finish processing");
      return;
    }

    const useMulti = targetDocs.length > 1;
    const docIds = targetDocs.map(d => d._id);

    const tempId = Date.now();
    const userMsg = { role: "user", content: trimmed, _temp: true, id: tempId };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    if (inputRef.current) inputRef.current.focus();

    try {
      let response;
      if (useMulti) {
        response = await api.post("/chat/multi", {
          question: trimmed,
          documentIds: docIds,
        });
      } else {
        response = await api.post("/chat", {
          question: trimmed,
          documentId: docIds[0],
        });
      }
      setMessages(prev => {
        const filtered = prev.filter(m => !(m._temp && m.id === tempId));
        return [
          ...filtered,
          { role: "user", content: trimmed },
          {
            role: "assistant",
            content: response.data.answer || "No response.",
            sources: response.data.sources || [],
          },
        ];
      });
      handleSuccess("Response received");
    } catch (error) {
      setMessages(prev => prev.filter(m => !(m._temp && m.id === tempId)));
      handleError(error, "Failed to get response");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setSelectedIds([]);
    setMessages([]);
    setInput("");
    navigate("/chat");
  };

  const clearAll = () => {
    setSelectedIds([]);
    setMessages([]);
  };

  if (loading) return <Loading fullPage />;

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">Your Documents</div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
            <button
              onClick={handleNewChat}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> New Chat
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
          {documents.map((doc) => {
            const isSelected = selectedIds.includes(doc._id);
            const isReady = doc.status === "completed";
            return (
              <div
                key={doc._id}
                onClick={() => isReady && toggleSelect(doc._id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dotted cursor-pointer transition-all
                  ${isReady ? "hover:shadow-md" : "opacity-50 cursor-not-allowed"}
                  ${isSelected 
                    ? "border-purple-500 bg-purple-50 shadow-sm" 
                    : "border-gray-300 bg-white hover:border-gray-400"}
                `}
                title={!isReady ? "Document still processing" : ""}
              >
                <FileText className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-purple-600" : "text-gray-400"}`} />
                <span className="text-sm font-medium truncate flex-1">
                  {doc.title || "Untitled"}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {doc.pageCount || 0}p
                </span>
                {isSelected && <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                {!isReady && <span className="text-xs text-gray-400 flex-shrink-0">⏳</span>}
              </div>
            );
          })}
          {documents.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-8">
              No documents uploaded yet.
              <button
                onClick={() => navigate("/documents")}
                className="block mx-auto mt-2 text-purple-600 hover:underline"
              >
                Upload a PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">💬</div>
              <div className="chat-welcome-title">
                {selectedIds.length === 0
                  ? "Select one or more documents from the sidebar"
                  : selectedIds.length === 1
                  ? `Chat with "${documents.find(d => d._id === selectedIds[0])?.title || "document"}"`
                  : `Chat with ${selectedIds.length} documents`}
              </div>
              <div className="chat-welcome-sub">
                {selectedIds.length === 0
                  ? "Choose documents to start asking questions"
                  : selectedIds.length === 1
                  ? "Ask anything about this PDF"
                  : "Your question will be answered using all selected documents"}
              </div>
              {selectedIds.length > 0 && (
                <div className="chat-suggestions">
                  <button className="chat-suggestion" onClick={() => setInput("Summarize this document")}>
                    📝 Summarize
                  </button>
                  <button className="chat-suggestion" onClick={() => setInput("What are the key concepts?")}>
                    🔑 Key concepts
                  </button>
                  <button className="chat-suggestion" onClick={() => setInput("What are the main findings?")}>
                    📊 Main findings
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      padding: "12px 18px",
                      borderRadius: "16px",
                      background: isUser ? "linear-gradient(135deg, #6c5ce7, #a29bfe)" : "white",
                      color: isUser ? "white" : "#1a1a2e",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: isUser ? "none" : "1px solid #eef0f3",
                      opacity: msg._temp ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{msg.content}</div>
                    {msg.sources?.length > 0 && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "#a0a7b5" }}>
                        📄 Sources: {msg.sources.map(s => `Page ${s.page}`).join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
              {sending && (
                <div style={{ alignSelf: "flex-start", padding: "12px 18px", background: "white", borderRadius: "16px", border: "1px solid #eef0f3" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ animation: "pulse 1.4s infinite", display: "inline-block" }}>●</span>
                    <span style={{ animation: "pulse 1.4s infinite 0.2s", display: "inline-block" }}>●</span>
                    <span style={{ animation: "pulse 1.4s infinite 0.4s", display: "inline-block" }}>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={
              selectedIds.length === 0
                ? "Select a document first..."
                : selectedIds.length === 1
                ? "Ask a question..."
                : `Ask a question about ${selectedIds.length} documents...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={selectedIds.length === 0 || sending}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || selectedIds.length === 0 || sending}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
