/**
 * Location Input with Postal Code Integration
 * Smart location input that uses our postal codes database for autocomplete
 */

import React, { useState, useRef, useCallback } from 'react';
import { LocationSearchResult } from '../../types/location';
import { MapService } from '../../services/mapService';

interface LocationData {
  street?: string;
  houseNumber?: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationInputWithPostalCodeProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  countries?: string[];
  required?: boolean;
  className?: string;
}

const LocationInputWithPostalCode: React.FC<LocationInputWithPostalCodeProps> = ({
  value,
  onChange,
  countries = ['DE', 'IT', 'ES', 'FR'],
  required = false,
  className = ""
}) => {
  const [cityQuery, setCityQuery] = useState(value.city || '');
  const [citySuggestions, setCitySuggestions] = useState<LocationSearchResult[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  const [postalQuery, setPostalQuery] = useState(value.postalCode || '');
  const [postalSuggestions, setPostalSuggestions] = useState<LocationSearchResult[]>([]);
  const [showPostalSuggestions, setShowPostalSuggestions] = useState(false);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const postalInputRef = useRef<HTMLInputElement>(null);

  // Debounced city search
  const searchCities = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    setIsLoadingCities(true);
    try {
      const response = await fetch(
        `/api/locations/search-multi?q=${encodeURIComponent(query)}&countries=${countries.join(',')}&limit=8`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions: LocationSearchResult[] = data.results.map((result: any) => ({
          name: result.name,
          displayName: result.displayName,
          coordinates: result.coordinates,
          hierarchy: {
            country: result.country,
            countryCode: result.country,
            region: result.region,
            district: result.district,
            city: result.name,
            postalCode: result.postalCode,
            coordinates: result.coordinates,
            population: 0,
            locationType: 'city'
          },
          relevanceScore: result.relevanceScore
        }));
        
        setCitySuggestions(suggestions);
        setShowCitySuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('City search error:', error);
    } finally {
      setIsLoadingCities(false);
    }
  }, [countries]);

  // Debounced postal code search
  const searchPostalCodes = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPostalSuggestions([]);
      setShowPostalSuggestions(false);
      return;
    }

    setIsLoadingPostal(true);
    try {
      const response = await fetch(
        `/api/locations/search-multi?q=${encodeURIComponent(query)}&countries=${countries.join(',')}&limit=8`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter for postal code matches
        const postalMatches = data.results.filter((result: any) => 
          result.postalCode && result.postalCode.toLowerCase().includes(query.toLowerCase())
        );
        
        const suggestions: LocationSearchResult[] = postalMatches.map((result: any) => ({
          name: result.name,
          displayName: `${result.postalCode} ${result.name}, ${result.region}`,
          coordinates: result.coordinates,
          hierarchy: {
            country: result.country,
            countryCode: result.country,
            region: result.region,
            district: result.district,
            city: result.name,
            postalCode: result.postalCode,
            coordinates: result.coordinates,
            population: 0,
            locationType: 'city'
          },
          relevanceScore: result.relevanceScore
        }));
        
        setPostalSuggestions(suggestions);
        setShowPostalSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Postal code search error:', error);
    } finally {
      setIsLoadingPostal(false);
    }
  }, [countries]);

  // Handle city selection
  const handleCitySelect = (suggestion: LocationSearchResult) => {
    setCityQuery(suggestion.name);
    setShowCitySuggestions(false);
    
    // Auto-fill location data
    const newLocation: LocationData = {
      ...value,
      city: suggestion.name,
      region: suggestion.hierarchy.region,
      country: suggestion.hierarchy.country,
      postalCode: suggestion.hierarchy.postalCode || value.postalCode,
      latitude: suggestion.coordinates.lat,
      longitude: suggestion.coordinates.lng
    };
    
    onChange(newLocation);
    
    // Update postal code input if available
    if (suggestion.hierarchy.postalCode) {
      setPostalQuery(suggestion.hierarchy.postalCode);
    }
  };

  // Handle postal code selection
  const handlePostalSelect = (suggestion: LocationSearchResult) => {
    setPostalQuery(suggestion.hierarchy.postalCode || '');
    setShowPostalSuggestions(false);
    
    // Auto-fill location data
    const newLocation: LocationData = {
      ...value,
      city: suggestion.name,
      region: suggestion.hierarchy.region,
      country: suggestion.hierarchy.country,
      postalCode: suggestion.hierarchy.postalCode,
      latitude: suggestion.coordinates.lat,
      longitude: suggestion.coordinates.lng
    };
    
    onChange(newLocation);
    
    // Update city input
    setCityQuery(suggestion.name);
  };

  // Handle manual input changes
  const handleInputChange = (field: keyof LocationData, inputValue: string) => {
    const newLocation = { ...value, [field]: inputValue };
    onChange(newLocation);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Street Address */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address {required && '*'}
          </label>
          <input
            type="text"
            value={value.street || ''}
            onChange={(e) => handleInputChange('street', e.target.value)}
            placeholder="e.g., Hauptstraße, Main Street"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={required}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            House Number
          </label>
          <input
            type="text"
            value={value.houseNumber || ''}
            onChange={(e) => handleInputChange('houseNumber', e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* City and Postal Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City Input with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City {required && '*'}
          </label>
          <input
            ref={cityInputRef}
            type="text"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              handleInputChange('city', e.target.value);
              searchCities(e.target.value);
            }}
            onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
            placeholder="Enter city name..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={required}
          />
          
          {/* Loading indicator */}
          {isLoadingCities && (
            <div className="absolute right-3 top-9">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
            </div>
          )}
          
          {/* City Suggestions */}
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {citySuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.name}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleCitySelect(suggestion)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{MapService.getCountryFlag(suggestion.hierarchy.countryCode)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{suggestion.name}</div>
                      <div className="text-sm text-gray-600">{suggestion.hierarchy.region}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Postal Code Input with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code
          </label>
          <input
            ref={postalInputRef}
            type="text"
            value={postalQuery}
            onChange={(e) => {
              setPostalQuery(e.target.value);
              handleInputChange('postalCode', e.target.value);
              searchPostalCodes(e.target.value);
            }}
            onFocus={() => postalSuggestions.length > 0 && setShowPostalSuggestions(true)}
            placeholder="e.g., 72654, 10115"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          
          {/* Loading indicator */}
          {isLoadingPostal && (
            <div className="absolute right-3 top-9">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
            </div>
          )}
          
          {/* Postal Code Suggestions */}
          {showPostalSuggestions && postalSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {postalSuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.hierarchy.postalCode}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handlePostalSelect(suggestion)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{MapService.getCountryFlag(suggestion.hierarchy.countryCode)}</span>
                    <div>
                      <div className="font-medium text-blue-600">{suggestion.hierarchy.postalCode}</div>
                      <div className="text-sm text-gray-600">{suggestion.name}, {suggestion.hierarchy.region}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Region and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region/State
          </label>
          <input
            type="text"
            value={value.region || ''}
            onChange={(e) => handleInputChange('region', e.target.value)}
            placeholder="e.g., Baden-Württemberg, Lombardy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country {required && '*'}
          </label>
          <select
            value={value.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={required}
          >
            <option value="">Select Country</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="Italy">🇮🇹 Italy</option>
            <option value="Spain">🇪🇸 Spain</option>
            <option value="France">🇫🇷 France</option>
          </select>
        </div>
      </div>

      {/* Location Preview */}
      {value.city && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Location Preview:</div>
          <div className="flex items-center space-x-2">
            {value.country && (
              <span>{MapService.getCountryFlag(value.country === 'Germany' ? 'DE' : value.country === 'Italy' ? 'IT' : value.country === 'Spain' ? 'ES' : value.country === 'France' ? 'FR' : 'DE')}</span>
            )}
            <span className="font-medium">
              {[value.street, value.houseNumber].filter(Boolean).join(' ')}
              {value.street && ', '}
              {value.postalCode && `${value.postalCode} `}
              {value.city}
              {value.region && `, ${value.region}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInputWithPostalCode;
