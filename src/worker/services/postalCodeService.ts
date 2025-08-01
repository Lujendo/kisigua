/**
 * Postal Code Service - Database-driven location search
 * Optimized for global coverage with country filtering and fast search
 */

export interface PostalCodeRecord {
  id: number;
  country_code: string;
  postal_code: string;
  place_name: string;
  admin_name1?: string; // State/Region
  admin_code1?: string;
  admin_name2?: string; // District/County
  admin_code2?: string;
  admin_name3?: string; // Municipality
  admin_code3?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
  updated_at: string;
}

export interface LocationSearchOptions {
  country?: string;
  maxResults?: number;
  includeCoordinates?: boolean;
  fuzzySearch?: boolean;
}

export interface LocationSearchResult {
  id: number;
  name: string;
  displayName: string;
  postalCode: string;
  country: string;
  region?: string;
  district?: string;
  municipality?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  relevanceScore: number;
}

export class PostalCodeService {
  private db: D1Database;
  private cache = new Map<string, LocationSearchResult[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(database: D1Database) {
    this.db = database;
  }

  /**
   * Optimized search locations by query with country filtering
   */
  async searchLocations(
    query: string,
    options: LocationSearchOptions = {}
  ): Promise<LocationSearchResult[]> {
    const {
      country = 'DE',
      maxResults = 20,
      fuzzySearch = true
    } = options;

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    // Check cache first
    const cacheKey = `${country}:${normalizedQuery}:${maxResults}:${fuzzySearch}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Optimized single query approach
      let results: LocationSearchResult[] = [];

      // Check if query looks like a postal code (digits only or starts with digits)
      const isPostalCodeQuery = /^\d+/.test(normalizedQuery);

      if (isPostalCodeQuery) {
        // Prioritize postal code search
        const postalResults = await this.searchByPostalCode(normalizedQuery, country, maxResults);
        results.push(...postalResults);

        // If we have enough results, return early
        if (results.length >= maxResults) {
          results = results.slice(0, maxResults);
          this.cache.set(cacheKey, results);
          setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
          return results;
        }
      }

      // Combined place name search (exact + fuzzy in one query)
      const placeResults = await this.searchByPlaceNameOptimized(normalizedQuery, country, maxResults - results.length, fuzzySearch);
      results.push(...placeResults.filter(r => !results.some(existing => existing.id === r.id)));

      // Sort by relevance score (descending)
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Limit results
      results = results.slice(0, maxResults);

      // Cache results
      this.cache.set(cacheKey, results);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return results;
    } catch (error) {
      console.error('PostalCodeService search error:', error);
      return [];
    }
  }

  /**
   * Optimized place name search combining exact and fuzzy in one query
   */
  private async searchByPlaceNameOptimized(
    placeName: string,
    country: string,
    limit: number,
    includeFuzzy: boolean = true
  ): Promise<LocationSearchResult[]> {
    const stmt = this.db.prepare(`
      SELECT *,
        CASE
          WHEN LOWER(place_name) = ? THEN 1.0
          WHEN LOWER(place_name) LIKE ? THEN 0.9
          WHEN LOWER(place_name) LIKE ? THEN 0.7
          ELSE 0.5
        END as relevance_score
      FROM postal_codes
      WHERE country_code = ?
        AND (
          LOWER(place_name) = ? OR
          LOWER(place_name) LIKE ? OR
          ${includeFuzzy ? 'LOWER(place_name) LIKE ? OR' : ''}
          LOWER(admin_name1) LIKE ? OR
          LOWER(admin_name2) LIKE ?
        )
      ORDER BY relevance_score DESC, place_name
      LIMIT ?
    `);

    const exactMatch = placeName;
    const startsWithPattern = `${placeName}%`;
    const containsPattern = `%${placeName}%`;

    const params = [
      exactMatch, startsWithPattern, containsPattern, // For CASE statement
      country, // WHERE country_code
      exactMatch, startsWithPattern, // Exact and starts with
      ...(includeFuzzy ? [containsPattern] : []), // Contains (fuzzy)
      containsPattern, containsPattern, // Admin names
      limit
    ];

    const result = await stmt.bind(...params).all();

    return result.results?.map(record => {
      const r = record as unknown as PostalCodeRecord & { relevance_score: number };
      return this.transformRecord(r, r.relevance_score);
    }) || [];
  }

  /**
   * Search by exact postal code
   */
  private async searchByPostalCode(
    postalCode: string,
    country: string,
    limit: number
  ): Promise<LocationSearchResult[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM postal_codes 
      WHERE country_code = ? AND postal_code = ?
      ORDER BY place_name
      LIMIT ?
    `);

    const result = await stmt.bind(country, postalCode, limit).all();
    
    return result.results?.map(record => this.transformRecord(record as unknown as PostalCodeRecord, 1.0)) || [];
  }

