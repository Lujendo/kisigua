import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/Dashboard';
import SearchPage from './components/search/SearchPage';
import SubscriptionPage from './components/subscription/SubscriptionPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'app' | 'search' | 'subscription'>('landing');

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

  if (currentPage === 'auth') {
    return <AuthPage />;
  }

  if (currentPage === 'search') {
    return <SearchPage />;
  }

  if (currentPage === 'subscription') {
    return <SubscriptionPage />;
  }

  if (isAuthenticated && currentPage === 'app') {
    return <Dashboard
      onNavigateToSearch={() => setCurrentPage('search')}
      onNavigateToSubscription={() => setCurrentPage('subscription')}
    />;
  }

  return (
    <LandingPage
      onNavigateToAuth={() => setCurrentPage('auth')}
      onNavigateToApp={() => setCurrentPage('app')}
      onNavigateToSearch={() => setCurrentPage('search')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
