import React, { useState } from 'react';
import api from '../services/api';
import { Sparkles, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DocumentSummary = ({ documentId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await api.post('/documents/summary', { documentId });
      setSummary(response.data.summary);
      setExpanded(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading) {
    return (
      <button
        onClick={generateSummary}
        className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Summary
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Document Summary</h4>
        </div>
        {loading ? (
          <Loader className="h-5 w-5 text-purple-600 animate-spin" />
        ) : (
          expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </div>
      
      {expanded && !loading && summary && (
        <div className="p-4 pt-0 border-t border-gray-100">
          <ReactMarkdown className="prose prose-sm max-w-none">
            {summary}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default DocumentSummary;
