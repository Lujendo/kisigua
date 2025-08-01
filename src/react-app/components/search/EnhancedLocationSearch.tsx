/**
 * Enhanced Location Search with Map Integration
 * Deep integration with postal codes database and MapService
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapService, MapLocation } from '../../services/mapService';
import { GeocodingService } from '../../services/geocodingService';
import { LocationSearchResult, GeographicCoordinates } from '../../types/location';

interface EnhancedLocationSearchProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: MapLocation) => void;
  onCoordinatesSelect?: (coordinates: GeographicCoordinates) => void;
  showSuggestions?: boolean;
  className?: string;
  disabled?: boolean;
  countries?: string[];
  showNearbyCount?: boolean;
  nearbyRadius?: number;
  showPostalCodes?: boolean;
}

const EnhancedLocationSearch: React.FC<EnhancedLocationSearchProps> = ({
  placeholder = "Search cities, postal codes, or click on map...",
  value = "",
  onLocationSelect,
  onCoordinatesSelect,
  showSuggestions = true,
  className = "",
  disabled = false,
  countries = ['DE', 'IT', 'ES', 'FR'],
  showNearbyCount = true,
  nearbyRadius = 25,
  showPostalCodes = true
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [, setNearbyCount] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Enhanced search with postal codes and nearby count
  useEffect(() => {
    const searchSuggestions = async () => {
      if (!inputValue.trim() || inputValue.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        setNearbyCount(0);
        return;
      }

      setIsLoading(true);
      try {
        // Search across all supported countries with enhanced results
        const allResults: (LocationSearchResult & { nearbyCount?: number })[] = [];
        
        for (const country of countries) {
          const results = await GeocodingService.searchLocations(inputValue, 3, country);
          
          // For each result, get nearby count if enabled
          for (const result of results) {
            let enhancedResult = { ...result };
            
            if (showNearbyCount && result.coordinates) {
              try {
                const nearbyResult = await MapService.searchNearbyLocations({
                  center: result.coordinates,
                  radiusKm: nearbyRadius,
                  countries,
                  maxResults: 100,
                  includeDistance: false
                });
                (enhancedResult as any).nearbyCount = nearbyResult.totalFound;
              } catch (error) {
                console.warn('Failed to get nearby count:', error);
              }
            }
            
            allResults.push(enhancedResult);
          }
        }
        
        // Sort by relevance score and limit results
        const sortedResults = allResults
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, 8);
        
        setSuggestions(sortedResults);
        setShowDropdown(sortedResults.length > 0 && showSuggestions);
        setSelectedIndex(-1);
        
        // Set nearby count for the first result
        if (sortedResults.length > 0 && sortedResults[0].nearbyCount) {
          setNearbyCount(sortedResults[0].nearbyCount);
        }
        
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
        setShowDropdown(false);
        setNearbyCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, showSuggestions, countries.join(','), nearbyRadius, showNearbyCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSuggestionSelect = async (suggestion: LocationSearchResult) => {
    setInputValue(suggestion.displayName);
    setShowDropdown(false);
    
    // Convert to MapLocation format
    const mapLocation: MapLocation = {
      id: `search-${suggestion.name}`,
      name: suggestion.name,
      coordinates: suggestion.coordinates,
      country: suggestion.hierarchy.countryCode,
      region: suggestion.hierarchy.region,
      district: suggestion.hierarchy.district,
      type: 'search',
      relevanceScore: suggestion.relevanceScore
    };
    
    onLocationSelect(mapLocation);
    
    if (onCoordinatesSelect) {
      onCoordinatesSelect(suggestion.coordinates);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

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
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Get location type icon
  const getLocationIcon = (location: LocationSearchResult) => {
    const countryFlags: Record<string, string> = {
      'DE': '🇩🇪',
      'IT': '🇮🇹', 
      'ES': '🇪🇸',
      'FR': '🇫🇷'
    };
    
    return countryFlags[location.hierarchy.countryCode] || '🌍';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
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
      </div>

      {/* Enhanced Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.name}-${suggestion.hierarchy.region}-${index}`}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex
                  ? 'bg-green-50 border-l-4 border-green-500'
                  : 'hover:bg-gray-50'
              } ${index === suggestions.length - 1 ? '' : 'border-b border-gray-100'}`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Country Flag */}
                  <span className="text-lg">{getLocationIcon(suggestion)}</span>
                  
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    <div className="text-sm text-gray-600">
                      {suggestion.hierarchy.region}
                      {suggestion.hierarchy.district && `, ${suggestion.hierarchy.district}`}
                    </div>
                    {showPostalCodes && (suggestion as any).postalCode && (
                      <div className="text-xs text-blue-600 font-medium">
                        📮 {(suggestion as any).postalCode}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Nearby Count */}
                {showNearbyCount && (suggestion as any).nearbyCount && (
                  <div className="text-xs text-green-600 font-medium">
                    {(suggestion as any).nearbyCount} nearby
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && suggestions.length === 0 && inputValue.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              <span>No locations found for "{inputValue}"</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Try searching for cities in Germany, Italy, Spain, or France
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationSearch;
