/**
 * Map Service - Deep integration with GeocodingService and postal codes database
 * Provides comprehensive location-based mapping functionality
 */

import { GeocodingService } from './geocodingService';
import { GeographicCoordinates } from '../types/location';

export interface MapLocation {
  id: string;
  name: string;
  coordinates: GeographicCoordinates;
  postalCode?: string;
  country: string;
  region?: string;
  district?: string;
  type: 'search' | 'nearby' | 'listing' | 'user';
  distance?: number; // in kilometers
  relevanceScore?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface NearbySearchOptions {
  center: GeographicCoordinates;
  radiusKm: number;
  countries?: string[];
  maxResults?: number;
  includeDistance?: boolean;
}

export interface MapSearchResult {
  locations: MapLocation[];
  center: GeographicCoordinates;
  bounds: MapBounds;
  totalFound: number;
}

export class MapService {
  private static cache = new Map<string, MapSearchResult>();
  private static readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for locations around a center point using postal codes database
   */
  static async searchNearbyLocations(options: NearbySearchOptions): Promise<MapSearchResult> {
    const {
      center,
      radiusKm,
      countries = ['DE', 'IT', 'ES', 'FR'],
      maxResults = 50,
      includeDistance = true
    } = options;

    const cacheKey = `nearby:${center.lat},${center.lng}:${radiusKm}:${countries.join(',')}:${maxResults}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const allLocations: MapLocation[] = [];

      // Search each country
      for (const country of countries) {
        const response = await fetch(
          `/api/locations/nearby?lat=${center.lat}&lng=${center.lng}&radius=${radiusKm}&country=${country}&limit=${Math.ceil(maxResults / countries.length)}`
        );

        if (response.ok) {
          const data = await response.json();
          const countryLocations: MapLocation[] = data.results.map((result: any) => ({
            id: `${result.country}-${result.postalCode}-${result.id}`,
            name: result.name,
            coordinates: result.coordinates,
            postalCode: result.postalCode,
            country: result.country,
            region: result.region,
            district: result.district,
            type: 'nearby' as const,
            distance: includeDistance ? this.calculateDistance(center, result.coordinates) : undefined,
            relevanceScore: result.relevanceScore
          }));

          allLocations.push(...countryLocations);
        }
      }

      // Sort by distance and limit results
      const sortedLocations = allLocations
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, maxResults);

      // Calculate bounds
      const bounds = this.calculateBounds([center, ...sortedLocations.map(l => l.coordinates)]);

      const result: MapSearchResult = {
        locations: sortedLocations,
        center,
        bounds,
        totalFound: allLocations.length
      };

      // Cache result
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TIMEOUT);

      return result;
    } catch (error) {
      console.error('Nearby locations search failed:', error);
      return {
        locations: [],
        center,
        bounds: this.calculateBounds([center]),
        totalFound: 0
      };
    }
  }

  /**
   * Geocode a location and get nearby postal codes
   */
  static async geocodeWithNearby(
    locationName: string,
    radiusKm: number = 25,
    maxNearby: number = 20
  ): Promise<{ main: MapLocation | null; nearby: MapLocation[]; bounds: MapBounds }> {
    try {
      // First geocode the main location
      const geocodingResult = await GeocodingService.geocode(locationName);
      
      if (!geocodingResult) {
        return {
          main: null,
          nearby: [],
          bounds: { north: 0, south: 0, east: 0, west: 0 }
        };
      }

      const mainLocation: MapLocation = {
        id: `main-${locationName}`,
        name: geocodingResult.hierarchy.city,
        coordinates: geocodingResult.coordinates,
        country: geocodingResult.hierarchy.countryCode,
        region: geocodingResult.hierarchy.region,
        district: geocodingResult.hierarchy.district,
        type: 'search'
      };

      // Get nearby locations
      const nearbyResult = await this.searchNearbyLocations({
        center: geocodingResult.coordinates,
        radiusKm,
        maxResults: maxNearby,
        includeDistance: true
      });

      // Calculate bounds including main location
      const allCoordinates = [
        geocodingResult.coordinates,
        ...nearbyResult.locations.map(l => l.coordinates)
      ];
      const bounds = this.calculateBounds(allCoordinates);

      return {
        main: mainLocation,
        nearby: nearbyResult.locations,
        bounds
      };
    } catch (error) {
      console.error('Geocode with nearby failed:', error);
      return {
        main: null,
        nearby: [],
        bounds: { north: 0, south: 0, east: 0, west: 0 }
      };
    }
  }

  /**
   * Reverse geocode coordinates to find nearest postal code
   */
  static async reverseGeocode(coordinates: GeographicCoordinates): Promise<MapLocation | null> {
    try {
      const nearbyResult = await this.searchNearbyLocations({
        center: coordinates,
        radiusKm: 5, // Small radius for reverse geocoding
        maxResults: 1,
        includeDistance: true
      });

      if (nearbyResult.locations.length > 0) {
        const location = nearbyResult.locations[0];
        return {
          ...location,
          type: 'search'
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Get optimal map zoom level based on radius
   */
  static getOptimalZoom(radiusKm: number): number {
    if (radiusKm <= 1) return 15;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 25) return 11;
    if (radiusKm <= 50) return 10;
    if (radiusKm <= 100) return 9;
    return 8;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: GeographicCoordinates, coord2: GeographicCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bounds for a set of coordinates
   */
  static calculateBounds(coordinates: GeographicCoordinates[]): MapBounds {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = coordinates[0].lat;
    let south = coordinates[0].lat;
    let east = coordinates[0].lng;
    let west = coordinates[0].lng;

    coordinates.forEach(coord => {
      north = Math.max(north, coord.lat);
      south = Math.min(south, coord.lat);
      east = Math.max(east, coord.lng);
      west = Math.min(west, coord.lng);
    });

    // Add padding (10% of the range)
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get country flag emoji
   */
  static getCountryFlag(countryCode: string): string {
    const flags: Record<string, string> = {
      'DE': '🇩🇪',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'FR': '🇫🇷'
    };
    return flags[countryCode] || '🌍';
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
