/**
 * Page Loader - Optimized page-level loading with skeleton screens and progressive enhancement
 * Provides instant visual feedback while content loads in background
 */

import React, { useState, useEffect } from 'react';
import { usePerformance } from '../../contexts/PerformanceContext';

interface PageLoaderProps {
  children?: React.ReactNode;
  loadingKey: string;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  minLoadTime?: number; // Minimum loading time to prevent flashing
  showProgress?: boolean;
}

const DefaultSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
      ))}
    </div>
  </div>
);

const PageLoader: React.FC<PageLoaderProps> = ({
  children,
  loadingKey,
  fallback,
  skeleton,
  minLoadTime = 200,
  showProgress = false
}) => {
  const { isLoading, startTimer, endTimer } = usePerformance();
  const [showContent, setShowContent] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  const loading = isLoading(loadingKey);

  useEffect(() => {
    if (loading && !loadStartTime) {
      setLoadStartTime(Date.now());
      startTimer(`page-${loadingKey}`);
    } else if (!loading && loadStartTime) {
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setShowContent(true);
        endTimer(`page-${loadingKey}`);
        setLoadStartTime(null);
      }, remainingTime);
    }
  }, [loading, loadStartTime, minLoadTime, loadingKey, startTimer, endTimer]);

  // Reset when loading key changes
  useEffect(() => {
    setShowContent(!loading);
    setLoadStartTime(null);
  }, [loadingKey]);

  if (loading || !showContent) {
    return (
      <div className="min-h-screen">
        {showProgress && (
          <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
          </div>
        )}
        
        {skeleton || fallback || <DefaultSkeleton />}
      </div>
    );
  }

  return <>{children || null}</>;
};

export default PageLoader;
