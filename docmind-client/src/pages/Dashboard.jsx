import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileText, MessageSquare, BarChart3, Zap, Sparkles, ChevronRight } from 'lucide-react';
import Loading from '../components/Loading';

const Dashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      let docs = [];
      if (Array.isArray(response.data)) docs = response.data;
      else if (response.data.documents) docs = response.data.documents;
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullPage />;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatus = (status) => {
    switch (status) {
      case 'completed': return { label: 'Ready', class: 'ready' };
      case 'processing': return { label: 'Processing', class: 'processing' };
      default: return { label: 'Pending', class: '' };
    }
  };

  return (
    <div>
      {/* Quick Actions */}
      <div className="quick-actions">
        <QuickAction icon={<MessageSquare className="h-5 w-5 icon-purple" />} label="AI Chat" color="#6c5ce7" />
        <QuickAction icon={<BarChart3 className="h-5 w-5 icon-pink" />} label="Compare" color="#fd79a8" />
        <QuickAction icon={<Zap className="h-5 w-5 icon-orange" />} label="Quiz Generator" color="#fdcb6e" />
        <QuickAction icon={<Sparkles className="h-5 w-5 icon-green" />} label="Flashcards" color="#00b894" />
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Recent Documents */}
        <div>
          <div className="section-header">
            <h3 className="section-title">Recent Documents</h3>
            <span className="section-link" onClick={() => navigate('/documents')}>View All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #eef0f3' }}>
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p style={{ color: '#a0a7b5' }}>No documents yet</p>
                <button onClick={() => navigate('/documents')} className="btn-primary mt-3">
                  Upload First Document
                </button>
              </div>
            ) : (
              documents.slice(0, 5).map((doc) => {
                const status = getStatus(doc.status);
                return (
                  <div key={doc._id} className="doc-item" onClick={() => navigate(`/chat/${doc._id}`)}>
                    <div className="doc-item-icon">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="doc-item-info">
                      <div className="doc-item-title">{doc.title || 'Untitled'}</div>
                      <div className="doc-item-meta">
                        <span>PDF • {formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.pageCount || 0} pages</span>
                      </div>
                    </div>
                    <span className={`doc-item-status ${status.class}`}>{status.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Overview */}
        <div className="overview-card">
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Overview</h3>
          <div className="overview-stat">
            <div className="overview-stat-number">{documents.length}</div>
            <div className="overview-stat-label">Total Documents</div>
          </div>
          <div className="overview-stat" style={{ borderTop: '1px solid #eef0f3' }}>
            <div className="overview-stat-number" style={{ fontSize: '24px' }}>
              {documents.filter(d => d.status === 'completed').length}
            </div>
            <div className="overview-stat-label">Ready for Chat</div>
          </div>
          <div className="overview-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a0a7b5' }}>
              <span>Storage Usage</span>
              <span>{Math.min(100, Math.round((documents.length / 50) * 100))}%</span>
            </div>
            <div className="overview-progress-bar">
              <div 
                className="overview-progress-fill" 
                style={{ width: `${Math.min(100, Math.round((documents.length / 50) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Action Component
const QuickAction = ({ icon, label, color }) => (
  <button className="quick-action-btn">
    {icon}
    <span>{label}</span>
  </button>
);

export default Dashboard;
