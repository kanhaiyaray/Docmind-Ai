import React from 'react';
import { BarChart3 } from 'lucide-react';

const Compare = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">Document Comparison</h1>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-gray-500 text-lg">Compare two or more documents side‑by‑side.</p>
        <p className="text-gray-400 mt-2">This feature is coming soon.</p>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
          <span className="text-sm text-gray-500">📄 Upload multiple PDFs to compare content</span>
        </div>
      </div>
    </div>
  );
};

export default Compare;
