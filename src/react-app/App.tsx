import { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import GlobalLoadingIndicator from './components/common/GlobalLoadingIndicator';
import PageLoader from './components/common/PageLoader';

// CRITICAL: Keep these components loaded immediately (needed for initial render)
import LandingPage from './components/LandingPage';
import AuthPage from './components/auth/AuthPage';
import EmailVerification from './components/auth/EmailVerification';
import PasswordReset from './components/auth/PasswordReset';
import UserDropdown from './components/header/UserDropdown';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

// OPTIMIZED: Lazy load heavy components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const UserSettings = lazy(() => import('./components/settings/UserSettings'));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./components/legal/CookiePolicy'));
const DataProtection = lazy(() => import('./components/legal/DataProtection'));
const Imprint = lazy(() => import('./components/legal/Imprint'));
const SubscriptionPage = lazy(() => import('./components/subscription/SubscriptionPage'));
const AdvancedSearchPage = lazy(() => import('./components/search/AdvancedSearchPage'));
const MyListingsPage = lazy(() => import('./components/listings/MyListingsPage'));
const FavoritesPage = lazy(() => import('./components/favorites/FavoritesPage'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const ListingManagement = lazy(() => import('./components/admin/ListingManagement'));

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  type PageType = 'landing' | 'auth' | 'verify-email' | 'reset-password' | 'app' | 'search' | 'subscription' | 'dashboard' | 'listings' | 'favorites' | 'profile' | 'settings' | 'messages' | 'admin' | 'users' | 'admin-listings' | 'analytics' | 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'data-protection' | 'imprint';

  const [currentPage, setCurrentPage] = useState<PageType>('landing');

  // Navigation helper function for Footer
  const handlePageNavigation = (page: string) => {
    if (isValidPageType(page)) {
      setCurrentPage(page);
    }
  };

  const isValidPageType = (page: string): page is PageType => {
    const validPages: PageType[] = ['landing', 'auth', 'verify-email', 'reset-password', 'app', 'search', 'subscription', 'dashboard', 'listings', 'favorites', 'profile', 'settings', 'messages', 'admin', 'users', 'admin-listings', 'analytics', 'privacy-policy', 'terms-of-service', 'cookie-policy', 'data-protection', 'imprint'];
    return validPages.includes(page as PageType);
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-navigate after successful login
  useEffect(() => {
    if (isAuthenticated && currentPage === 'auth') {
      // Redirect all users to Dashboard after successful login
      setCurrentPage('dashboard');
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

  // Handle URL-based routing for email verification and password reset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    // Check for email verification
    if (pathname === '/verify-email' || urlParams.get('token')) {
      setCurrentPage('verify-email');
    }
    // Check for password reset
    else if (pathname === '/reset-password' || pathname === '/forgot-password') {
      setCurrentPage('reset-password');
    }
    // Check for other URL patterns
    else if (pathname === '/auth' || pathname === '/login' || pathname === '/register') {
      setCurrentPage('auth');
    }
    else if (pathname === '/dashboard') {
      setCurrentPage('dashboard');
    }
    else if (pathname === '/search') {
      setCurrentPage('search');
    }
    else if (pathname === '/subscription') {
      setCurrentPage('subscription');
    }
    else if (pathname === '/privacy-policy') {
      setCurrentPage('privacy-policy');
    }
    else if (pathname === '/terms-of-service') {
      setCurrentPage('terms-of-service');
    }
    else if (pathname === '/cookie-policy') {
      setCurrentPage('cookie-policy');
    }
    else if (pathname === '/data-protection') {
      setCurrentPage('data-protection');
    }
    else if (pathname === '/imprint') {
      setCurrentPage('imprint');
    }
  }, []);

  // Update URL when page changes (simple history management)
  useEffect(() => {
    const updateURL = () => {
      const newPath = (() => {
        switch (currentPage) {
          case 'verify-email': return '/verify-email';
          case 'reset-password': return '/reset-password';
          case 'auth': return '/auth';
          case 'dashboard': return '/dashboard';
          case 'search': return '/search';
          case 'subscription': return '/subscription';
          case 'admin': return '/admin';
          case 'privacy-policy': return '/privacy-policy';
          case 'terms-of-service': return '/terms-of-service';
          case 'cookie-policy': return '/cookie-policy';
          case 'data-protection': return '/data-protection';
          case 'imprint': return '/imprint';
          default: return '/';
        }
      })();

      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath + window.location.search);
      }
    };

    updateURL();
  }, [currentPage]);

  const handleNavigation = (page: string) => {
    setCurrentPage(page as 'dashboard' | 'search' | 'listings' | 'favorites' | 'subscription' | 'profile');
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
      return (
        <AuthPage
          onNavigateToPasswordReset={() => setCurrentPage('reset-password')}
          onNavigateToTerms={() => setCurrentPage('terms-of-service')}
          onNavigateToPrivacy={() => setCurrentPage('privacy-policy')}
        />
      );
    }
    if (currentPage === 'verify-email') {
      return (
        <EmailVerification
          onVerificationSuccess={() => {
            // After successful verification, redirect to login
            setCurrentPage('auth');
          }}
          onNavigateToLogin={() => setCurrentPage('auth')}
        />
      );
    }
    if (currentPage === 'reset-password') {
      return (
        <PasswordReset
          onNavigateToLogin={() => setCurrentPage('auth')}
        />
      );
    }
    // Legal pages (accessible without authentication)
    if (currentPage === 'privacy-policy') {
      return (
        <div className="min-h-screen flex flex-col">
          <PrivacyPolicy />
          <Footer onNavigateToPage={handlePageNavigation} />
        </div>
      );
    }
    if (currentPage === 'terms-of-service') {
      return (
        <div className="min-h-screen flex flex-col">
          <TermsOfService />
          <Footer onNavigateToPage={handlePageNavigation} />
        </div>
      );
    }
    if (currentPage === 'cookie-policy') {
      return (
        <div className="min-h-screen flex flex-col">
          <CookiePolicy />
          <Footer onNavigateToPage={handlePageNavigation} />
        </div>
      );
    }
    if (currentPage === 'data-protection') {
      return (
        <div className="min-h-screen flex flex-col">
          <DataProtection />
          <Footer onNavigateToPage={handlePageNavigation} />
        </div>
      );
    }
    if (currentPage === 'imprint') {
      return (
        <div className="min-h-screen flex flex-col">
          <Imprint />
          <Footer onNavigateToPage={handlePageNavigation} />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col">
        <LandingPage
          onNavigateToAuth={() => setCurrentPage('auth')}
          onNavigateToApp={() => setCurrentPage('app')}
          onNavigateToSearch={() => setCurrentPage('search')}
        />
        <Footer onNavigateToPage={handlePageNavigation} />
      </div>
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
                     currentPage === 'settings' ? 'Settings' :
                     currentPage === 'messages' ? 'Messages' :
                     currentPage === 'admin' ? 'Admin Panel' :
                     currentPage === 'users' ? 'User Management' :
                     currentPage === 'admin-listings' ? 'Listing Management' :
                     currentPage === 'analytics' ? 'Analytics' :
                     currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                  </h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.firstName}!</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <UserDropdown
                  onNavigateToProfile={() => setCurrentPage('profile')}
                  onNavigateToSearch={() => setCurrentPage('search')}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {currentPage === 'dashboard' && (
            <Suspense fallback={
              <PageLoader
                loadingKey="dashboard"
                showProgress={true}
                skeleton={
                  <div className="animate-pulse space-y-6 p-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
                      ))}
                    </div>
                  </div>
                }
              />
            }>
              <Dashboard
                onNavigateToSearch={() => setCurrentPage('search')}
                onNavigateToSubscription={() => setCurrentPage('subscription')}
                onNavigateToMyListings={() => setCurrentPage('listings')}
              />
            </Suspense>
          )}

          {currentPage === 'search' && (
            <Suspense fallback={<PageLoader loadingKey="search" showProgress={true} />}>
              <AdvancedSearchPage />
            </Suspense>
          )}

          {currentPage === 'listings' && (
            <Suspense fallback={<PageLoader loadingKey="listings" showProgress={true} />}>
              <MyListingsPage />
            </Suspense>
          )}

          {currentPage === 'favorites' && (
            <Suspense fallback={<PageLoader loadingKey="favorites" showProgress={true} />}>
              <FavoritesPage />
            </Suspense>
          )}

          {currentPage === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
              <p className="text-gray-600">Profile management coming soon...</p>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Suspense fallback={<PageLoader loadingKey="settings" />}>
                <UserSettings onClose={() => setCurrentPage('dashboard')} />
              </Suspense>
            </div>
          )}

          {currentPage === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
              <p className="text-gray-600">Messaging system coming soon...</p>
            </div>
          )}

          {currentPage === 'admin' && user?.role === 'admin' && (
            <AdminPanel />
          )}

          {currentPage === 'users' && user?.role === 'admin' && (
            <UserManagement />
          )}

          {currentPage === 'admin-listings' && user?.role === 'admin' && (
            <ListingManagement />
          )}

          {currentPage === 'analytics' && user?.role === 'admin' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          )}

          {currentPage === 'subscription' && (
            <Suspense fallback={<PageLoader loadingKey="subscription" showProgress={true} />}>
              <SubscriptionPage />
            </Suspense>
          )}
        </main>

        {/* Footer */}
        <Footer onNavigateToPage={handlePageNavigation} />
      </div>
    </div>
  );
}

function App() {
  return (
    <PerformanceProvider>
      <AuthProvider>
        <FavoritesProvider>
          <GlobalLoadingIndicator />
          <AppContent />
        </FavoritesProvider>
      </AuthProvider>
    </PerformanceProvider>
  );
}

export default App;
