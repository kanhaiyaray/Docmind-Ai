import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, Upload, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    chats: 0,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      console.log('API Response:', response.data);
      
      // Check if response.data has documents property (array) or is directly an array
      let docs = [];
      if (Array.isArray(response.data)) {
        docs = response.data;
      } else if (response.data.documents && Array.isArray(response.data.documents)) {
        docs = response.data.documents;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        docs = response.data.data;
      } else {
        // If it's a single object, wrap in array
        docs = [response.data].filter(Boolean);
      }
      
      setDocuments(docs);
      
      const processed = docs.filter(doc => doc.status === 'completed').length;
      setStats({
        total: docs.length,
        processed: processed,
        chats: 0,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'processing': return 'Processing...';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  if (loading) return <Loading fullPage />;

  // Ensure documents is always an array
  const docs = Array.isArray(documents) ? documents : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Upload documents and start chatting with your AI assistant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chat Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.chats}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quick Upload</p>
              <p className="text-lg font-medium text-primary-600">Upload New</p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <Upload className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
          <button
            onClick={() => navigate('/documents')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No documents uploaded yet</p>
            <button
              onClick={() => navigate('/documents')}
              className="btn-primary mt-4 inline-flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.slice(0, 5).map((doc) => (
              <div
                key={doc._id || doc.id || Math.random().toString()}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/chat/${doc._id || doc.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-500">
                      {doc.pageCount || 0} pages • {Math.round((doc.fileSize || 0) / 1024)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {getStatusText(doc.status)}
                  </span>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;