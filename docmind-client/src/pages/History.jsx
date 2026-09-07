import React, { useState, useEffect } from "react";
import api from "../services/api";
import { History as HistoryIcon, MessageSquare, FileText, Loader, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const History = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/chat/history?limit=100");
      setConversations(res.data.conversations || []);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/chat/${id}`);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <HistoryIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No conversations yet.</p>
          <Link to="/chat" className="btn-primary mt-4 inline-block">
            Start a chat
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className="glass-card p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <Link
                    to={`/chat/${conv.documentId?._id || conv.documentId}`}
                    className="font-medium text-gray-900 hover:text-purple-700"
                  >
                    {conv.title || "Untitled"}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>
                      <FileText className="h-3 w-3 inline mr-1" />
                      {conv.documentId?.title || "Document"}
                    </span>
                    <span>{conv.messages?.length || 0} messages</span>
                    <span>{formatDate(conv.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteConversation(conv._id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