  /**
   * Search by place name (exact or fuzzy) - kept for compatibility
   */
  // @ts-ignore - kept for compatibility
  private async searchByPlaceName(
    placeName: string,
    country: string,
    limit: number,
    exact: boolean = false
  ): Promise<LocationSearchResult[]> {
    let sql: string;
    let params: any[];

    if (exact) {
      sql = `
        SELECT * FROM postal_codes 
        WHERE country_code = ? AND LOWER(place_name) = ?
        ORDER BY place_name
        LIMIT ?
      `;
      params = [country, placeName, limit];
    } else {
      sql = `
        SELECT * FROM postal_codes 
        WHERE country_code = ? AND LOWER(place_name) LIKE ?
        ORDER BY 
          CASE 
            WHEN LOWER(place_name) LIKE ? THEN 1  -- Starts with
            ELSE 2                                 -- Contains
          END,
          place_name
        LIMIT ?
      `;
      const likePattern = `%${placeName}%`;
      const startsWithPattern = `${placeName}%`;
      params = [country, likePattern, startsWithPattern, limit];
    }

    const stmt = this.db.prepare(sql);
    const result = await stmt.bind(...params).all();
    
    const relevanceScore = exact ? 0.9 : 0.7;
    return result.results?.map(record => this.transformRecord(record as unknown as PostalCodeRecord, relevanceScore)) || [];
  }

  /**
   * Full-text search using FTS5 (kept for future use)
   */
  // @ts-ignore - kept for future use
  private async fullTextSearch(
    query: string,
    country: string,
    limit: number
  ): Promise<LocationSearchResult[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT pc.* FROM postal_codes pc
        JOIN postal_codes_fts fts ON pc.id = fts.rowid
        WHERE pc.country_code = ? AND postal_codes_fts MATCH ?
        ORDER BY bm25(postal_codes_fts)
        LIMIT ?
      `);

      const result = await stmt.bind(country, `"${query}"*`, limit).all();

      return result.results?.map(record => this.transformRecord(record as unknown as PostalCodeRecord, 0.6)) || [];
    } catch (error) {
      console.error('FTS search error:', error);
      // Fallback to simple LIKE search
      return this.searchByPlaceNameOptimized(query, country, limit, false);
    }
  }

  /**
   * Transform database record to search result
   */
  private transformRecord(record: PostalCodeRecord, baseRelevance: number): LocationSearchResult {
    const displayParts = [record.place_name];
    
    if (record.admin_name2 && record.admin_name2 !== record.place_name) {
      displayParts.push(record.admin_name2);
    }
    if (record.admin_name1) {
      displayParts.push(record.admin_name1);
    }

    return {
      id: record.id,
      name: record.place_name,
      displayName: displayParts.join(', '),
      postalCode: record.postal_code,
      country: record.country_code,
      region: record.admin_name1,
      district: record.admin_name2,
      municipality: record.admin_name3,
      coordinates: {
        lat: record.latitude,
        lng: record.longitude
      },
      relevanceScore: baseRelevance
    };
  }

  /**
   * Get location by postal code (exact match)
   */
  async getByPostalCode(postalCode: string, country: string = 'DE'): Promise<LocationSearchResult | null> {
    const results = await this.searchByPostalCode(postalCode, country, 1);
    return results[0] || null;
  }

  /**
   * Get nearby locations by coordinates
   */
  async getNearbyLocations(
    lat: number,
    lng: number,
    radiusKm: number = 25,
    country: string = 'DE',
    limit: number = 20
  ): Promise<LocationSearchResult[]> {
    // Using Haversine formula approximation for SQLite
    const stmt = this.db.prepare(`
      SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
      FROM postal_codes
      WHERE country_code = ?
      HAVING distance <= ?
      ORDER BY distance
      LIMIT ?
    `);

    const result = await stmt.bind(lat, lng, lat, country, radiusKm, limit).all();
    
    return result.results?.map(record => this.transformRecord(record as unknown as PostalCodeRecord, 0.8)) || [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
