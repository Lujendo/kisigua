import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../react-app/contexts/AuthContext';
import { User, UserRole } from '../worker/types/auth';

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: 'admin-001',
    email: 'admin@test.com',
    role: 'admin' as UserRole,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  },
  premium: {
    id: 'premium-001',
    email: 'premium@test.com',
    role: 'premium' as UserRole,
    firstName: 'Premium',
    lastName: 'User',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  },
  supporter: {
    id: 'supporter-001',
    email: 'supporter@test.com',
    role: 'supporter' as UserRole,
    firstName: 'Supporter',
    lastName: 'User',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  },
  user: {
    id: 'user-001',
    email: 'user@test.com',
    role: 'user' as UserRole,
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  }
};

// Mock authentication context
export const createMockAuthContext = (user?: User, token?: string) => ({
  user: user || null,
  token: token || null,
  isLoading: false,
  isAuthenticated: !!(user && token),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  error: null,
  clearError: vi.fn()
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User;
  token?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { user, token, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(),
    statusText: status === 200 ? 'OK' : 'Error'
  });
};

// Mock API responses
export const mockApiResponses = {
  login: {
    success: {
      success: true,
      token: 'mock-jwt-token',
      user: mockUsers.user
    },
    failure: {
      success: false,
      message: 'Invalid credentials'
    }
  },
  register: {
    success: {
      success: true,
      token: 'mock-jwt-token',
      user: mockUsers.user
    },
    failure: {
      success: false,
      message: 'Email already exists'
    }
  },
  listings: {
    search: {
      listings: [
        {
          id: 'listing-001',
          title: 'Test Organic Farm',
          description: 'A test organic farm',
          category: 'organic_farm',
          status: 'active',
          location: {
            latitude: 52.5200,
            longitude: 13.4050,
            address: 'Test Street 123',
            city: 'Berlin',
            country: 'Germany'
          },
          contactInfo: {
            email: 'farm@test.com'
          },
          images: [],
          tags: ['organic', 'vegetables'],
          isOrganic: true,
          isCertified: true,
          userId: 'user-001',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          views: 100,
          favorites: 10
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      filters: {}
    }
  },
  subscriptions: {
    plans: {
      plans: [
        {
          id: 'free',
          name: 'Free',
          tier: 'free',
          price: 0,
          currency: 'eur',
          interval: 'month',
          features: ['Up to 5 listings per month'],
          maxListings: 5,
          priority: 1
        },
        {
          id: 'premium',
          name: 'Premium',
          tier: 'premium',
          price: 1999,
          currency: 'eur',
          interval: 'month',
          features: ['Up to 50 listings per month', 'Featured listings'],
          maxListings: 50,
          priority: 3
        }
      ]
    },
    current: {
      subscription: null,
      plan: {
        id: 'free',
        name: 'Free',
        tier: 'free',
        price: 0,
        currency: 'eur',
        interval: 'month',
        features: ['Up to 5 listings per month'],
        maxListings: 5,
        priority: 1
      }
    }
  }
};

// Test data generators
export const createMockListing = (overrides = {}) => ({
  id: 'listing-' + Math.random().toString(36).substring(2),
  title: 'Test Listing',
  description: 'A test listing',
  category: 'organic_farm',
  status: 'active',
  location: {
    latitude: 52.5200,
    longitude: 13.4050,
    address: 'Test Street 123',
    city: 'Berlin',
    country: 'Germany'
  },
  contactInfo: {
    email: 'test@example.com'
  },
  images: [],
  tags: ['test'],
  isOrganic: true,
  isCertified: false,
  userId: 'user-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  views: 0,
  favorites: 0,
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substring(2),
  email: 'test@example.com',
  role: 'user' as UserRole,
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  ...overrides
});

// Wait utilities for async testing
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Form testing utilities
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value } });
    }
  });
};

// Local storage testing utilities
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
};

// Error boundary for testing error states
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong.</div>;
    }

    return this.props.children;
  }
}
