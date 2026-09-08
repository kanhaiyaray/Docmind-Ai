import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, Trash2, Search, CheckSquare, Square } from 'lucide-react';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const { handleError, handleSuccess } = useErrorHandler();
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => { fetchDocuments(); }, [page, search]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/documents', { params: { page, limit: 20, search } });
      setDocuments(res.data.documents);
      setTotalPages(res.data.pagination.pages);
      setSelectedDocs([]);
      setSelectAll(false);
    } catch (err) {
      handleError(err, 'Failed to load documents');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      handleSuccess('Document deleted');
      fetchDocuments();
    } catch (err) {
      handleError(err, 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    if (!window.confirm(`Delete ${selectedDocs.length} document(s)? This action is irreversible.`)) return;
    try {
      await api.delete('/admin/documents', { data: { documentIds: selectedDocs } });
      handleSuccess(`${selectedDocs.length} documents deleted`);
      fetchDocuments();
    } catch (err) {
      handleError(err, 'Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d._id));
    }
    setSelectAll(!selectAll);
  };

  const getStatusBadge = (status) => {
    const colors = { completed: 'bg-green-100 text-green-700', processing: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status || 'pending'}</span>;
  };

  if (loading && documents.length === 0) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Documents</h1>
        {selectedDocs.length > 0 && (
          <button onClick={handleBulkDelete} className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2">
            <Trash2 size={16} /> Delete Selected ({selectedDocs.length})
          </button>
        )}
      </div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-custom pl-10" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={toggleSelectAll} className="flex items-center gap-1">
                  {selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <tr key={doc._id}>
                <td className="px-6 py-4">
                  <button onClick={() => toggleSelect(doc._id)} className="flex items-center">
                    {selectedDocs.includes(doc._id) ? <CheckSquare size={16} className="text-purple-600" /> : <Square size={16} className="text-gray-400" />}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{doc.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{doc.userId?.email || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{doc.pageCount || 0}</td>
                <td className="px-6 py-4 text-sm">{getStatusBadge(doc.status)}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => handleDelete(doc._id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;