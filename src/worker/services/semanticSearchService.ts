import { EmbeddingService } from './embeddingService';
import { DatabaseService } from './databaseService';
import { UserBehaviorService } from './userBehaviorService';
import { Env } from '../types/env';

export interface SemanticSearchQuery {
  query: string;
  limit?: number;
  category?: string;
  location?: {
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in kilometers
  };
  tags?: string[];
  minScore?: number; // minimum similarity score (0-1)
}

export interface SemanticSearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  location: any;
  tags: string[];
  images: string[];
  score: number; // similarity score
  relevanceScore: number; // combined score with other factors
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
}

export interface HybridSearchResult {
  semanticResults: SemanticSearchResult[];
  keywordResults: any[];
  combinedResults: SemanticSearchResult[];
  totalResults: number;
  searchTime: number;
}

export class SemanticSearchService {
  private embeddingService: EmbeddingService;
  private databaseService: DatabaseService;
  private userBehaviorService: UserBehaviorService;

  constructor(env: Env, databaseService: DatabaseService) {
    this.embeddingService = new EmbeddingService(env);
    this.databaseService = databaseService;
    this.userBehaviorService = new UserBehaviorService(databaseService);
  }

  /**
   * Initialize user behavior tracking tables
   */
  async initializeUserBehaviorTables(): Promise<void> {
    await this.userBehaviorService.initializeTables();
  }

  /**
   * Record search behavior for analytics and recommendations
   */
  async recordSearchBehavior(
    userId: string | null,
    searchQuery: string,
    searchType: 'semantic' | 'hybrid',
    resultsCount: number,
    searchFilters: any = {}
  ): Promise<void> {
    if (userId) {
      await this.userBehaviorService.recordSearch(
        userId,
        searchQuery,
        searchType,
        resultsCount,
        searchFilters
      );
    }
  }

  /**
   * Record user interaction with a listing
   */
  async recordListingInteraction(
    userId: string,
    listingId: string,
    interactionType: 'view' | 'favorite' | 'unfavorite' | 'contact' | 'share',
    durationSeconds?: number
  ): Promise<void> {
    await this.userBehaviorService.recordInteraction(
      userId,
      listingId,
      interactionType,
      durationSeconds
    );
  }

  /**
   * Perform semantic search using vector similarity
   */
  async semanticSearch(searchQuery: SemanticSearchQuery, userId?: string): Promise<SemanticSearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateEmbedding(searchQuery.query);
      
      // Build filter for metadata
      const filter: any = {};
      if (searchQuery.category) {
        filter.category = searchQuery.category;
      }
      
      // Search for similar vectors
      const vectorResults = await this.embeddingService.searchSimilar(
        queryEmbedding,
        searchQuery.limit || 20,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      // Filter by minimum score if specified
      const filteredResults = searchQuery.minScore 
        ? vectorResults.filter(result => result.score >= searchQuery.minScore!)
        : vectorResults;

      // Get full listing details from database
      const listingIds = filteredResults.map(result => result.metadata.listingId);
      const listings = await this.getListingsByIds(listingIds);

      // Combine vector results with listing data
      const semanticResults: SemanticSearchResult[] = filteredResults.map(vectorResult => {
        const listing = listings.find(l => l.id === vectorResult.metadata.listingId);
        if (!listing) return null;

        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          location: listing.location,
          tags: listing.tags || [],
          images: listing.images || [],
          score: vectorResult.score,
          relevanceScore: this.calculateRelevanceScore(vectorResult.score, listing, searchQuery),
          created_at: listing.created_at,
          updated_at: listing.updated_at,
          user_id: listing.user_id,
          is_active: listing.is_active
        };
      }).filter(Boolean) as SemanticSearchResult[];

      // Apply location filtering if specified
      const locationFilteredResults = searchQuery.location 
        ? this.filterByLocation(semanticResults, searchQuery.location)
        : semanticResults;

