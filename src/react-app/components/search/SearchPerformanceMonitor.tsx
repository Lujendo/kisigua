/**
 * Search Performance Monitor
 * Tracks and displays search performance metrics
 */

import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  searchTime: number;
  resultCount: number;
  cacheHit: boolean;
  query: string;
  timestamp: number;
}

interface SearchPerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showMetrics?: boolean;
  className?: string;
}

const SearchPerformanceMonitor: React.FC<SearchPerformanceMonitorProps> = ({
  onMetricsUpdate,
  showMetrics = false,
  className = ""
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [averageTime, setAverageTime] = useState(0);
  const [cacheHitRate, setCacheHitRate] = useState(0);

  // Calculate performance statistics
  useEffect(() => {
    if (metrics.length === 0) return;

    const recentMetrics = metrics.slice(-10); // Last 10 searches
    const avgTime = recentMetrics.reduce((sum, m) => sum + m.searchTime, 0) / recentMetrics.length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const hitRate = (cacheHits / recentMetrics.length) * 100;

    setAverageTime(avgTime);
    setCacheHitRate(hitRate);
  }, [metrics]);

  // Add new metrics
  const addMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics(prev => [...prev.slice(-19), newMetrics]); // Keep last 20
    if (onMetricsUpdate) {
      onMetricsUpdate(newMetrics);
    }
  };

  // Expose addMetrics function globally for search components to use
  useEffect(() => {
    (window as any).addSearchMetrics = addMetrics;
    return () => {
      delete (window as any).addSearchMetrics;
    };
  }, []);

  if (!showMetrics) return null;

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-700">Search Performance</h4>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${averageTime < 200 ? 'bg-green-500' : averageTime < 500 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-600">{averageTime.toFixed(0)}ms avg</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="font-medium text-gray-900">{metrics.length}</div>
          <div className="text-gray-500">Searches</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{cacheHitRate.toFixed(0)}%</div>
          <div className="text-gray-500">Cache Hit</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {metrics.length > 0 ? metrics[metrics.length - 1].resultCount : 0}
          </div>
          <div className="text-gray-500">Results</div>
        </div>
      </div>

      {/* Recent searches */}
      {metrics.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-gray-600 mb-1">Recent:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {metrics.slice(-3).reverse().map((metric) => (
              <div key={metric.timestamp} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1 mr-2">{metric.query}</span>
                <div className="flex items-center space-x-2">
                  {metric.cacheHit && <span className="text-green-600">💾</span>}
                  <span className={`${metric.searchTime < 200 ? 'text-green-600' : metric.searchTime < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metric.searchTime}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to track search performance
export const trackSearchPerformance = (
  query: string,
  startTime: number,
  resultCount: number,
  cacheHit: boolean = false
) => {
  const searchTime = Date.now() - startTime;
  const metrics: PerformanceMetrics = {
    searchTime,
    resultCount,
    cacheHit,
    query,
    timestamp: Date.now()
  };

  // Add to global metrics if monitor is active
  if ((window as any).addSearchMetrics) {
    (window as any).addSearchMetrics(metrics);
  }

  // Log performance warnings
  if (searchTime > 1000) {
    console.warn(`Slow search detected: ${query} took ${searchTime}ms`);
  }

  return metrics;
};

export default SearchPerformanceMonitor;
