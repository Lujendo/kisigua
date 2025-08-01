/**
 * Optimized Search Bar - Integrated Location + Listings Search
 * High-performance search with caching and smart suggestions
 */

import React, { useState, useRef, useCallback } from 'react';
import { LocationSearchResult } from '../../types/location';
// Simple debounce implementation to avoid lodash dependency
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
import { trackSearchPerformance } from './SearchPerformanceMonitor';

interface SearchSuggestion {
  type: 'location' | 'listing' | 'category';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  coordinates?: { lat: number; lng: number };
  category?: string;
}

interface OptimizedSearchBarProps {
  placeholder?: string;
  onSearch: (query: string, location?: LocationSearchResult) => void;
  onLocationSelect?: (location: LocationSearchResult) => void;
  showLocationSuggestions?: boolean;
  showListingSuggestions?: boolean;
  countries?: string[];
  className?: string;
}

const OptimizedSearchBar: React.FC<OptimizedSearchBarProps> = ({
  placeholder = "Search listings or locations...",
  onSearch,
  onLocationSelect,
  showLocationSuggestions = true,
  showListingSuggestions = true,
  countries = ['DE', 'IT', 'ES', 'FR'],
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef(new Map<string, SearchSuggestion[]>());

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      // Check cache first
      const cacheKey = `${searchQuery.toLowerCase()}-${countries.join(',')}`;
      if (cacheRef.current.has(cacheKey)) {
        const cachedResults = cacheRef.current.get(cacheKey)!;
        setSuggestions(cachedResults);
        setShowDropdown(cachedResults.length > 0);
        return;
      }

      setIsLoading(true);
      const startTime = Date.now();

      try {
        const allSuggestions: SearchSuggestion[] = [];

        // 1. Location suggestions (if enabled)
        if (showLocationSuggestions) {
          const locationResponse = await fetch(
            `/api/locations/search-multi?q=${encodeURIComponent(searchQuery)}&countries=${countries.join(',')}&limit=4`
          );
          
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            const locationSuggestions: SearchSuggestion[] = locationData.results.map((result: any) => ({
              type: 'location' as const,
              id: `location-${result.id}`,
              title: result.name,
              subtitle: `${getCountryFlag(result.country)} ${result.region}${result.district ? `, ${result.district}` : ''}`,
              icon: '📍',
              coordinates: result.coordinates,
              category: result.country
            }));
            allSuggestions.push(...locationSuggestions);
          }
        }

        // 2. Listing suggestions (if enabled)
        if (showListingSuggestions) {
          const listingResponse = await fetch('/api/listings/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              page: 1,
              limit: 4
            })
          });
          
          if (listingResponse.ok) {
            const listingData = await listingResponse.json();
            const listingSuggestions: SearchSuggestion[] = listingData.listings.map((listing: any) => ({
              type: 'listing' as const,
              id: `listing-${listing.id}`,
              title: listing.title,
              subtitle: `${getCategoryIcon(listing.category)} ${listing.location.city}`,
              icon: '🏪',
              coordinates: { lat: listing.location.latitude, lng: listing.location.longitude },
              category: listing.category
            }));
            allSuggestions.push(...listingSuggestions);
          }
        }

        // 3. Category suggestions
        const categoryMatches = getMatchingCategories(searchQuery);
        const categorySuggestions: SearchSuggestion[] = categoryMatches.map(cat => ({
          type: 'category' as const,
          id: `category-${cat.key}`,
          title: cat.label,
          subtitle: `Browse all ${cat.label.toLowerCase()}`,
          icon: cat.icon,
          category: cat.key
        }));
        allSuggestions.push(...categorySuggestions);

        // Sort by relevance and limit
        const sortedSuggestions = allSuggestions
          .sort((a, b) => {
            // Prioritize exact matches
            const aExact = a.title.toLowerCase().startsWith(searchQuery.toLowerCase()) ? 1 : 0;
            const bExact = b.title.toLowerCase().startsWith(searchQuery.toLowerCase()) ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;
            
            // Then by type priority
            const typePriority = { location: 3, listing: 2, category: 1 };
            return typePriority[b.type] - typePriority[a.type];
          })
          .slice(0, 8);

        // Cache results
        cacheRef.current.set(cacheKey, sortedSuggestions);

        // Track performance
        trackSearchPerformance(searchQuery, startTime, sortedSuggestions.length, false);

        setSuggestions(sortedSuggestions);
        setShowDropdown(sortedSuggestions.length > 0);
      } catch (error) {
        console.error('Search suggestions error:', error);
        trackSearchPerformance(searchQuery, startTime, 0, false);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [countries, showLocationSuggestions, showListingSuggestions]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowDropdown(false);
    
    if (suggestion.type === 'location') {
      const locationResult: LocationSearchResult = {
        name: suggestion.title,
        displayName: suggestion.title,
        coordinates: suggestion.coordinates!,
        hierarchy: {
          country: suggestion.category || 'Unknown',
          countryCode: suggestion.category || 'XX',
          region: suggestion.subtitle?.split(' ')[1] || '',
          district: '',
          city: suggestion.title,
          coordinates: suggestion.coordinates!,
          population: 0,
          locationType: 'city'
        },
        relevanceScore: 1.0
      };
      
      setSelectedLocation(locationResult);
      if (onLocationSelect) {
        onLocationSelect(locationResult);
      }
    }
    
    // Trigger search
    onSearch(suggestion.title, selectedLocation || undefined);
  };

  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    onSearch(query, selectedLocation || undefined);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Helper functions
  const getCountryFlag = (countryCode: string): string => {
    const flags: Record<string, string> = {
      'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'FR': '🇫🇷'
    };
    return flags[countryCode] || '🌍';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'organic_farm': '🌱',
      'local_product': '🥕',
      'water_source': '💧',
      'sustainable_goods': '♻️'
    };
    return icons[category] || '🏪';
  };

  const getMatchingCategories = (query: string) => {
    const categories = [
      { key: 'organic_farm', label: 'Organic Farms', icon: '🌱' },
      { key: 'local_product', label: 'Local Products', icon: '🥕' },
      { key: 'water_source', label: 'Water Sources', icon: '💧' },
      { key: 'sustainable_goods', label: 'Sustainable Goods', icon: '♻️' }
    ];
    
    return categories.filter(cat => 
      cat.label.toLowerCase().includes(query.toLowerCase()) ||
      cat.key.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
        />
        
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Search
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex
                  ? 'bg-green-50 border-l-4 border-green-500'
                  : 'hover:bg-gray-50'
              } ${index === suggestions.length - 1 ? '' : 'border-b border-gray-100'}`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.title}</div>
                  {suggestion.subtitle && (
                    <div className="text-sm text-gray-600">{suggestion.subtitle}</div>
                  )}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {suggestion.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OptimizedSearchBar;
