import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-key',
    STRIPE_SECRET_KEY: 'sk_test_mock_key'
  }
}));

// Mock Cloudflare Workers APIs
global.fetch = vi.fn();

// Mock D1 Database
const mockD1 = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(),
      all: vi.fn(() => ({ results: [] })),
      run: vi.fn(() => ({ success: true, meta: { changes: 1 } }))
    })),
    first: vi.fn(),
    all: vi.fn(() => ({ results: [] })),
    run: vi.fn(() => ({ success: true, meta: { changes: 1 } }))
  })),
  exec: vi.fn(),
  dump: vi.fn(),
  batch: vi.fn()
};

// Mock R2 Bucket
const mockR2 = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  head: vi.fn(),
  list: vi.fn(() => ({ objects: [], truncated: false }))
};

// Mock Analytics Engine
const mockAnalytics = {
  writeDataPoint: vi.fn()
};

// Mock KV Namespace
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn()
};

// Global mocks for Cloudflare Workers environment
global.DB = mockD1;
global.FILES = mockR2;
global.ANALYTICS = mockAnalytics;
global.CACHE = mockKV;

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2),
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn()
    }
  }
});

// Mock Request and Response for Workers
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  body: any;

  constructor(url: string, init?: any) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }

  text() {
    return Promise.resolve(this.body || '');
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
} as any;

global.Response = class MockResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  body: any;

  constructor(body?: any, init?: any) {
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = body;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }

  text() {
    return Promise.resolve(this.body || '');
  }

  ok() {
    return this.status >= 200 && this.status < 300;
  }
} as any;

// Mock localStorage for browser tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
