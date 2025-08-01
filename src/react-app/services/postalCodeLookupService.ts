/**
 * Postal Code Lookup Service
 * Provides bidirectional postal code ↔ city lookup for listing creation/editing
 */

export interface PostalCodeLookupResult {
  postalCode: string;
  city: string;
  region: string;
  district?: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  displayName: string; // Formatted display name with hierarchy
}

export interface CityLookupResult {
  city: string;
  postalCodes: string[];
  region: string;
  district?: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  displayName: string; // Formatted display name with hierarchy
}

export interface RegionLookupResult {
  region: string;
  cities: string[];
  postalCodeRanges: string[];
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
}

export class PostalCodeLookupService {
  private static cache = new Map<string, PostalCodeLookupResult[] | CityLookupResult[]>();
  private static regionCache = new Map<string, RegionLookupResult[]>();
  private static cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Lookup city information by postal code
   */
  static async lookupByPostalCode(
    postalCode: string,
    countryCode: string = 'DE'
  ): Promise<PostalCodeLookupResult[]> {
    const cacheKey = `postal:${postalCode}:${countryCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey) as PostalCodeLookupResult[];
      return cached;
    }

    try {
      const response = await fetch(
        `/api/locations/postal-lookup?postal_code=${encodeURIComponent(postalCode)}&country=${countryCode}&limit=8`
      );

      if (!response.ok) {
        throw new Error(`Postal code lookup failed: ${response.status}`);
      }

      const data = await response.json();
      const results: PostalCodeLookupResult[] = data.results?.map((item: any) => ({
        postalCode: item.postalCode,
        city: item.city || item.name, // Use new city field or fallback to name
        region: item.region || item.admin_name1 || '',
        district: item.district || item.admin_name2,
        country: this.getCountryName(item.countryCode || item.country),
        countryCode: item.countryCode || item.country,
        coordinates: item.coordinates,
        confidence: item.confidence || item.relevanceScore || 0.9,
        displayName: this.formatDisplayName(
          item.city || item.name,
          item.region || item.admin_name1,
          item.postalCode,
          this.getCountryName(item.countryCode || item.country)
        )
      })) || [];

      // Cache results
      this.cache.set(cacheKey, results);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return results;
    } catch (error) {
      console.error('Postal code lookup error:', error);
      return [];
    }
  }

  /**
   * Lookup postal codes by city name
   */
  static async lookupByCity(
    cityName: string,
    countryCode: string = 'DE'
  ): Promise<CityLookupResult[]> {
    const cacheKey = `city:${cityName.toLowerCase()}:${countryCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey) as CityLookupResult[];
      return cached;
    }

