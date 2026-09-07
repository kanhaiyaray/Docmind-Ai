import React from 'react';
import { History as HistoryIcon } from 'lucide-react';

const History = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <HistoryIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-gray-500 text-lg">View your past conversations and activities.</p>
        <p className="text-gray-400 mt-2">This feature is coming soon.</p>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
          <span className="text-sm text-gray-500">📋 Your chat history will appear here</span>
        </div>
      </div>
    </div>
  );
};

export default History;
