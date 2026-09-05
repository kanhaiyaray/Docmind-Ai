import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

const SourceCitation = ({ sources, onPageClick }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Sources
      </p>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onPageClick && onPageClick(source.page)}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {source.document || 'Document'}
                </p>
                <p className="text-xs text-gray-500">
                  Page {source.page}
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceCitation;