    try {
      const response = await fetch(
        `/api/locations/city-lookup?city=${encodeURIComponent(cityName)}&country=${countryCode}&limit=8`
      );

      if (!response.ok) {
        throw new Error(`City lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Group results by city to collect all postal codes
      const cityGroups = new Map<string, any[]>();
      data.results?.forEach((item: any) => {
        const cityKey = `${item.name}:${item.region || ''}`;
        if (!cityGroups.has(cityKey)) {
          cityGroups.set(cityKey, []);
        }
        cityGroups.get(cityKey)!.push(item);
      });

      const results: CityLookupResult[] = Array.from(cityGroups.entries()).map(([_cityKey, items]) => {
        const firstItem = items[0];
        const postalCodes = [...new Set(items.map(item => item.postalCode))].sort();
        const region = firstItem.region || firstItem.admin_name1 || '';

        return {
          city: firstItem.city || firstItem.name, // Use new city field or fallback
          postalCodes,
          region,
          district: firstItem.district || firstItem.admin_name2,
          country: this.getCountryName(firstItem.countryCode || firstItem.country),
          countryCode: firstItem.countryCode || firstItem.country,
          coordinates: firstItem.coordinates,
          confidence: firstItem.confidence || firstItem.relevanceScore || 0.8,
          displayName: this.formatDisplayName(
            firstItem.city || firstItem.name,
            region,
            postalCodes[0],
            this.getCountryName(firstItem.countryCode || firstItem.country)
          )
        };
      });

      // Cache results
      this.cache.set(cacheKey, results);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return results;
    } catch (error) {
      console.error('City lookup error:', error);
      return [];
    }
  }

  /**
   * Lookup cities by region/state
   */
  static async lookupByRegion(
    regionName: string,
    countryCode: string = 'DE'
  ): Promise<RegionLookupResult[]> {
    const cacheKey = `region:${regionName.toLowerCase()}:${countryCode}`;

    // Check cache first
    if (this.regionCache.has(cacheKey)) {
      const cached = this.regionCache.get(cacheKey)!;
      return cached;
    }

    try {
      const response = await fetch(
        `/api/locations/region-lookup?region=${encodeURIComponent(regionName)}&country=${countryCode}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`Region lookup failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Region lookup response:', data); // Debug logging

      // If no results, try a fallback approach using city lookup
      if (!data.results || data.results.length === 0) {
        console.log('No direct region results, trying fallback city search');
        const cityResponse = await fetch(
          `/api/locations/city-lookup?city=${encodeURIComponent(regionName)}&country=${countryCode}&limit=50`
        );

        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          console.log('Fallback city lookup response:', cityData);

          // Filter city results that have the region name in their region field
          const filteredResults = cityData.results?.filter((item: any) =>
            item.region && item.region.toLowerCase().includes(regionName.toLowerCase())
          ) || [];

          if (filteredResults.length > 0) {
            data.results = filteredResults;
          }
        }
      }

      // Group by region to get all cities and postal codes
      const regionGroups = new Map<string, any[]>();
      data.results?.forEach((item: any) => {
        const regionKey = item.region || 'Unknown';
        if (!regionGroups.has(regionKey)) {
          regionGroups.set(regionKey, []);
        }
        regionGroups.get(regionKey)!.push(item);
      });

      const results: RegionLookupResult[] = Array.from(regionGroups.entries()).map(([region, items]) => {
        const cities = [...new Set(items.map(item => item.name))].sort();
        const postalCodes = [...new Set(items.map(item => item.postalCode))].sort();
        const firstItem = items[0];

        // Calculate center coordinates (average of all locations)
        const avgLat = items.reduce((sum, item) => sum + item.coordinates.lat, 0) / items.length;
        const avgLng = items.reduce((sum, item) => sum + item.coordinates.lng, 0) / items.length;

        return {
          region,
          cities,
          postalCodeRanges: this.getPostalCodeRanges(postalCodes),
          country: this.getCountryName(firstItem.country || countryCode),
          countryCode: firstItem.country || countryCode,
          coordinates: { lat: avgLat, lng: avgLng },
          confidence: 0.9
        };
      });

      // Cache results
      this.regionCache.set(cacheKey, results);
      setTimeout(() => this.regionCache.delete(cacheKey), this.cacheTimeout);

      return results;
    } catch (error) {
      console.error('Region lookup error:', error);
      return [];
    }
  }

  /**
   * Smart lookup that tries to determine if input is postal code or city
   */
  static async smartLookup(
    input: string,
    countryCode: string = 'DE'
  ): Promise<{ postalResults: PostalCodeLookupResult[]; cityResults: CityLookupResult[] }> {
    const trimmedInput = input.trim();
    
    // Determine if input looks like a postal code (numbers/alphanumeric)
    const isPostalCode = /^[0-9A-Z\-\s]{3,10}$/i.test(trimmedInput);
    
    if (isPostalCode) {
      // Prioritize postal code lookup
      const postalResults = await this.lookupByPostalCode(trimmedInput, countryCode);
      const cityResults = await this.lookupByCity(trimmedInput, countryCode);
      return { postalResults, cityResults };
    } else {
      // Prioritize city lookup
      const cityResults = await this.lookupByCity(trimmedInput, countryCode);
      const postalResults = await this.lookupByPostalCode(trimmedInput, countryCode);
      return { postalResults, cityResults };
    }
  }

  /**
   * Validate postal code format for different countries
   */
  static validatePostalCode(postalCode: string, countryCode: string): boolean {
    const patterns: Record<string, RegExp> = {
      'DE': /^[0-9]{5}$/, // German postal codes: 5 digits
      'IT': /^[0-9]{5}$/, // Italian postal codes: 5 digits
      'ES': /^[0-9]{5}$/, // Spanish postal codes: 5 digits
      'FR': /^[0-9]{5}$/, // French postal codes: 5 digits
      'AT': /^[0-9]{4}$/, // Austrian postal codes: 4 digits
      'CH': /^[0-9]{4}$/, // Swiss postal codes: 4 digits
      'NL': /^[0-9]{4}\s?[A-Z]{2}$/i, // Dutch postal codes: 4 digits + 2 letters
      'BE': /^[0-9]{4}$/, // Belgian postal codes: 4 digits
      'US': /^[0-9]{5}(-[0-9]{4})?$/, // US ZIP codes: 5 digits or 5+4
      'GB': /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i, // UK postcodes
    };

    const pattern = patterns[countryCode];
    return pattern ? pattern.test(postalCode.trim()) : true; // Default to valid if no pattern
  }

  /**
   * Format postal code according to country conventions
   */
  static formatPostalCode(postalCode: string, countryCode: string): string {
    const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();
    
    switch (countryCode) {
      case 'NL':
        // Dutch format: 1234 AB
        if (cleaned.length === 6) {
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        }
        break;
      case 'GB':
        // UK format: Various patterns with space
        if (cleaned.length >= 5) {
          const lastThree = cleaned.slice(-3);
          const firstPart = cleaned.slice(0, -3);
          return `${firstPart} ${lastThree}`;
        }
        break;
      case 'US':
        // US format: 12345 or 12345-6789
        if (cleaned.length === 9) {
          return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        }
        break;
    }
    
    return cleaned;
  }

  /**
   * Format display name with hierarchy
   */
  private static formatDisplayName(city: string, region: string, postalCode: string, country: string): string {
    const parts = [city];

    if (postalCode) {
      parts.unshift(postalCode);
    }

    if (region && region !== city) {
      parts.push(region);
    }

    // Don't add country for common European countries to keep it clean
    if (!['Germany', 'Italy', 'Spain', 'France'].includes(country)) {
      parts.push(country);
    }

    return parts.join(', ');
  }

  /**
   * Get postal code ranges from array of postal codes
   */
  private static getPostalCodeRanges(postalCodes: string[]): string[] {
    if (postalCodes.length === 0) return [];
    if (postalCodes.length <= 3) return postalCodes;

    // For large sets, show first few and range
    const sorted = postalCodes.sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (sorted.length > 10) {
      return [`${first} - ${last}`, `(${sorted.length} codes)`];
    }

    return sorted.slice(0, 5).concat(sorted.length > 5 ? [`+${sorted.length - 5} more`] : []);
  }

  /**
   * Get country name from country code
   */
  private static getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'DE': 'Germany',
      'IT': 'Italy',
      'ES': 'Spain',
      'FR': 'France',
      'AT': 'Austria',
      'CH': 'Switzerland',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'US': 'United States',
      'GB': 'United Kingdom'
    };
    return countryNames[countryCode] || countryCode;
  }

  /**
   * Get country code from country name
   */
  static getCountryCode(countryName: string): string {
    const countryCodes: Record<string, string> = {
      'Germany': 'DE',
      'Italy': 'IT',
      'Spain': 'ES',
      'France': 'FR',
      'Austria': 'AT',
      'Switzerland': 'CH',
      'Netherlands': 'NL',
      'Belgium': 'BE',
      'United States': 'US',
      'United Kingdom': 'GB'
    };
    return countryCodes[countryName] || 'DE';
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.regionCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[]; regionSize: number; regionKeys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      regionSize: this.regionCache.size,
      regionKeys: Array.from(this.regionCache.keys())
    };
  }
}
