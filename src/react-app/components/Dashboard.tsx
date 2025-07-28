import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './admin/AdminPanel';

interface DashboardProps {
  onNavigateToSearch: () => void;
  onNavigateToSubscription: () => void;
}

const Dashboard = ({ onNavigateToSearch, onNavigateToSubscription }: DashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

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

  return (
    <div className="space-y-6">
      {/* Navigation Tabs for Admin */}
      {permissions.canAccessAdminDashboard && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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

      {/* Content based on active tab */}
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
    </div>
  );
};

export default Dashboard;
