import React, { useState } from 'react';
// import { usePerformance } from '../../contexts/PerformanceContext';
import useOptimizedFetch from '../../hooks/useOptimizedFetch';
import LocationSearchInput from './LocationSearchInput';
import { LocationSearchResult } from '../../types/location';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  region: string;
  country: string;
  images: string[];
  price_range: string;
  is_organic: boolean;
  is_certified: boolean;
  created_at: string;
  views: number;
}

interface CompactSearchCardProps {
  onListingClick?: (listingId: string) => void;
  className?: string;
}

const CompactSearchCard: React.FC<CompactSearchCardProps> = ({ onListingClick, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocationData, setSelectedLocationData] = useState<LocationSearchResult | null>(null);
  // const { getFromCache, setCache } = usePerformance();

  // Fetch all listings with optimized caching
  const { 
    data: listingsResponse, 
    loading: listingsLoading,
    refresh: refreshListings
  } = useOptimizedFetch<{ listings: Listing[] }>('/api/listings', {
    method: 'GET',
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
    immediate: true,
    onSuccess: (data) => {
      console.log('⚡ Dashboard listings loaded:', data?.listings?.length || 0);
    }
  });

  // Get listings array
  const allListings = listingsResponse?.listings || [];

  // Filter listings based on search criteria
  const filteredListings = allListings.filter(listing => {
    const matchesQuery = !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Enhanced location matching - check both dropdown selection and location search
    const matchesLocation = (!selectedLocation && !locationSearch) ||
      (selectedLocation && (
        listing.city.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        listing.region.toLowerCase().includes(selectedLocation.toLowerCase())
      )) ||
      (locationSearch && (
        listing.city.toLowerCase().includes(locationSearch.toLowerCase()) ||
        listing.region.toLowerCase().includes(locationSearch.toLowerCase())
      )) ||
      (selectedLocationData && (
        listing.city.toLowerCase().includes(selectedLocationData.hierarchy.city.toLowerCase()) ||
        (selectedLocationData.hierarchy.region && listing.region.toLowerCase().includes(selectedLocationData.hierarchy.region.toLowerCase()))
      ));

    const matchesCategory = !selectedCategory ||
      listing.category === selectedCategory;

    return matchesQuery && matchesLocation && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(allListings.map(listing => listing.category))];

  // Get unique locations for filter
  const locations = [...new Set(allListings.map(listing => `${listing.city}, ${listing.region}`))];

  // const handleSearch = () => {
  //   // Search is real-time, no need for explicit search action
  //   console.log('🔍 Search filters applied:', { searchQuery, selectedLocation, selectedCategory });
  // };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedCategory('');
    setLocationSearch('');
    setSelectedLocationData(null);
  };

  // Handle location selection from LocationSearchInput
  const handleLocationSelect = (location: LocationSearchResult) => {
    setSelectedLocationData(location);
    setLocationSearch(location.displayName);
    setSelectedLocation(''); // Clear dropdown selection when using location search
    console.log('🌍 Location selected:', location);
  };

  const getCategoryIcon = (category: string) => {
    const iconComponents: { [key: string]: React.ReactElement } = {
      'organic_farm': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      'local_product': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'water_source': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25c0-1.5 1.5-3 3.75-3s3.75 1.5 3.75 3-1.5 3-3.75 3-3.75-1.5-3.75-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.25c-1.5 0-3 1.5-3 3.75 0 2.25 3 6.75 3 6.75s3-4.5 3-6.75c0-2.25-1.5-3.75-3-3.75z" />
        </svg>
      ),
      'vending_machine': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'craft': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      'sustainable_good': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    };
    return iconComponents[category] || (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Search Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          🔍 Search Listings
        </h2>
        <div className="text-sm text-gray-500">
          {filteredListings.length} of {allListings.length} listings
        </div>
      </div>

      {/* Compact Search Filters */}
      <div className="space-y-4 mb-6">
        {/* Top Row: Search Query */}
        <div>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Bottom Row: Location Search + Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Enhanced Location Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <LocationSearchInput
              placeholder="Search location..."
              value={locationSearch}
              onLocationSelect={handleLocationSelect}
              showSuggestions={true}
              includeMinorLocations={true}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              countries={['DE', 'IT', 'ES', 'FR']}
            />
            {selectedLocationData && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Quick Location Filter (for existing locations) */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                if (e.target.value) {
                  setLocationSearch(''); // Clear location search when using dropdown
                  setSelectedLocationData(null);
                }
              }}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none"
            >
              <option value="">Quick Locations</option>
              {locations.slice(0, 10).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={refreshListings}
            disabled={listingsLoading}
            className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50 disabled:opacity-50"
          >
            {listingsLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        
        {/* Active Filters Indicator */}
        {(searchQuery || selectedLocation || selectedCategory || locationSearch) && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-green-600 font-medium">
              Filters active
            </div>
            {selectedLocationData && (
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedLocationData.hierarchy.city}
                {selectedLocationData.hierarchy.region && `, ${selectedLocationData.hierarchy.region}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {listingsLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading listings...</p>
        </div>
      )}

      {/* Results */}
      {!listingsLoading && (
        <div className="space-y-3">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="relative mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xs">!</span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-600 mb-4">No listings match your current search criteria</p>
              {(searchQuery || selectedLocation || selectedCategory || locationSearch) && (
                <div className="text-sm mb-4 text-gray-500">
                  Try adjusting your search terms or location filters
                </div>
              )}
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear all filters
              </button>
            </div>
          ) : (
            filteredListings.map(listing => (
              <div
                key={listing.id}
                onClick={() => onListingClick?.(listing.id)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
              >
                <div className="flex items-start space-x-4">
                  {/* Image */}
                  <div className="flex-shrink-0 relative">
                    <img
                      src={listing.images?.[0] || '/api/placeholder/96/96'}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/96/96';
                      }}
                    />
                    {/* Category Icon Overlay */}
                    <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-1 rounded-full">
                      <div className="text-gray-600">
                        {getCategoryIcon(listing.category)}
                      </div>
                    </div>
                    {listing.is_certified && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>

                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                            {getCategoryIcon(listing.category)}
                            {formatCategory(listing.category)}
                          </span>
                          {listing.is_organic && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              Organic
                            </span>
                          )}
                          {listing.price_range && (
                            <span className="text-sm font-medium text-green-600">
                              {listing.price_range}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {listing.city}, {listing.country}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {listing.views || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CompactSearchCard;
