import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'user' | 'premium' | 'supporter';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  requiresEmailVerification: boolean;
  userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage on mount
  useEffect(() => {
    console.log('🔄 AuthContext: Initializing authentication state');
    const savedToken = localStorage.getItem('kisigua_token');

    if (savedToken) {
      console.log('✅ AuthContext: Found saved token, verifying...');
      setToken(savedToken);
      // Verify token and get user info
      verifyToken(savedToken);
    } else {
      console.log('❌ AuthContext: No saved token found');
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      console.log('🔍 AuthContext: Verifying token with backend...');
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 AuthContext: Token verification response status:', response.status);
      const data = await response.json();
      console.log('🔍 AuthContext: Token verification response:', {
        success: data.success,
        hasUser: !!data.user,
        message: data.message
      });

      if (response.ok && data.success) {
        console.log('✅ AuthContext: Token verification successful, user authenticated');
        setUser(data.user);
        setToken(tokenToVerify);
      } else {
        console.log('❌ AuthContext: Token verification failed:', data.message);
        console.log('🗑️ AuthContext: Removing invalid token from localStorage');
        // Token is invalid or expired, remove it
        localStorage.removeItem('kisigua_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Token verification network error:', error);
      console.log('🗑️ AuthContext: Removing token due to network error');
      localStorage.removeItem('kisigua_token');
      setToken(null);
      setUser(null);
    } finally {
      console.log('🏁 AuthContext: Token verification complete, setting loading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { success: data.success, hasToken: !!data.token, hasUser: !!data.user });

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('kisigua_token', data.token);
        setRequiresEmailVerification(false);
        setUserEmail(null);
        console.log('Login successful, token stored');
      } else if (data.requiresEmailVerification) {
        console.log('📧 Email verification required debug:');
        console.log('  - dataEmail:', data.email);
        console.log('  - loginEmail:', email);
        console.log('  - finalEmail:', data.email || email);
        console.log('  - fullResponse:', data);

        setRequiresEmailVerification(true);
        setUserEmail(data.email || email);
        setError(data.message || 'Please verify your email address before logging in.');
      } else {
        console.log('Login failed:', data.message);
        setRequiresEmailVerification(false);
        setUserEmail(null);
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresEmailVerification) {
          // Registration successful but needs email verification
          setRequiresEmailVerification(true);
          setUserEmail(email);
          setError(null);
          // Show success message instead of error
          console.log('Registration successful, email verification required');
        } else if (data.token && data.user) {
          // Registration successful and user is logged in
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('kisigua_token', data.token);
          setRequiresEmailVerification(false);
          setUserEmail(null);
        }
      } else {
        setRequiresEmailVerification(false);
        setUserEmail(null);
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('kisigua_token');
    setError(null);
    setRequiresEmailVerification(false);
    setUserEmail(null);

    // Clear any other stored data
    localStorage.removeItem('kisigua_favorites');

    console.log('Logout complete');
  };

  const clearError = () => {
    setError(null);
    setRequiresEmailVerification(false);
    setUserEmail(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
    clearError,
    requiresEmailVerification,
    userEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
