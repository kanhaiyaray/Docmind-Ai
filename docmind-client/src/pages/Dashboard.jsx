import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, <span className="font-semibold">{user?.name}</span>!
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
          <p className="text-gray-600 mt-2">Upload your documents to start chatting with them.</p>
          <button className="btn-primary mt-4">Upload</button>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Your Documents</h3>
          <p className="text-gray-600 mt-2">View and manage all your uploaded documents.</p>
          <button className="btn-secondary mt-4">View Documents</button>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
          <p className="text-gray-600 mt-2">Continue your conversations with documents.</p>
          <button className="btn-secondary mt-4">View Chats</button>
        </div>
      </div>
    </div>
  );
}
