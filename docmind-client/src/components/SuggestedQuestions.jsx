import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lightbulb, Loader } from 'lucide-react';

const SuggestedQuestions = ({ documentId, onSelect }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (documentId) {
      generateQuestions();
    }
  }, [documentId]);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.post('/documents/suggest-questions', { documentId });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="h-5 w-5 text-primary-600 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Generating questions...</span>
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <Lightbulb className="h-4 w-4 text-yellow-600" />
        <p className="text-sm font-medium text-gray-700">Suggested Questions</p>
      </div>
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect && onSelect(q)}
            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
