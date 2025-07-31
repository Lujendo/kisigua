// Enhanced location data structures for hierarchical geographic information
export interface GeographicCoordinates {
  lat: number;
  lng: number;
}

export interface LocationHierarchy {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., "DE", "AT", "CH")
  region: string; // State/Province (e.g., "Baden-Württemberg", "Bayern")
  district?: string; // Landkreis/County (e.g., "Reutlingen", "München")
  city: string;
  suburb?: string; // Stadtteil/Neighborhood
  village?: string; // Small towns/villages
  postalCode?: string;
  coordinates: GeographicCoordinates;
  population?: number;
  locationType: 'country' | 'region' | 'district' | 'city' | 'town' | 'village' | 'suburb';
}

export interface LocationSearchResult {
  name: string;
  displayName: string; // Formatted display name with hierarchy
  hierarchy: LocationHierarchy;
  coordinates: GeographicCoordinates;
  relevanceScore?: number;
}

export interface LocationFilters {
  country?: string;
  countryCode?: string;
  region?: string;
  district?: string;
  city?: string;
  radius: number; // in kilometers
  coordinates?: GeographicCoordinates;
  locationType?: LocationHierarchy['locationType'][];
}

// Enhanced static location database entry
export interface StaticLocationEntry {
  name: string;
  nameVariants?: string[]; // Alternative names (e.g., "München" for "Munich")
  coordinates: GeographicCoordinates;
  country: string;
  countryCode: string;
  region: string;
  district?: string;
  population?: number;
  locationType: LocationHierarchy['locationType'];
  postalCodes?: string[]; // Common postal codes for the area
}

// Geocoding service interfaces
export interface GeocodingResult {
  coordinates: GeographicCoordinates;
  hierarchy: LocationHierarchy;
  source: 'static' | 'nominatim' | 'cache';
  confidence: number; // 0-1 score
}

export interface GeocodingOptions {
  preferredCountry?: string;
  maxResults?: number;
  includeMinorLocations?: boolean;
  useCache?: boolean;
}

// Legacy Location interface for backward compatibility
export interface Location {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    country: string;
    region?: string; // Added region support
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images?: string[];
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  price?: number;
  priceType?: 'free' | 'paid' | 'donation';
  tags: string[];
  createdBy: string;
  createdAt: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  lastViewed?: string;
  views?: number;
  favorites?: number;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  results: number;
}

// German administrative regions for reference
export const GERMAN_REGIONS = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hessen': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'Nordrhein-Westfalen': 'NW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH'
} as const;

export type GermanRegion = keyof typeof GERMAN_REGIONS;
