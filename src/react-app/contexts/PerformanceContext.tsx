/**
 * Performance Context - Global performance optimization and loading state management
 * Provides centralized loading states, caching, and performance monitoring
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface PerformanceMetrics {
  loadTimes: { [key: string]: number };
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
}

interface PerformanceContextType {
  // Loading states
  isLoading: (key: string) => boolean;
  setLoading: (key: string, loading: boolean) => void;
  
  // Global cache
  getFromCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  clearCache: (key?: string) => void;
  
  // Performance tracking
  startTimer: (key: string) => void;
  endTimer: (key: string) => number;
  getMetrics: () => PerformanceMetrics;
  
  // Batch operations
  batchLoad: <T>(keys: string[], loader: (key: string) => Promise<T>) => Promise<{ [key: string]: T }>;
  
  // Preloading
  preload: (key: string, loader: () => Promise<any>) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const cacheRef = useRef(new Map<string, CacheEntry<any>>());
  const timersRef = useRef(new Map<string, number>());
  const metricsRef = useRef<PerformanceMetrics>({
    loadTimes: {},
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0
  });

  // Default cache TTL: 5 minutes
  const DEFAULT_TTL = 5 * 60 * 1000;

  // Loading state management
  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  // Cache management
  const getFromCache = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) {
      metricsRef.current.cacheMisses++;
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      metricsRef.current.cacheMisses++;
      return null;
    }

    metricsRef.current.cacheHits++;
    console.log(`🎯 Cache hit for: ${key}`);
    return entry.data;
  }, []);

  const setCache = useCallback(<T,>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
      console.log(`🗑️ Cleared cache for: ${key}`);
    } else {
      cacheRef.current.clear();
      console.log('🗑️ Cleared all cache');
    }
  }, []);

  // Performance timing
  const startTimer = useCallback((key: string) => {
    timersRef.current.set(key, performance.now());
  }, []);

  const endTimer = useCallback((key: string): number => {
    const startTime = timersRef.current.get(key);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    metricsRef.current.loadTimes[key] = duration;
    timersRef.current.delete(key);
    
    console.log(`⏱️ ${key}: ${duration.toFixed(0)}ms`);
    return duration;
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Batch loading for efficiency
  const batchLoad = useCallback(async <T,>(
    keys: string[], 
    loader: (key: string) => Promise<T>
  ): Promise<{ [key: string]: T }> => {
    const results: { [key: string]: T } = {};
    const promises = keys.map(async (key) => {
      try {
        setLoading(key, true);
        const result = await loader(key);
        results[key] = result;
        return result;
      } finally {
        setLoading(key, false);
      }
    });

    await Promise.all(promises);
    return results;
  }, [setLoading]);

  // Preloading for better UX
  const preload = useCallback((key: string, loader: () => Promise<any>) => {
    // Don't preload if already loading or cached
    if (isLoading(key) || getFromCache(key)) {
      return;
    }

    console.log(`🔄 Preloading: ${key}`);
    setLoading(key, true);
    
    loader()
      .then(data => {
        setCache(key, data);
        console.log(`✅ Preloaded: ${key}`);
      })
      .catch(error => {
        console.warn(`❌ Preload failed for ${key}:`, error);
      })
      .finally(() => {
        setLoading(key, false);
      });
  }, [isLoading, getFromCache, setLoading, setCache]);

  // Cleanup expired cache entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of cacheRef.current.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          cacheRef.current.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    }, 60000); // Clean every minute

    return () => clearInterval(cleanup);
  }, []);

  const value: PerformanceContextType = {
    isLoading,
    setLoading,
    getFromCache,
    setCache,
    clearCache,
    startTimer,
    endTimer,
    getMetrics,
    batchLoad,
    preload
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export default PerformanceProvider;
