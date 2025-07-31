import React, { useState, useEffect } from 'react';
import { GeocodingService } from '../../services/geocodingService';
import { LocationFilters as LocationFiltersType } from '../../types/location';

interface LocationFiltersProps {
  filters: LocationFiltersType;
  onFiltersChange: (filters: LocationFiltersType) => void;
  className?: string;
  showAdvanced?: boolean;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({
  filters,
  onFiltersChange,
  className = "",
  showAdvanced = false
}) => {
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<{ name: string; population?: number }[]>([]);

  // Load available regions on component mount
  useEffect(() => {
    const regions = GeocodingService.getRegions();
    setAvailableRegions(regions);
  }, []);

  // Load cities when region changes
  useEffect(() => {
    if (filters.region) {
      const cities = GeocodingService.getCitiesByRegion(filters.region);
      setAvailableCities(cities.map(city => ({
        name: city.name,
        population: city.population
      })));
    } else {
      setAvailableCities([]);
    }
  }, [filters.region]);

  // Handle filter changes
  const handleFilterChange = (key: keyof LocationFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clear dependent filters when parent changes
    if (key === 'country' && value !== filters.country) {
      newFilters.region = undefined;
      newFilters.city = undefined;
    } else if (key === 'region' && value !== filters.region) {
      newFilters.city = undefined;
    }
    
    onFiltersChange(newFilters);
  };

  // Handle radius change
  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange('radius', Number(e.target.value));
  };

  // Clear all location filters
  const clearLocationFilters = () => {
    onFiltersChange({
      ...filters,
      country: undefined,
      countryCode: undefined,
      region: undefined,
      city: undefined,
      coordinates: undefined
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country
        </label>
        <select
          value={filters.country || ''}
          onChange={(e) => handleFilterChange('country', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
        >
          <option value="">All Countries</option>
          <option value="Germany">Germany</option>
          <option value="Austria">Austria</option>
          <option value="Switzerland">Switzerland</option>
        </select>
      </div>

      {/* Region Filter - Only show for Germany */}
      {filters.country === 'Germany' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State/Region
          </label>
          <select
            value={filters.region || ''}
            onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            <option value="">All States</option>
            {availableRegions.map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* City Filter - Only show when region is selected */}
      {filters.region && availableCities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <select
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            <option value="">All Cities</option>
            {availableCities.map(city => (
              <option key={city.name} value={city.name}>
                {city.name}
                {city.population && ` (${city.population.toLocaleString()})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Radius
        </label>
        <div className="flex items-center space-x-3">
          <select
            value={filters.radius}
            onChange={handleRadiusChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          >
            <option value={1}>1 km</option>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filters.radius} km
          </span>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h4>
          
          {/* Location Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'city', label: '🏙️ Cities', description: 'Major urban areas' },
                { value: 'town', label: '🏘️ Towns', description: 'Smaller urban areas' },
                { value: 'village', label: '🏡 Villages', description: 'Rural communities' }
              ].map(type => (
                <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.locationType?.includes(type.value as any) || false}
                    onChange={(e) => {
                      const currentTypes = filters.locationType || [];
                      const newTypes = e.target.checked
                        ? [...currentTypes, type.value as any]
                        : currentTypes.filter(t => t !== type.value);
                      handleFilterChange('locationType', newTypes.length > 0 ? newTypes : undefined);
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.country || filters.region || filters.city || filters.coordinates) && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Active Location Filters</h4>
            <button
              onClick={clearLocationFilters}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.country && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🌍 {filters.country}
                <button
                  onClick={() => handleFilterChange('country', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.region && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🗺️ {filters.region}
                <button
                  onClick={() => handleFilterChange('region', undefined)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.city && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                🏙️ {filters.city}
                <button
                  onClick={() => handleFilterChange('city', undefined)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.coordinates && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                📍 Custom Location
                <button
                  onClick={() => handleFilterChange('coordinates', undefined)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Searching within {filters.radius} km radius
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilters;
