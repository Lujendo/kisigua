import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/Dashboard';

import SubscriptionPage from './components/subscription/SubscriptionPage';
import Sidebar from './components/Sidebar';
import EnhancedSearchPage from './components/search/EnhancedSearchPage';
import MyListingsPage from './components/listings/MyListingsPage';
import FavoritesPage from './components/favorites/FavoritesPage';
import AdminPanel from './components/admin/AdminPanel';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'app' | 'search' | 'subscription' | 'dashboard' | 'listings' | 'favorites' | 'profile' | 'messages' | 'admin' | 'users' | 'analytics'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-navigate after successful login
  useEffect(() => {
    if (isAuthenticated && currentPage === 'auth') {
      // Set default page based on user role
      if (user?.role === 'user') {
        setCurrentPage('search');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, currentPage, user]);

  // Handle window resize to keep sidebar open on desktop
  useEffect(() => {
    const handleResize = () => {
      // If window is resized to desktop size and sidebar is closed, open it
      if (window.innerWidth >= 1024 && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Ensure sidebar is open when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setSidebarOpen(true);
    }
  }, [isAuthenticated]);

  const handleNavigation = (page: string) => {
    setCurrentPage(page as any);
    // Only close sidebar on mobile devices after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated pages (no sidebar)
  if (!isAuthenticated) {
    if (currentPage === 'auth') {
      return <AuthPage />;
    }
    return (
      <LandingPage
        onNavigateToAuth={() => setCurrentPage('auth')}
        onNavigateToApp={() => setCurrentPage('app')}
        onNavigateToSearch={() => setCurrentPage('search')}
      />
    );
  }

  // Authenticated pages with global sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Main Content with sidebar offset */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        {/* Global Header */}
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
                     currentPage === 'search' ? 'Search Resources' :
                     currentPage === 'listings' ? 'My Listings' :
                     currentPage === 'favorites' ? 'My Favorites' :
                     currentPage === 'profile' ? 'My Profile' :
                     currentPage === 'messages' ? 'Messages' :
                     currentPage === 'admin' ? 'Admin Panel' :
                     currentPage === 'users' ? 'User Management' :
                     currentPage === 'analytics' ? 'Analytics' :
                     currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                  </h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.firstName}!</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role} Account</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigateToSearch={() => setCurrentPage('search')}
              onNavigateToSubscription={() => setCurrentPage('subscription')}
            />
          )}

          {currentPage === 'search' && <EnhancedSearchPage />}

          {currentPage === 'listings' && <MyListingsPage />}

          {currentPage === 'favorites' && <FavoritesPage />}

          {currentPage === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
              <p className="text-gray-600">Profile management coming soon...</p>
            </div>
          )}

          {currentPage === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
              <p className="text-gray-600">Messaging system coming soon...</p>
            </div>
          )}

          {(currentPage === 'admin' || currentPage === 'users' || currentPage === 'analytics') && user?.role === 'admin' && (
            <AdminPanel
              initialPage={
                currentPage === 'users' ? 'users' :
                currentPage === 'analytics' ? 'analytics' :
                'dashboard'
              }
            />
          )}

          {currentPage === 'subscription' && <SubscriptionPage />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