      // Apply tag filtering if specified
      const tagFilteredResults = searchQuery.tags && searchQuery.tags.length > 0
        ? this.filterByTags(locationFilteredResults, searchQuery.tags)
        : locationFilteredResults;

      // Sort by relevance score
      tagFilteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const searchTime = Date.now() - startTime;
      console.log(`✅ Semantic search completed in ${searchTime}ms, found ${tagFilteredResults.length} results`);

      // Record search behavior for analytics and recommendations
      if (userId) {
        await this.recordSearchBehavior(
          userId,
          searchQuery.query,
          'semantic',
          tagFilteredResults.length,
          {
            category: searchQuery.category,
            minScore: searchQuery.minScore,
            location: searchQuery.location,
            tags: searchQuery.tags
          }
        );
      }

      return tagFilteredResults;
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw error;
    }
  }

  /**
   * Perform hybrid search combining semantic and keyword search
   */
  async hybridSearch(searchQuery: SemanticSearchQuery, userId?: string): Promise<HybridSearchResult> {
    const startTime = Date.now();
    
    try {
      // Perform semantic search
      const semanticResults = await this.semanticSearch(searchQuery, userId);

      // Perform traditional keyword search
      const keywordResults = await this.keywordSearch(searchQuery);

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(semanticResults, keywordResults);

      const searchTime = Date.now() - startTime;

      // Record hybrid search behavior
      if (userId) {
        await this.recordSearchBehavior(
          userId,
          searchQuery.query,
          'hybrid',
          combinedResults.length,
          {
            category: searchQuery.category,
            minScore: searchQuery.minScore,
            location: searchQuery.location,
            tags: searchQuery.tags
          }
        );
      }

      return {
        semanticResults,
        keywordResults,
        combinedResults,
        totalResults: combinedResults.length,
        searchTime
      };
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  /**
   * Find similar listings to a given listing
   */
  async findSimilarListings(listingId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    try {
      // Get the listing details
      const listing = await this.getListingById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Create search query from listing content
      const searchText = this.embeddingService.createSearchableText(listing);
      
      // Perform semantic search
      const results = await this.semanticSearch({
        query: searchText,
        limit: limit + 1, // +1 to account for the original listing
        category: listing.category
      });

      // Filter out the original listing
      return results.filter(result => result.id !== listingId).slice(0, limit);
    } catch (error) {
      console.error('Error finding similar listings:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<SemanticSearchResult[]> {
    try {
      // Get user's search history and favorites
      const userPreferences = await this.getUserPreferences(userId);
      
      if (!userPreferences.searchTerms.length && !userPreferences.favoriteCategories.length) {
        // Return popular listings if no preferences
        return this.getPopularListings(limit);
      }

      // Create search query from user preferences
      const searchQuery = userPreferences.searchTerms.join(' ') + ' ' + 
                         userPreferences.favoriteCategories.join(' ');

      return this.semanticSearch({
        query: searchQuery,
        limit,
        minScore: 0.7 // Higher threshold for recommendations
      });
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate relevance score combining similarity score with other factors
   */
  private calculateRelevanceScore(
    similarityScore: number, 
    listing: any, 
    searchQuery: SemanticSearchQuery
  ): number {
    let relevanceScore = similarityScore;

    // Boost score for exact category match
    if (searchQuery.category && listing.category === searchQuery.category) {
      relevanceScore += 0.1;
    }

    // Boost score for tag matches
    if (searchQuery.tags && searchQuery.tags.length > 0) {
      const matchingTags = (listing.tags || []).filter((tag: string) => 
        searchQuery.tags!.some(searchTag => 
          tag.toLowerCase().includes(searchTag.toLowerCase())
        )
      );
      relevanceScore += (matchingTags.length / searchQuery.tags.length) * 0.1;
    }

    // Boost score for recent listings
    const daysSinceCreated = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      relevanceScore += 0.05;
    }

    // Ensure score doesn't exceed 1
    return Math.min(relevanceScore, 1);
  }

  /**
   * Filter results by location
   */
  private filterByLocation(results: SemanticSearchResult[], locationFilter: any): SemanticSearchResult[] {
    if (!locationFilter.latitude || !locationFilter.longitude || !locationFilter.radius) {
      return results;
    }

    return results.filter(result => {
      if (!result.location?.latitude || !result.location?.longitude) {
        return false;
      }

      const distance = this.calculateDistance(
        locationFilter.latitude,
        locationFilter.longitude,
        result.location.latitude,
        result.location.longitude
      );

      return distance <= locationFilter.radius;
    });
  }

  /**
   * Filter results by tags
   */
  private filterByTags(results: SemanticSearchResult[], tags: string[]): SemanticSearchResult[] {
    return results.filter(result => {
      return tags.some(tag => 
        result.tags.some(resultTag => 
          resultTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Perform traditional keyword search
   */
  private async keywordSearch(_searchQuery: SemanticSearchQuery): Promise<any[]> {
    // This would use the existing search functionality
    // For now, return empty array - will be implemented in hybrid search task
    return [];
  }

  /**
   * Combine semantic and keyword search results
   */
  private combineSearchResults(semanticResults: SemanticSearchResult[], _keywordResults: any[]): SemanticSearchResult[] {
    // Simple combination for now - prioritize semantic results
    // More sophisticated merging will be implemented in hybrid search task
    return semanticResults;
  }

  /**
   * Get listings by IDs
   */
  private async getListingsByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM listings WHERE id IN (${placeholders}) AND is_active = true`;

    const result = await (this.databaseService as any).db.prepare(query).bind(...ids).all();
    return result.results || [];
  }

  /**
   * Get listing by ID
   */
  private async getListingById(id: string): Promise<any> {
    const result = await (this.databaseService as any).db
      .prepare('SELECT * FROM listings WHERE id = ? AND is_active = true')
      .bind(id)
      .first();
    return result;
  }

  /**
   * Get user preferences for recommendations
   */
  private async getUserPreferences(userId: string): Promise<{searchTerms: string[], favoriteCategories: string[]}> {
    try {
      const preferences = await this.userBehaviorService.getUserPreferences(userId);
      return {
        searchTerms: preferences.searchTerms,
        favoriteCategories: preferences.favoriteCategories
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { searchTerms: [], favoriteCategories: [] };
    }
  }

  /**
   * Get popular listings
   */
  private async getPopularListings(limit: number): Promise<SemanticSearchResult[]> {
    try {
      const popularListingIds = await this.userBehaviorService.getPopularListings(limit);

      if (popularListingIds.length === 0) {
        // Fallback to recent listings if no popular ones
        const recentListings = await (this.databaseService as any).db.prepare(`
          SELECT * FROM listings
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT ?
        `).bind(limit).all();

        return (recentListings.results || []).map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          location: listing.location ? JSON.parse(listing.location) : null,
          tags: listing.tags ? JSON.parse(listing.tags) : [],
          images: listing.images ? JSON.parse(listing.images) : [],
          score: 0.8, // Default score for popular listings
          relevanceScore: 0.8,
          created_at: listing.created_at,
          updated_at: listing.updated_at,
          user_id: listing.user_id,
          is_active: listing.is_active
        }));
      }

      const listings = await this.getListingsByIds(popularListingIds);
      return listings.map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        location: listing.location ? JSON.parse(listing.location) : null,
        tags: listing.tags ? JSON.parse(listing.tags) : [],
        images: listing.images ? JSON.parse(listing.images) : [],
        score: 0.9, // High score for popular listings
        relevanceScore: 0.9,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
        user_id: listing.user_id,
        is_active: listing.is_active
      }));
    } catch (error) {
      console.error('Error getting popular listings:', error);
      return [];
    }
  }
}
