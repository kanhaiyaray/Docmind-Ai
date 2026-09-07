import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { BarChart3, Loader, FileText, Check, X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const Compare = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [fetchingDocs, setFetchingDocs] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setFetchingDocs(true);
      const res = await api.get("/documents?status=completed");
      const docs = res.data.documents || [];
      setDocuments(docs);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setFetchingDocs(false);
    }
  };

  const toggleSelect = (docId) => {
    setSelected((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : prev.length < 3
        ? [...prev, docId]
        : prev
    );
    setComparison(null);
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      toast.error("Select at least 2 documents to compare");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/compare", { documentIds: selected });
      setComparison(res.data.comparison);
      toast.success("Comparison ready");
    } catch (err) {
      toast.error(err.response?.data?.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const getDocTitle = (id) =>
    documents.find((d) => d._id === id)?.title || "Untitled";

  if (fetchingDocs)
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Document Comparison
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Document selection */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Select Documents</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose 2–3 completed documents to compare.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-gray-400">No completed documents yet.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => toggleSelect(doc._id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    selected.includes(doc._id)
                      ? "bg-purple-50 border border-purple-300"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{doc.title}</span>
                    <span className="text-xs text-gray-400">
                      {doc.pageCount} pages
                    </span>
                  </div>
                  {selected.includes(doc._id) ? (
                    <Check className="h-5 w-5 text-purple-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleCompare}
            disabled={selected.length < 2 || loading}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>

        {/* Comparison result */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Comparison Result</h2>
          {!comparison ? (
            <div className="text-center text-gray-400 py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select documents and click "Compare"</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-purple-700">
                  Comparing: {selected.map(getDocTitle).join(" vs ")}
                </p>
              </div>
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: comparison }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compare;
