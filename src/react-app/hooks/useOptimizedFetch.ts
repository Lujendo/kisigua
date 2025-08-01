/**
 * Optimized Fetch Hook - High-performance data fetching with caching and deduplication
 * Prevents duplicate requests, provides instant cache responses, and optimizes loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformance } from '../contexts/PerformanceContext';
import { useAuth } from '../contexts/AuthContext';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number;
  immediate?: boolean;
  dependencies?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: number | null;
}

// Global request deduplication
const activeRequests = new Map<string, Promise<any>>();

export function useOptimizedFetch<T = any>(
  url: string | null,
  options: FetchOptions = {}
) {
  const {
    method = 'GET',
    body,
    headers = {},
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    immediate = true,
    dependencies = [],
    onSuccess,
    onError
  } = options;

  const { token } = useAuth();
  const {
    getFromCache,
    setCache,
    setLoading,
    startTimer,
    endTimer
  } = usePerformance();

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key
  const getCacheKey = useCallback(() => {
    if (!url) return null;
    const bodyStr = body ? JSON.stringify(body) : '';
    return `fetch:${method}:${url}:${bodyStr}`;
  }, [url, method, body]);

  // Optimized fetch function
  const fetchData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    if (!url) return null;

    const cacheKey = getCacheKey();
    if (!cacheKey) return null;

    // Check cache first (unless force refresh)
    if (!forceRefresh && cache) {
      const cachedData = getFromCache<T>(cacheKey);
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }));
        return cachedData;
      }
    }

    // Check for active request (deduplication)
    if (activeRequests.has(cacheKey)) {
      console.log(`🔄 Deduplicating request: ${url}`);
      try {
        const result = await activeRequests.get(cacheKey);
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }));
        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
          lastFetch: Date.now()
        }));
        return null;
      }
    }

    // Start loading
    setLoading(cacheKey, true);
    setState(prev => ({ ...prev, loading: true, error: null }));
    startTimer(cacheKey);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create request promise
    const requestPromise = (async () => {
      try {
        const requestHeaders = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...headers
        };

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: abortControllerRef.current?.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Cache successful result
        if (cache) {
          setCache(cacheKey, result, cacheTTL);
        }

        // Update state
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }));

        // Success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`🚫 Request aborted: ${url}`);
          return null;
        }

        const fetchError = error instanceof Error ? error : new Error('Fetch failed');
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: fetchError,
          lastFetch: Date.now()
        }));

        // Error callback
        if (onError) {
          onError(fetchError);
        }

        throw fetchError;
      } finally {
        setLoading(cacheKey, false);
        endTimer(cacheKey);
        activeRequests.delete(cacheKey);
      }
    })();

    // Store active request for deduplication
    activeRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }, [
    url, method, body, headers, cache, cacheTTL, token,
    getCacheKey, getFromCache, setCache, setLoading, 
    startTimer, endTimer, onSuccess, onError
  ]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Mutate function for optimistic updates
  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof newData === 'function' 
        ? (newData as (prev: T | null) => T)(prev.data)
        : newData,
      lastFetch: Date.now()
    }));

    // Update cache
    const cacheKey = getCacheKey();
    if (cacheKey && cache) {
      const finalData = typeof newData === 'function' 
        ? (newData as (prev: T | null) => T)(state.data)
        : newData;
      setCache(cacheKey, finalData, cacheTTL);
    }
  }, [getCacheKey, cache, cacheTTL, setCache, state.data]);

  // Effect for immediate fetch and dependency changes
  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }
  }, [immediate, url, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastFetch: state.lastFetch,
    fetch: fetchData,
    refresh,
    mutate
  };
}

export default useOptimizedFetch;
