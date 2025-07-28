import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './admin/AdminPanel';
import Sidebar from './Sidebar';

interface DashboardProps {
  onNavigateToSearch: () => void;
  onNavigateToSubscription: () => void;
  onNavigateToLanding: () => void;
}

const Dashboard = ({ onNavigateToSearch, onNavigateToSubscription, onNavigateToLanding }: DashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return null;
  }

  const getRolePermissions = () => {
    switch (user.role) {
      case 'admin':
        return {
          canCreateListings: true,
          canEditAllListings: true,
          canAccessAdminDashboard: true,
          canManageUsers: true,
          maxListingsPerMonth: 'Unlimited',
        };
      case 'premium':
        return {
          canCreateListings: true,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 50,
        };
      case 'supporter':
        return {
          canCreateListings: true,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 10,
        };
      default:
        return {
          canCreateListings: false,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 0,
        };
    }
  };

  const permissions = getRolePermissions();

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
    
    switch (page) {
      case 'search':
        onNavigateToSearch();
        break;
      case 'subscription':
        onNavigateToSubscription();
        break;
      case 'landing':
        onNavigateToLanding();
        break;
      case 'admin':
        setActiveTab('admin');
        break;
      default:
        setActiveTab('dashboard');
        break;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {/* Mobile menu button */}
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Desktop menu button */}
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {currentPage === 'dashboard' ? 'Dashboard' : 
                     currentPage === 'admin' ? 'Admin Panel' :
                     currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                  </h1>
                  <p className="text-sm text-gray-500">Welcome back, {user.firstName}!</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role} Account</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {/* Navigation Tabs for Admin */}
          {permissions.canAccessAdminDashboard && currentPage === 'dashboard' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'dashboard'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'admin'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Admin Panel
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Content based on current page */}
          {currentPage === 'dashboard' && (
            <>
              {activeTab === 'admin' && permissions.canAccessAdminDashboard ? (
                <AdminPanel />
              ) : (
                <div className="space-y-6">
                  {/* Welcome Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome to your {user.role} dashboard
                    </h2>
                    <p className="text-gray-600">
                      Manage your listings, discover local resources, and connect with your community.
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                      onClick={onNavigateToSearch}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">Search Resources</h3>
                          <p className="text-sm text-gray-600">Find local resources and services</p>
                        </div>
                      </div>
                    </div>

                    {permissions.canCreateListings && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Create Listing</h3>
                            <p className="text-sm text-gray-600">Share resources with your community</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                      onClick={onNavigateToSubscription}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">Upgrade Plan</h3>
                          <p className="text-sm text-gray-600">Get more features and benefits</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${permissions.canCreateListings ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm">Create listings ({permissions.maxListingsPerMonth} per month)</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${permissions.canAccessAdminDashboard ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm">Admin dashboard</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${permissions.canManageUsers ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm">Manage users</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other pages */}
          {currentPage === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
              <p className="text-gray-600">Profile management coming soon...</p>
            </div>
          )}

          {currentPage === 'listings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Listings</h2>
              <p className="text-gray-600">Listings management coming soon...</p>
            </div>
          )}

          {currentPage === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
              <p className="text-gray-600">Messaging system coming soon...</p>
            </div>
          )}

          {currentPage === 'users' && permissions.canManageUsers && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600">User management coming soon...</p>
            </div>
          )}

          {currentPage === 'analytics' && permissions.canAccessAdminDashboard && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
