/**
 * Location Input with Postal Code Integration
 * Smart location input that uses our postal codes database for autocomplete
 */

import React, { useState, useRef, useCallback } from 'react';
import { LocationSearchResult } from '../../types/location';
import { MapService } from '../../services/mapService';
import { PostalCodeLookupService } from '../../services/postalCodeLookupService';

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
  required?: boolean;
  className?: string;
}

const LocationInputWithPostalCode: React.FC<LocationInputWithPostalCodeProps> = ({
  value,
  onChange,
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

  // Region input state
  const [regionQuery, setRegionQuery] = useState(value.region || '');

  // REMOVED: Multiple lookup systems - now using unified approach
  // REMOVED: Enhanced lookup states, separate modal systems, etc.
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const postalInputRef = useRef<HTMLInputElement>(null);

  // Debounce timers for performance optimization
  const debounceTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // OPTIMIZED DEBOUNCED LOOKUP SYSTEM - fast and efficient
  const performUnifiedLookup = useCallback((query: string, type: 'city' | 'postal') => {
    // Clear existing timer for this type
    if (debounceTimerRef.current[type]) {
      clearTimeout(debounceTimerRef.current[type]);
    }

    // For very short queries, clear suggestions immediately
    if (!query || query.length < 2) {
      if (type === 'city') {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      } else {
        setPostalSuggestions([]);
        setShowPostalSuggestions(false);
      }
      return;
    }

    // Debounce the actual lookup to reduce API calls
    debounceTimerRef.current[type] = setTimeout(() => {
      performActualLookup(query, type);
    }, 300); // 300ms debounce for optimal UX
  }, [value.country]);

  // Actual lookup function (separated for debouncing)
  const performActualLookup = useCallback(async (query: string, type: 'city' | 'postal') => {
    // Early validation
    if (!query || query.length < 2) return;

    // COUNTRY MUST BE SELECTED FIRST
    if (!value.country) {
      console.warn('⚠️ Country must be selected before performing location lookup');
      return;
    }

    const isLoading = type === 'city' ? setIsLoadingCities : setIsLoadingPostal;
    isLoading(true);

    // Performance optimization: limit results for faster response
    const maxResults = 8; // Reduced from default for faster loading

    try {
      const startTime = performance.now();
      const countryCode = PostalCodeLookupService.getCountryCode(value.country);
      console.log(`⚡ Fast ${type} lookup: "${query}" in ${value.country}`);

      if (type === 'city') {
        // OPTIMIZED CITY LOOKUP - faster processing with early limits
        const results = await PostalCodeLookupService.lookupByCity(query, countryCode);

        // Fast conversion with minimal processing - limit results early
        const citySuggestions = results.slice(0, maxResults).map(result => ({
          name: result.city,
          displayName: result.displayName,
          coordinates: result.coordinates,
          hierarchy: {
            country: value.country, // Use selected country
            countryCode: countryCode,
            region: result.region,
            district: '',
            city: result.city,
            postalCode: result.postalCodes[0],
            coordinates: result.coordinates,
            locationType: 'city' as const
          },
          enhancedData: {
            postalCodes: result.postalCodes,
            confidence: result.confidence,
            displayName: result.displayName
          }
        }));

        setCitySuggestions(citySuggestions);
        setShowCitySuggestions(citySuggestions.length > 0);

        const endTime = performance.now();
        console.log(`✅ City lookup completed in ${(endTime - startTime).toFixed(0)}ms - ${citySuggestions.length} results`);

      } else {
        // OPTIMIZED POSTAL CODE LOOKUP - faster with early limits
        const isNumeric = /^\d+/.test(query);

        if (isNumeric) {
          // Fast numeric postal code lookup
          const results = await PostalCodeLookupService.lookupByPostalCode(query, countryCode);

          const postalSuggestions = results.slice(0, maxResults).map(result => ({
            name: result.city,
            displayName: `${result.postalCode} ${result.city}, ${result.region}`,
            coordinates: result.coordinates,
            hierarchy: {
              country: value.country, // Use selected country
              countryCode: countryCode,
              region: result.region,
              district: '',
              city: result.city,
              postalCode: result.postalCode,
              coordinates: result.coordinates,
              locationType: 'city' as const
            }
          }));

          setPostalSuggestions(postalSuggestions);
          setShowPostalSuggestions(postalSuggestions.length > 0);
        } else {
          // Fast text-based city lookup for postal field - limit early
          const results = await PostalCodeLookupService.lookupByCity(query, countryCode);

          // Optimize: limit postal codes per city and total results for speed
          const postalSuggestions = results
            .slice(0, 4) // Limit cities for faster processing
            .flatMap(result =>
              result.postalCodes
                .slice(0, 3) // Max 3 postal codes per city for speed
                .map(postalCode => ({
                  name: result.city,
                  displayName: `${postalCode} ${result.city}, ${result.region}`,
                  coordinates: result.coordinates,
                  hierarchy: {
                    country: value.country, // Use selected country
                    countryCode: countryCode,
                    region: result.region,
                    district: '',
                    city: result.city,
                    postalCode: postalCode,
                    coordinates: result.coordinates,
                    locationType: 'city' as const
                  }
                }))
            )
            .slice(0, maxResults); // Final limit for performance

          setPostalSuggestions(postalSuggestions);
          setShowPostalSuggestions(postalSuggestions.length > 0);

          const endTime = performance.now();
          console.log(`✅ Postal lookup completed in ${(endTime - startTime).toFixed(0)}ms - ${postalSuggestions.length} results`);
        }
      }
    } catch (error) {
      console.error(`❌ ${type} lookup error:`, error);
    } finally {
      isLoading(false);
    }
  }, [value.country]);

  // Cleanup debounce timers on unmount
  React.useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // OLD LOOKUP FUNCTIONS REMOVED - using unified system

  // OLD SEARCH FUNCTIONS REMOVED - using unified lookup system

  // ALL OLD SEARCH FUNCTIONS REMOVED - using unified lookup system

  // Handle city selection - now works with enhanced data
  const handleCitySelect = (suggestion: LocationSearchResult) => {
    const enhancedData = (suggestion as any).enhancedData;

    setCityQuery(suggestion.name);
    setShowCitySuggestions(false);

    // If city has multiple postal codes, show them in postal code field
    if (enhancedData?.postalCodes?.length > 1) {
      console.log(`🏙️ City ${suggestion.name} has ${enhancedData.postalCodes.length} postal codes, showing in postal code field`);

      // Create postal code suggestions for the postal code field
      const postalCodeSuggestions = enhancedData.postalCodes.map((postalCode: string) => ({
        name: suggestion.name,
        displayName: `${postalCode} ${suggestion.name}, ${suggestion.hierarchy.region}`,
        coordinates: suggestion.coordinates,
        hierarchy: {
          country: suggestion.hierarchy.country,
          countryCode: suggestion.hierarchy.countryCode,
          region: suggestion.hierarchy.region,
          district: '',
          city: suggestion.name,
          postalCode: postalCode,
          coordinates: suggestion.coordinates,
          locationType: 'city' as const
        }
      }));

      // Show postal code suggestions
      setPostalSuggestions(postalCodeSuggestions);
      setShowPostalSuggestions(true);

      // Focus postal code field to show suggestions
      if (postalInputRef.current) {
        postalInputRef.current.focus();
      }

      // Update location without postal code for now
      const newLocation: LocationData = {
        ...value,
        city: suggestion.name,
        region: suggestion.hierarchy.region,
        country: suggestion.hierarchy.country,
        latitude: suggestion.coordinates.lat,
        longitude: suggestion.coordinates.lng
      };
      onChange(newLocation);
    } else {
      // Single postal code, auto-fill everything
      const postalCode = enhancedData?.postalCodes?.[0] || suggestion.hierarchy.postalCode;
      if (postalCode) {
        setPostalQuery(postalCode);
      }

      const newLocation: LocationData = {
        ...value,
        city: suggestion.name,
        region: suggestion.hierarchy.region,
        country: suggestion.hierarchy.country,
        postalCode: postalCode,
        latitude: suggestion.coordinates.lat,
        longitude: suggestion.coordinates.lng
      };
      onChange(newLocation);
    }
  };

  // Handle postal code selection
  const handlePostalSelect = (suggestion: LocationSearchResult) => {
    console.log('📮 Postal code selected:', suggestion.hierarchy.postalCode, 'for city:', suggestion.name);

    setPostalQuery(suggestion.hierarchy.postalCode || '');
    setCityQuery(suggestion.name); // Auto-populate city field
    setRegionQuery(suggestion.hierarchy.region || '');
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
  };

  // OLD HANDLER FUNCTIONS REMOVED - using unified system

  // ALL OLD HANDLER FUNCTIONS REMOVED - using unified system

  // Modal-related functions removed - postal codes now show in dropdown

  // Handle manual input changes - COUNTRY IS NEVER OVERRIDDEN
  const handleInputChange = (field: keyof LocationData, inputValue: string) => {
    // Preserve country selection - never allow it to be overridden
    const currentCountry = value.country;

    const newLocation = {
      ...value,
      [field]: inputValue
    };

    // Ensure country is never overridden by other field inputs
    if (field !== 'country' && currentCountry) {
      newLocation.country = currentCountry;
    }

    onChange(newLocation);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection - First Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country {required && '*'}
        </label>
        <select
          value={value.country || ''}
          onChange={(e) => {
            handleInputChange('country', e.target.value);
            // Clear location data when country changes - COUNTRY IS PRIMARY RULE
            setCityQuery('');
            setPostalQuery('');
            setRegionQuery('');
            setShowCitySuggestions(false);
            setShowPostalSuggestions(false);
            console.log('🌍 Country changed to:', e.target.value, '- All location data cleared');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required={required}
        >
          <option value="">Select Country</option>
          <option value="Germany">🇩🇪 Germany</option>
          <option value="Italy">🇮🇹 Italy</option>
          <option value="Spain">🇪🇸 Spain</option>
          <option value="France">🇫🇷 France</option>
          <option value="Austria">🇦🇹 Austria</option>
          <option value="Switzerland">🇨🇭 Switzerland</option>
          <option value="Netherlands">🇳🇱 Netherlands</option>
          <option value="Belgium">🇧🇪 Belgium</option>
        </select>
      </div>

      {/* Only show location fields if country is selected */}
      {value.country && (
        <>
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
              performUnifiedLookup(e.target.value, 'city');
            }}
            onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
            placeholder="Enter city name..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required={required}
          />
          
          {/* Fast loading indicator */}
          {isLoadingCities && (
            <div className="absolute right-3 top-9 flex items-center space-x-1">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">⚡</span>
            </div>
          )}
          
          {/* Enhanced City Suggestions */}
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {citySuggestions.map((suggestion, index) => {
                const enhancedData = (suggestion as any).enhancedData;
                const hasMultiplePostalCodes = enhancedData?.postalCodes?.length > 1;

                return (
                  <div
                    key={`${suggestion.name}-${index}`}
                    className="px-3 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleCitySelect(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <span>{MapService.getCountryFlag(suggestion.hierarchy.countryCode)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            {hasMultiplePostalCodes && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {enhancedData.postalCodes.length} codes
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{suggestion.hierarchy.region}</div>
                          {enhancedData && (
                            <div className="text-xs text-gray-500 mt-1">
                              {hasMultiplePostalCodes ? (
                                <>
                                  Postal codes: {enhancedData.postalCodes.slice(0, 3).join(', ')}
                                  {enhancedData.postalCodes.length > 3 && ` +${enhancedData.postalCodes.length - 3} more`}
                                  <span className="ml-2 text-blue-600 font-medium">
                                    → Click to see postal codes
                                  </span>
                                </>
                              ) : (
                                `Postal code: ${enhancedData.postalCodes[0]}`
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {enhancedData?.confidence && (
                        <div className="text-xs text-green-600 ml-2">
                          {(enhancedData.confidence * 100).toFixed(0)}% match
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              performUnifiedLookup(e.target.value, 'postal');
            }}
            onFocus={() => postalSuggestions.length > 0 && setShowPostalSuggestions(true)}
            placeholder="e.g., 72654 or Berlin"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          {/* Fast loading indicator */}
          {isLoadingPostal && (
            <div className="absolute right-3 top-9 flex items-center space-x-1">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">⚡</span>
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-1">
            ⚡ Fast lookup: Type postal code or city name - suggestions appear instantly
          </p>

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
            }}
            placeholder="e.g., Baden-Württemberg, Lombardy"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          {/* Region loading removed - simplified input */}
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

      {/* Enhanced Lookup Suggestions Panel - REMOVED
          City suggestions now appear directly in the City field dropdown */}

      {/* Postal Code Selection Modal - REMOVED
          Postal codes now show directly in the postal code field dropdown */}
        </>
      )}
    </div>
  );
};

export default LocationInputWithPostalCode;
