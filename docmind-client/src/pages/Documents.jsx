import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DocumentUpload from '../components/DocumentUpload';
import Loading from '../components/Loading';
import { FileText, Trash2, MessageSquare, Search, X, Plus } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      console.log('Documents API Response:', response.data);
      
      // Handle different response formats
      let docs = [];
      if (Array.isArray(response.data)) {
        docs = response.data;
      } else if (response.data.documents && Array.isArray(response.data.documents)) {
        docs = response.data.documents;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        docs = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's a single object, wrap in array
        docs = [response.data].filter(Boolean);
      }
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      completed: 'bg-green-100 text-green-700',
      processing: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    const labels = {
      completed: 'Ready',
      processing: 'Processing',
      failed: 'Failed',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status || 'Unknown'}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Ensure documents is always an array
  const docs = Array.isArray(documents) ? documents : [];

  // Filter documents by search term
  const filteredDocuments = docs.filter(doc => {
    if (!searchTerm) return true;
    const title = doc.title || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <Loading fullPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">
            {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary inline-flex items-center"
        >
          {showUpload ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Close Upload
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="card mb-8">
          <DocumentUpload onUploadSuccess={fetchDocuments} />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary mt-4 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc._id || doc.id || Math.random().toString()} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="bg-primary-100 rounded-lg p-2 flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {doc.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {doc.pageCount || 0} pages • {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex space-x-2">
                  {doc.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/chat/${doc._id || doc.id}`)}
                      className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors inline-flex items-center"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chat
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc._id || doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(doc.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button at Bottom (if no upload section is shown) */}
      {!showUpload && docs.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowUpload(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Upload another document
          </button>
        </div>
      )}
    </div>
  );
};

export default Documents;