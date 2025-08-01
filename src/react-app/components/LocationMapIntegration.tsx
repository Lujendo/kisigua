/**
 * Location Map Integration Demo
 * Showcases deep integration between GeocodingService, MapService, and Map components
 */

import React, { useState, useCallback } from 'react';
import Map from './Map';
import EnhancedLocationSearch from './search/EnhancedLocationSearch';
import { MapService, MapLocation } from '../services/mapService';
import { GeographicCoordinates } from '../types/location';

interface LocationMapIntegrationProps {
  className?: string;
  initialLocation?: GeographicCoordinates;
  showControls?: boolean;
}

const LocationMapIntegration: React.FC<LocationMapIntegrationProps> = ({
  className = "",
  initialLocation = { lat: 48.7758, lng: 9.1829 }, // Stuttgart, Germany
  showControls = true
}) => {
  // State management
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLocation.lat, initialLocation.lng]);
  const [mapZoom, setMapZoom] = useState(10);
  const [searchLocation, setSearchLocation] = useState<GeographicCoordinates | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<MapLocation[]>([]);
  const [showNearbyLocations, setShowNearbyLocations] = useState(true);
  const [enableReverseGeocode, setEnableReverseGeocode] = useState(true);
  const [countries] = useState(['DE', 'IT', 'ES', 'FR']);
  const [isLoading, setIsLoading] = useState(false);

  // Handle location selection from search
  const handleLocationSelect = useCallback(async (location: MapLocation) => {
    console.log('🎯 Location selected:', location);
    
    setSelectedLocation(location);
    setSearchLocation(location.coordinates);
    setMapCenter([location.coordinates.lat, location.coordinates.lng]);
    setMapZoom(MapService.getOptimalZoom(searchRadius));
    
    // Load nearby locations
    if (showNearbyLocations) {
      setIsLoading(true);
      try {
        const result = await MapService.searchNearbyLocations({
          center: location.coordinates,
          radiusKm: searchRadius,
          countries,
          maxResults: 50,
          includeDistance: true
        });
        
        setNearbyLocations(result.locations);
        console.log(`📍 Found ${result.locations.length} nearby locations`);
      } catch (error) {
        console.error('Failed to load nearby locations:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchRadius, showNearbyLocations, countries]);

  // Handle map click with reverse geocoding
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    console.log(`🗺️ Map clicked at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    
    if (enableReverseGeocode) {
      setIsLoading(true);
      try {
        const location = await MapService.reverseGeocode({ lat, lng });
        if (location) {
          console.log('🔍 Reverse geocoded:', location);
          handleLocationSelect(location);
        } else {
          // No postal code found, just set search location
          setSearchLocation({ lat, lng });
          setMapCenter([lat, lng]);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        setSearchLocation({ lat, lng });
        setMapCenter([lat, lng]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchLocation({ lat, lng });
      setMapCenter([lat, lng]);
    }
  }, [enableReverseGeocode, handleLocationSelect]);

  // Handle radius change
  const handleRadiusChange = useCallback((newRadius: number) => {
    setSearchRadius(newRadius);
    setMapZoom(MapService.getOptimalZoom(newRadius));
    
    // Reload nearby locations if we have a search location
    if (searchLocation && showNearbyLocations) {
      handleLocationSelect({
        id: 'current',
        name: selectedLocation?.name || 'Current Location',
        coordinates: searchLocation,
        country: selectedLocation?.country || 'DE',
        type: 'search'
      });
    }
  }, [searchLocation, selectedLocation, showNearbyLocations, handleLocationSelect]);

  // Create map markers from nearby locations
  const mapMarkers = nearbyLocations.slice(0, 20).map(location => ({
    position: [location.coordinates.lat, location.coordinates.lng] as [number, number],
    title: location.name,
    description: `${MapService.getCountryFlag(location.country)} ${location.postalCode || ''} ${location.region || ''}${location.distance ? ` • ${MapService.formatDistance(location.distance)}` : ''}`,
    isMain: false,
    postalCode: location.postalCode,
    country: location.country,
    distance: location.distance
  }));

  // Add main location marker if selected
  if (selectedLocation) {
    mapMarkers.unshift({
      position: [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng],
      title: selectedLocation.name,
      description: `${MapService.getCountryFlag(selectedLocation.country)} Main Location`,
      isMain: true,
      postalCode: selectedLocation.postalCode,
      country: selectedLocation.country,
      distance: undefined
    });
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhanced Location Search */}
      <div className="space-y-3">
        <EnhancedLocationSearch
          placeholder="Search cities, postal codes across Europe..."
          onLocationSelect={handleLocationSelect}
          onCoordinatesSelect={(coords) => setSearchLocation(coords)}
          countries={countries}
          showNearbyCount={true}
          nearbyRadius={searchRadius}
          showPostalCodes={true}
          className="w-full"
        />
        
        {/* Controls */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
            {/* Search Radius */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Radius:</label>
              <select
                value={searchRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
            
            {/* Toggle Controls */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showNearbyLocations}
                onChange={(e) => setShowNearbyLocations(e.target.checked)}
                className="rounded"
              />
              <span>Show postal codes</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={enableReverseGeocode}
                onChange={(e) => setEnableReverseGeocode(e.target.checked)}
                className="rounded"
              />
              <span>Click to search</span>
            </label>
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Map */}
      <div className="relative">
        <Map
          center={mapCenter}
          zoom={mapZoom}
          height="500px"
          markers={mapMarkers}
          searchLocation={searchLocation || undefined}
          searchRadius={searchRadius}
          onMapClick={handleMapClick}
          showNearbyLocations={showNearbyLocations}
          nearbyRadius={searchRadius}
          enableReverseGeocode={enableReverseGeocode}

          countries={countries}
          onLocationFound={handleLocationSelect}
          className="rounded-lg overflow-hidden shadow-lg"
        />
      </div>

      {/* Location Info Panel */}
      {selectedLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span>{MapService.getCountryFlag(selectedLocation.country)}</span>
                <span>{selectedLocation.name}</span>
              </h3>
              {selectedLocation.postalCode && (
                <p className="text-sm text-blue-600 font-medium">📮 {selectedLocation.postalCode}</p>
              )}
              <p className="text-sm text-gray-600">
                📍 {selectedLocation.region}
                {selectedLocation.district && `, ${selectedLocation.district}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {nearbyLocations.length} postal codes
              </div>
              <div className="text-xs text-gray-500">
                within {searchRadius}km
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMapIntegration;
