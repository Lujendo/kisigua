/**
 * Global Loading Indicator - Shows loading states across the application
 * Provides consistent loading feedback and prevents multiple simultaneous loads
 */

import React from 'react';
import { usePerformance } from '../../contexts/PerformanceContext';

interface GlobalLoadingIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({
  className = "",
  showDetails = false
}) => {
  const { getMetrics } = usePerformance();
  const metrics = getMetrics();

  // Check if any loading is happening
  const hasActiveLoading = Object.values(metrics.loadTimes).some(time => time === 0);

  if (!hasActiveLoading && !showDetails) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Loading Bar */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
      
      {/* Loading Details (if enabled) */}
      {showDetails && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
                <span>Loading...</span>
              </div>
              
              <div className="text-xs text-gray-500">
                Cache: {metrics.cacheHits}H/{metrics.cacheMisses}M 
                ({metrics.cacheHits + metrics.cacheMisses > 0 
                  ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
                  : 0}% hit rate)
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              API calls: {metrics.apiCalls}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalLoadingIndicator;
