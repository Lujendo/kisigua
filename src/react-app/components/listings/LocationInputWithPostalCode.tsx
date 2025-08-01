/**
 * Location Input with Postal Code Integration
 * Smart location input that uses our postal codes database for autocomplete
 */

import React, { useState, useRef, useCallback } from 'react';
import { LocationSearchResult } from '../../types/location';
import { MapService } from '../../services/mapService';
import { PostalCodeLookupService, PostalCodeLookupResult, CityLookupResult, RegionLookupResult } from '../../services/postalCodeLookupService';

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

  // Enhanced lookup states
  const [postalLookupResults, setPostalLookupResults] = useState<PostalCodeLookupResult[]>([]);
  const [cityLookupResults, setCityLookupResults] = useState<CityLookupResult[]>([]);
  const [regionLookupResults, setRegionLookupResults] = useState<RegionLookupResult[]>([]);
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);
  const [lookupType, setLookupType] = useState<'postal' | 'city' | 'region' | null>(null);

  // Region input state
  const [regionQuery, setRegionQuery] = useState(value.region || '');
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const postalInputRef = useRef<HTMLInputElement>(null);

  // Enhanced postal code lookup
  const performPostalLookup = useCallback(async (postalCode: string) => {
    if (!postalCode || postalCode.length < 3) {
      setPostalLookupResults([]);
      setShowLookupSuggestions(false);
      return;
    }

    setIsLoadingPostal(true);
    try {
      const countryCode = PostalCodeLookupService.getCountryCode(value.country);
      const results = await PostalCodeLookupService.lookupByPostalCode(postalCode, countryCode);
      setPostalLookupResults(results);
      setLookupType('postal');
      setShowLookupSuggestions(results.length > 0);
    } catch (error) {
      console.error('Postal lookup error:', error);
      setPostalLookupResults([]);
    } finally {
      setIsLoadingPostal(false);
    }
  }, [value.country]);

  // Enhanced city lookup
  const performCityLookup = useCallback(async (cityName: string) => {
    if (!cityName || cityName.length < 2) {
      setCityLookupResults([]);
      setShowLookupSuggestions(false);
      return;
    }

    setIsLoadingCities(true);
    try {
      const countryCode = PostalCodeLookupService.getCountryCode(value.country);
      const results = await PostalCodeLookupService.lookupByCity(cityName, countryCode);
      setCityLookupResults(results);
      setLookupType('city');
      setShowLookupSuggestions(results.length > 0);
    } catch (error) {
      console.error('City lookup error:', error);
      setCityLookupResults([]);
    } finally {
      setIsLoadingCities(false);
    }
  }, [value.country]);

  // Enhanced region lookup
  const performRegionLookup = useCallback(async (regionName: string) => {
    if (!regionName || regionName.length < 2) {
      setRegionLookupResults([]);
      setShowLookupSuggestions(false);
      return;
    }

    setIsLoadingRegions(true);
    try {
      const countryCode = PostalCodeLookupService.getCountryCode(value.country);
      const results = await PostalCodeLookupService.lookupByRegion(regionName, countryCode);
      setRegionLookupResults(results);
      setLookupType('region');
      setShowLookupSuggestions(results.length > 0);
    } catch (error) {
      console.error('Region lookup error:', error);
      setRegionLookupResults([]);
    } finally {
      setIsLoadingRegions(false);
    }
  }, [value.country]);

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

  // Handle enhanced postal code lookup selection
  const handleEnhancedPostalSelect = (result: PostalCodeLookupResult) => {
    setPostalQuery(result.postalCode);
    setCityQuery(result.city);
    setRegionQuery(result.region);
    setShowLookupSuggestions(false);

    const newLocation: LocationData = {
      ...value,
      city: result.city,
      region: result.region,
      country: result.country,
      postalCode: result.postalCode,
      latitude: result.coordinates.lat,
      longitude: result.coordinates.lng
    };

    onChange(newLocation);
  };

  // Handle enhanced city lookup selection
  const handleEnhancedCitySelect = (result: CityLookupResult) => {
    setCityQuery(result.city);
    setRegionQuery(result.region);
    setShowLookupSuggestions(false);

    // If only one postal code, auto-fill it
    if (result.postalCodes.length === 1) {
      setPostalQuery(result.postalCodes[0]);
    }

    const newLocation: LocationData = {
      ...value,
      city: result.city,
      region: result.region,
      country: result.country,
      postalCode: result.postalCodes.length === 1 ? result.postalCodes[0] : value.postalCode,
      latitude: result.coordinates.lat,
      longitude: result.coordinates.lng
    };

    onChange(newLocation);
  };

  // Handle enhanced region lookup selection
  const handleEnhancedRegionSelect = (result: RegionLookupResult) => {
    setRegionQuery(result.region);
    setShowLookupSuggestions(false);

    const newLocation: LocationData = {
      ...value,
      region: result.region,
      country: result.country,
      latitude: result.coordinates.lat,
      longitude: result.coordinates.lng
    };

    onChange(newLocation);
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
              performCityLookup(e.target.value);
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
              performPostalLookup(e.target.value);
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
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region/State
          </label>
          <input
            type="text"
            value={regionQuery}
            onChange={(e) => {
              setRegionQuery(e.target.value);
              handleInputChange('region', e.target.value);
              performRegionLookup(e.target.value);
            }}
            onFocus={() => regionLookupResults.length > 0 && setShowLookupSuggestions(true)}
            placeholder="e.g., Baden-Württemberg, Lombardy"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          {/* Loading indicator */}
          {isLoadingRegions && (
            <div className="absolute right-3 top-9">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
            </div>
          )}
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

      {/* Enhanced Lookup Suggestions */}
      {showLookupSuggestions && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            {lookupType === 'postal' && 'Postal Code Suggestions'}
            {lookupType === 'city' && 'City Suggestions'}
            {lookupType === 'region' && 'Region Suggestions'}
          </div>

          {/* Postal Code Results */}
          {lookupType === 'postal' && postalLookupResults.length > 0 && (
            <div className="space-y-2">
              {postalLookupResults.slice(0, 5).map((result, index) => (
                <div
                  key={`postal-${result.postalCode}-${index}`}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleEnhancedPostalSelect(result)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{result.postalCode}</div>
                    <div className="text-sm text-blue-700">{result.displayName}</div>
                  </div>
                  <div className="text-xs text-blue-600">
                    {(result.confidence * 100).toFixed(0)}% match
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* City Results */}
          {lookupType === 'city' && cityLookupResults.length > 0 && (
            <div className="space-y-2">
              {cityLookupResults.slice(0, 5).map((result, index) => (
                <div
                  key={`city-${result.city}-${index}`}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => handleEnhancedCitySelect(result)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-green-900">{result.city}</div>
                    <div className="text-sm text-green-700">{result.displayName}</div>
                    <div className="text-xs text-green-600 mt-1">
                      Postal codes: {result.postalCodes.slice(0, 3).join(', ')}
                      {result.postalCodes.length > 3 && ` +${result.postalCodes.length - 3} more`}
                    </div>
                  </div>
                  <div className="text-xs text-green-600">
                    {(result.confidence * 100).toFixed(0)}% match
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Region Results */}
          {lookupType === 'region' && regionLookupResults.length > 0 && (
            <div className="space-y-2">
              {regionLookupResults.slice(0, 3).map((result, index) => (
                <div
                  key={`region-${result.region}-${index}`}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => handleEnhancedRegionSelect(result)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-purple-900">{result.region}</div>
                    <div className="text-sm text-purple-700">{result.country}</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {result.cities.length} cities • {result.postalCodeRanges.join(', ')}
                    </div>
                  </div>
                  <div className="text-xs text-purple-600">
                    {(result.confidence * 100).toFixed(0)}% match
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowLookupSuggestions(false)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            Close suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationInputWithPostalCode;
