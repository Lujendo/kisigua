import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';

const AdminPanel = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'categories' | 'listings' | 'analytics'>('dashboard');
  const { user } = useAuth();

  // Check if user is admin or in test mode
  const isTestMode = (window as any).__testAdminMode;
  if (user?.role !== 'admin' && !isTestMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this panel.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">For Testing:</h3>
            <p className="text-sm text-blue-700 mb-2">Login with admin account:</p>
            <div className="bg-white rounded border px-3 py-2 text-sm font-mono">
              admin@kisigua.com
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Current user: {user?.email || 'Not logged in'} (Role: {user?.role || 'none'})
            </p>
          </div>

          {/* Temporary testing bypass */}
          <button
            onClick={() => {
              // Temporarily allow access for testing
              if (confirm('Enable admin panel for testing? (This is temporary)')) {
                // This is a hack for testing - in production, proper authentication should be used
                (window as any).__testAdminMode = true;
                window.location.reload();
              }
            }}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            🧪 Enable Test Mode
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'listings':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Listings Management</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </AdminLayout>
  );
};

export default AdminPanel;
