/**
 * Search Integration Demo
 * Comprehensive demo of optimized search with location + listings integration
 */

import React, { useState } from 'react';
import OptimizedSearchBar from './OptimizedSearchBar';
import SearchPerformanceMonitor from './SearchPerformanceMonitor';
import LocationMapIntegration from '../LocationMapIntegration';
import { LocationSearchResult } from '../../types/location';

interface SearchResult {
  listings: any[];
  total: number;
  page: number;
  totalPages: number;
}

const SearchIntegrationDemo: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);

  // Handle integrated search (query + location)
  const handleSearch = async (query: string, location?: LocationSearchResult) => {
    console.log('🔍 Integrated Search:', { query, location });
    
    setIsLoading(true);
    setSearchQuery(query);
    
    try {
      const searchPayload: any = {
        query: query.trim() || undefined,
        page: 1,
        limit: 20
      };

      // Add location-based search if location is provided
      if (location) {
        searchPayload.locationQuery = location.name;
        searchPayload.country = location.hierarchy.countryCode;
        searchPayload.radius = 25;
      }

      const response = await fetch('/api/listings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        console.log(`✅ Found ${data.total} listings`);
      } else {
        console.error('Search failed');
        setSearchResults({ listings: [], total: 0, page: 1, totalPages: 0 });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ listings: [], total: 0, page: 1, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location selection from search bar
  const handleLocationSelect = (location: LocationSearchResult) => {
    console.log('📍 Location selected:', location);
    setSelectedLocation(location);
  };

  // Clear search results
  const clearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
    setSelectedLocation(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🚀 Optimized Search Integration Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience lightning-fast search across <strong>131K+ postal codes</strong> and listings 
          with intelligent location integration, performance monitoring, and smooth results.
        </p>
      </div>

      {/* Performance Toggle */}
      <div className="flex justify-center">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showPerformanceMetrics}
            onChange={(e) => setShowPerformanceMetrics(e.target.checked)}
            className="rounded"
          />
          <span>Show Performance Metrics</span>
        </label>
      </div>

      {/* Optimized Search Bar */}
      <div className="max-w-2xl mx-auto">
        <OptimizedSearchBar
          placeholder="Search listings, locations, or categories..."
          onSearch={handleSearch}
          onLocationSelect={handleLocationSelect}
          showLocationSuggestions={true}
          showListingSuggestions={true}
          countries={['DE', 'IT', 'ES', 'FR']}
          className="w-full"
        />
      </div>

      {/* Performance Monitor */}
      {showPerformanceMetrics && (
        <div className="max-w-md mx-auto">
          <SearchPerformanceMonitor
            showMetrics={true}
            className="w-full"
          />
        </div>
      )}

      {/* Search Results */}
      {(isLoading || searchResults) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results
              {searchQuery && ` for "${searchQuery}"`}
              {selectedLocation && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  near {selectedLocation.name}
                </span>
              )}
            </h2>
            <button
              onClick={clearSearch}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : searchResults ? (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Found <strong>{searchResults.total}</strong> result{searchResults.total !== 1 ? 's' : ''}
                {selectedLocation && (
                  <span> within 25km of <strong>{selectedLocation.name}</strong></span>
                )}
              </div>

              {searchResults.listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                          {listing.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>📍 {listing.location?.city || 'Unknown'}</span>
                        <span>👁️ {listing.views || 0} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No listings found matching your search.</p>
                  <p className="text-sm mt-1">Try different keywords or expand your location.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Location Map Integration */}
      {selectedLocation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📍 Location: {selectedLocation.name}
          </h2>
          <LocationMapIntegration
            initialLocation={selectedLocation.coordinates}
            showControls={true}
            className="w-full"
          />
        </div>
      )}

      {/* Feature Highlights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          ⚡ Performance Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-medium text-gray-900 mb-1">Optimized Search</h3>
            <p className="text-sm text-gray-600">
              Single API call for multi-country search with intelligent caching
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium text-gray-900 mb-1">Smart Suggestions</h3>
            <p className="text-sm text-gray-600">
              Combined location, listing, and category suggestions with relevance scoring
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-gray-900 mb-1">Performance Tracking</h3>
            <p className="text-sm text-gray-600">
              Real-time metrics with cache hit rates and response times
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-medium text-gray-900 mb-1">Location Integration</h3>
            <p className="text-sm text-gray-600">
              Seamless integration with 131K+ postal codes database
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-900 mb-1">Sub-second Results</h3>
            <p className="text-sm text-gray-600">
              Optimized queries with debouncing and intelligent fallbacks
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">🌍</div>
            <h3 className="font-medium text-gray-900 mb-1">Multi-Country</h3>
            <p className="text-sm text-gray-600">
              Search across Germany, Italy, Spain, and France simultaneously
            </p>
          </div>
        </div>
      </div>

      {/* Test Suggestions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🧪 Try These Searches
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'Neckartenzlingen',
            'Stuttgart',
            'Milano',
            'Barcelona',
            'Paris',
            'organic farm',
            'water source',
            '72654'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSearch(suggestion)}
              className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchIntegrationDemo;
