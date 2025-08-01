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
  onListingClick?: (listing: Listing) => void;
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
    const icons: { [key: string]: string } = {
      'organic_farm': '🌱',
      'local_product': '🏪',
      'water_source': '💧',
      'vending_machine': '🏪',
      'craft': '🎨',
      'sustainable_good': '♻️'
    };
    return icons[category] || '📦';
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
            <LocationSearchInput
              placeholder="🌍 Search location..."
              value={locationSearch}
              onLocationSelect={handleLocationSelect}
              showSuggestions={true}
              includeMinorLocations={true}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                if (e.target.value) {
                  setLocationSearch(''); // Clear location search when using dropdown
                  setSelectedLocationData(null);
                }
              }}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="">📍 Quick Locations</option>
              {locations.slice(0, 10).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="">🏷️ All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {formatCategory(category)}
                </option>
              ))}
            </select>
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
                🌍 {selectedLocationData.hierarchy.city}
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
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p className="mb-2">No listings found matching your criteria</p>
              {(searchQuery || selectedLocation || selectedCategory || locationSearch) && (
                <div className="text-sm mb-3">
                  Try adjusting your search terms or location filters
                </div>
              )}
              <button
                onClick={clearFilters}
                className="mt-2 text-green-600 hover:text-green-800 underline"
              >
                Clear all filters to see all listings
              </button>
            </div>
          ) : (
            filteredListings.map(listing => (
              <div
                key={listing.id}
                onClick={() => onListingClick?.(listing)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-green-300"
              >
                {/* Compact 3-line card */}
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/64/64';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                        {getCategoryIcon(listing.category)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Line 1: Title + Category */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {listing.title}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        {getCategoryIcon(listing.category)} {formatCategory(listing.category)}
                      </span>
                    </div>

                    {/* Line 2: Description */}
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {listing.description}
                    </p>

                    {/* Line 3: Location + Badges */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        📍 {listing.city}, {listing.region}
                      </span>
                      <div className="flex items-center gap-2">
                        {listing.is_organic && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            🌱 Organic
                          </span>
                        )}
                        {listing.is_certified && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            ✅ Certified
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          👁️ {listing.views || 0}
                        </span>
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
