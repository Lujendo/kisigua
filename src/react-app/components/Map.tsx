import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapService, MapLocation } from '../services/mapService';


// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMarker {
  position: [number, number];
  title: string;
  description?: string;
  isMain?: boolean;
  postalCode?: string;
  country?: string;
  distance?: number;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  searchLocation?: { lat: number; lng: number };
  searchRadius?: number; // in kilometers
  onMapClick?: (lat: number, lng: number) => void;
  // Enhanced features
  showNearbyLocations?: boolean;
  nearbyRadius?: number;
  enableReverseGeocode?: boolean;

  countries?: string[];
  onLocationFound?: (location: MapLocation) => void;
}

const Map: React.FC<MapProps> = ({
  center,
  zoom = 13,
  height = '400px',
  markers = [],
  onMarkerClick,
  className = '',
  searchLocation,
  searchRadius,
  onMapClick,
  showNearbyLocations = false,
  nearbyRadius = 25,
  enableReverseGeocode = false,

  countries = ['DE', 'IT', 'ES', 'FR'],
  onLocationFound
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);

  // State for nearby locations
  const [nearbyLocations, setNearbyLocations] = useState<MapLocation[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Helper function to create nearby location icons
  const createNearbyLocationIcon = (location: MapLocation) => {
    const countryColors: Record<string, string> = {
      'DE': 'bg-yellow-500',
      'IT': 'bg-green-500',
      'ES': 'bg-red-500',
      'FR': 'bg-blue-500'
    };

    const color = countryColors[location.country] || 'bg-gray-500';

    return L.divIcon({
      className: 'nearby-location-marker',
      html: `
        <div class="relative">
          <div class="w-4 h-4 ${color} rounded-full border border-white shadow-md flex items-center justify-center">
            <div class="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -16]
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icons
    const createCustomIcon = (isMain: boolean = false) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="${isMain ? 'bg-green-600' : 'bg-blue-600'} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            ${isMain ? '<div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>' : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    };



    // Add markers
    markers.forEach((markerData) => {
      const marker = L.marker(markerData.position, {
        icon: createCustomIcon(markerData.isMain)
      }).addTo(map);

      // Add popup
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900 mb-1">${markerData.title}</h3>
          ${markerData.description ? `<p class="text-sm text-gray-600">${markerData.description}</p>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);

      // Add click handler
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(markerData));
      }

      markersRef.current.push(marker);
    });

    // If there's a main marker, open its popup
    const mainMarkerIndex = markers.findIndex(m => m.isMain);
    if (mainMarkerIndex !== -1) {
      const mainMarkerInstance = markersRef.current[mainMarkerIndex];
      if (mainMarkerInstance) {
        mainMarkerInstance.openPopup();
      }
    }

    // Add search location circle if provided
    let searchCircle: L.Circle | null = null;
    let searchMarker: L.Marker | null = null;

    if (searchLocation && searchRadius) {
      // Add search center marker
      const searchIcon = L.divIcon({
        className: 'search-location-marker',
        html: `
          <div class="relative">
            <div class="bg-red-500 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      searchMarker = L.marker([searchLocation.lat, searchLocation.lng], {
        icon: searchIcon
      }).addTo(map);

      searchMarker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-red-600 mb-1">Search Center</h3>
          <p class="text-sm text-gray-600">Searching within ${searchRadius} km</p>
        </div>
      `);

      // Add search radius circle
      searchCircle = L.circle([searchLocation.lat, searchLocation.lng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.1,
        radius: searchRadius * 1000, // Convert km to meters
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);

      // Center map on search location
      map.setView([searchLocation.lat, searchLocation.lng], Math.max(zoom, 12));
    }

    // Enhanced map click handler with reverse geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Call original click handler
      if (onMapClick) {
        onMapClick(lat, lng);
      }

      // Reverse geocode if enabled
      if (enableReverseGeocode) {
        try {
          const location = await MapService.reverseGeocode({ lat, lng });
          if (location && onLocationFound) {
            onLocationFound(location);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
      }
    });

    // Cleanup function
    return () => {
      if (searchCircle) {
        searchCircle.remove();
      }
      if (searchMarker) {
        searchMarker.remove();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, [center[0], center[1], zoom, markers.length, searchLocation?.lat, searchLocation?.lng, searchRadius]); // Optimize dependencies

  // Load nearby locations when enabled
  useEffect(() => {
    if (!showNearbyLocations || !searchLocation || !mapInstanceRef.current) return;

    const loadNearbyLocations = async () => {
      setIsLoadingNearby(true);
      try {
        const result = await MapService.searchNearbyLocations({
          center: searchLocation,
          radiusKm: nearbyRadius,
          countries,
          maxResults: 50,
          includeDistance: true
        });

        setNearbyLocations(result.locations);

        // Clear existing nearby markers
        nearbyMarkersRef.current.forEach(marker => marker.remove());
        nearbyMarkersRef.current = [];

        // Add nearby location markers
        result.locations.forEach((location) => {
          const marker = L.marker([location.coordinates.lat, location.coordinates.lng], {
            icon: createNearbyLocationIcon(location)
          }).addTo(mapInstanceRef.current!);

          // Enhanced popup with postal code info
          const popupContent = `
            <div class="p-3 min-w-48">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">${MapService.getCountryFlag(location.country)}</span>
                <h3 class="font-semibold text-gray-900">${location.name}</h3>
              </div>
              ${location.postalCode ? `<p class="text-sm text-blue-600 font-medium mb-1">📮 ${location.postalCode}</p>` : ''}
              ${location.region ? `<p class="text-xs text-gray-600 mb-1">📍 ${location.region}${location.district ? `, ${location.district}` : ''}</p>` : ''}
              ${location.distance ? `<p class="text-xs text-green-600 font-medium">📏 ${MapService.formatDistance(location.distance)} away</p>` : ''}
            </div>
          `;
          marker.bindPopup(popupContent);

          // Add click handler
          marker.on('click', () => {
            if (onLocationFound) {
              onLocationFound(location);
            }
          });

          nearbyMarkersRef.current.push(marker);
        });

      } catch (error) {
        console.error('Failed to load nearby locations:', error);
      } finally {
        setIsLoadingNearby(false);
      }
    };

    loadNearbyLocations();
  }, [showNearbyLocations, searchLocation?.lat, searchLocation?.lng, nearbyRadius, countries.join(',')]);

  // Cleanup nearby markers
  useEffect(() => {
    return () => {
      nearbyMarkersRef.current.forEach(marker => marker.remove());
      nearbyMarkersRef.current = [];
    };
  }, []);

  // Update map view when center changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden shadow-sm border border-gray-200"
      />
      
      {/* Map Controls */}
      <div className="absolute top-2 right-2 flex flex-col space-y-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView(center, zoom);
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-sm transition-colors"
          title="Reset view"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.zoomIn();
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-sm transition-colors"
          title="Zoom in"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.zoomOut();
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-sm transition-colors"
          title="Zoom out"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Enhanced Map Legend */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-700">Main Location</span>
            </div>
            {markers.some(m => !m.isMain) && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Listings</span>
              </div>
            )}
          </div>

          {/* Nearby locations legend */}
          {showNearbyLocations && nearbyLocations.length > 0 && (
            <div className="border-t border-gray-200 pt-2">
              <div className="text-xs text-gray-500 mb-1">Postal Codes:</div>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">🇩🇪</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">🇮🇹</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">🇪🇸</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">🇫🇷</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoadingNearby && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full"></div>
              <span>Loading postal codes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
