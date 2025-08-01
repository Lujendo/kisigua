import React, { useState, useEffect, useRef } from 'react';
import { GeocodingService } from '../../services/geocodingService';
import { LocationSearchResult, GeographicCoordinates } from '../../types/location';

interface LocationSearchInputProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationSearchResult) => void;
  onCoordinatesSelect?: (coordinates: GeographicCoordinates) => void;
  showSuggestions?: boolean;
  includeMinorLocations?: boolean;
  className?: string;
  disabled?: boolean;
  countries?: string[]; // Support multiple countries
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  placeholder = "Enter city, town, or address...",
  value = "",
  onLocationSelect,
  onCoordinatesSelect,
  showSuggestions = true,
  // includeMinorLocations = true,
  className = "",
  disabled = false,
  countries = ['DE', 'IT', 'ES', 'FR'] // Default to our supported countries
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input changes and search for suggestions
  useEffect(() => {
    const searchSuggestions = async () => {
      if (!inputValue.trim() || inputValue.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        // Optimized: Single API call for all countries
        const response = await fetch(`/api/locations/search-multi?q=${encodeURIComponent(inputValue)}&countries=${countries.join(',')}&limit=8`);

        if (response.ok) {
          const data = await response.json();
          const results = data.results.map((result: any) => ({
            name: result.name,
            displayName: result.displayName,
            coordinates: result.coordinates,
            hierarchy: {
              country: result.country,
              countryCode: result.country,
              region: result.region,
              district: result.district,
              city: result.name,
              coordinates: result.coordinates,
              population: 0,
              locationType: 'city'
            },
            relevanceScore: result.relevanceScore
          }));

          setSuggestions(results);
          setShowDropdown(results.length > 0 && showSuggestions);
          setSelectedIndex(-1);
        } else {
          // Fallback to original method
          const allResults: LocationSearchResult[] = [];

          for (const country of countries) {
            const results = await GeocodingService.searchLocations(inputValue, 2, country);
            allResults.push(...results);
          }

          const sortedResults = allResults
            .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
            .slice(0, 8);

          setSuggestions(sortedResults);
          setShowDropdown(sortedResults.length > 0 && showSuggestions);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, showSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSearchResult) => {
    setInputValue(suggestion.displayName);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onLocationSelect(suggestion);
    
    if (onCoordinatesSelect) {
      onCoordinatesSelect(suggestion.coordinates);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get location type icon
  const getLocationTypeIcon = (locationType: string) => {
    switch (locationType) {
      case 'city':
        return '🏙️';
      case 'town':
        return '🏘️';
      case 'village':
        return '🏡';
      case 'region':
        return '🗺️';
      default:
        return '📍';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
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
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a6 6 0 111.414-1.414l4.243 4.243a1 1 0 01-1.414 1.414z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
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
              <div className="flex items-center space-x-3">
                {/* Location Type Icon */}
                <span className="text-lg">
                  {getLocationTypeIcon(suggestion.hierarchy.locationType)}
                </span>
                
                {/* Location Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.displayName}
                  </div>
                  {suggestion.hierarchy.population && (
                    <div className="text-xs text-gray-400">
                      {suggestion.hierarchy.population.toLocaleString()} inhabitants
                    </div>
                  )}
                </div>

                {/* Relevance Indicator */}
                {suggestion.relevanceScore && suggestion.relevanceScore > 0.9 && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Exact match
                    </span>
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

export default LocationSearchInput;
