import { DatabaseService } from './databaseService';

export interface UserSearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  search_type: 'keyword' | 'semantic' | 'hybrid';
  results_count: number;
  clicked_listings: string[];
  search_filters: any;
  created_at: string;
}

export interface UserInteraction {
  id: string;
  user_id: string;
  listing_id: string;
  interaction_type: 'view' | 'favorite' | 'unfavorite' | 'contact' | 'share';
  duration_seconds?: number;
  created_at: string;
}

export interface UserPreferences {
  userId: string;
  searchTerms: string[];
  favoriteCategories: string[];
  preferredLocations: string[];
  interactionScore: number;
  lastUpdated: string;
}

export class UserBehaviorService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Initialize user behavior tables
   */
  async initializeTables(): Promise<void> {
    try {
      // Create user search history table
      await (this.databaseService as any).db.prepare(`
        CREATE TABLE IF NOT EXISTS user_search_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          search_query TEXT NOT NULL,
          search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'semantic', 'hybrid')),
          results_count INTEGER DEFAULT 0,
          clicked_listings TEXT, -- JSON array of listing IDs
          search_filters TEXT, -- JSON object of applied filters
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create user interactions table
      await (this.databaseService as any).db.prepare(`
        CREATE TABLE IF NOT EXISTS user_interactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          listing_id TEXT NOT NULL,
          interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'unfavorite', 'contact', 'share')),
          duration_seconds INTEGER,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes for better performance
      await (this.databaseService as any).db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON user_search_history(user_id)
      `).run();

      await (this.databaseService as any).db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON user_search_history(created_at)
      `).run();

      await (this.databaseService as any).db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON user_interactions(user_id)
      `).run();

      await (this.databaseService as any).db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_interactions_listing_id ON user_interactions(listing_id)
      `).run();

      console.log('✅ User behavior tables initialized');
    } catch (error) {
      console.error('Error initializing user behavior tables:', error);
      throw error;
    }
  }

  /**
   * Record a search query
   */
  async recordSearch(
    userId: string,
    searchQuery: string,
    searchType: 'keyword' | 'semantic' | 'hybrid',
    resultsCount: number,
    searchFilters: any = {}
  ): Promise<void> {
    try {
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await (this.databaseService as any).db.prepare(`
        INSERT INTO user_search_history (
          id, user_id, search_query, search_type, results_count, search_filters
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        searchId,
        userId,
        searchQuery,
        searchType,
        resultsCount,
        JSON.stringify(searchFilters)
      ).run();

      console.log(`✅ Recorded search for user ${userId}: "${searchQuery}"`);
    } catch (error) {
      console.error('Error recording search:', error);
      // Don't throw - this shouldn't break the search functionality
    }
  }

  /**
   * Record a user interaction with a listing
   */
  async recordInteraction(
    userId: string,
    listingId: string,
    interactionType: 'view' | 'favorite' | 'unfavorite' | 'contact' | 'share',
    durationSeconds?: number
  ): Promise<void> {
    try {
      const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await (this.databaseService as any).db.prepare(`
        INSERT INTO user_interactions (
          id, user_id, listing_id, interaction_type, duration_seconds
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        interactionId,
        userId,
        listingId,
        interactionType,
        durationSeconds || null
      ).run();

      console.log(`✅ Recorded ${interactionType} interaction for user ${userId} on listing ${listingId}`);
    } catch (error) {
      console.error('Error recording interaction:', error);
      // Don't throw - this shouldn't break the main functionality
    }
  }

  /**
   * Update search history with clicked listings
   */
  async updateSearchWithClicks(searchId: string, clickedListings: string[]): Promise<void> {
    try {
      await (this.databaseService as any).db.prepare(`
        UPDATE user_search_history 
        SET clicked_listings = ? 
        WHERE id = ?
      `).bind(
        JSON.stringify(clickedListings),
        searchId
      ).run();

      console.log(`✅ Updated search ${searchId} with ${clickedListings.length} clicks`);
    } catch (error) {
      console.error('Error updating search clicks:', error);
    }
  }

  /**
   * Get user preferences based on behavior analysis
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Get recent search terms (last 30 days)
      const searchHistory = await (this.databaseService as any).db.prepare(`
        SELECT search_query, search_filters, created_at
        FROM user_search_history
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userId).all();

      // Get favorite categories from interactions
      const categoryInteractions = await (this.databaseService as any).db.prepare(`
        SELECT l.category, COUNT(*) as interaction_count
        FROM user_interactions ui
        JOIN listings l ON ui.listing_id = l.id
        WHERE ui.user_id = ? AND ui.interaction_type IN ('view', 'favorite', 'contact')
        AND ui.created_at > datetime('now', '-60 days')
        GROUP BY l.category
        ORDER BY interaction_count DESC
        LIMIT 10
      `).bind(userId).all();

      // Get preferred locations from interactions
      const locationInteractions = await (this.databaseService as any).db.prepare(`
        SELECT 
          JSON_EXTRACT(l.location, '$.city') as city,
          COUNT(*) as interaction_count
        FROM user_interactions ui
        JOIN listings l ON ui.listing_id = l.id
        WHERE ui.user_id = ? AND ui.interaction_type IN ('view', 'favorite', 'contact')
        AND ui.created_at > datetime('now', '-60 days')
        AND JSON_EXTRACT(l.location, '$.city') IS NOT NULL
        GROUP BY JSON_EXTRACT(l.location, '$.city')
        ORDER BY interaction_count DESC
        LIMIT 5
      `).bind(userId).all();

      // Extract search terms
      const searchTerms = searchHistory.results
        ? searchHistory.results
            .map((search: any) => search.search_query)
            .filter((query: string) => query && query.length > 2)
            .slice(0, 20)
        : [];

      // Extract favorite categories
      const favoriteCategories = categoryInteractions.results
        ? categoryInteractions.results
            .map((cat: any) => cat.category)
            .filter(Boolean)
        : [];

      // Extract preferred locations
      const preferredLocations = locationInteractions.results
        ? locationInteractions.results
            .map((loc: any) => loc.city)
            .filter(Boolean)
        : [];

      // Calculate interaction score based on activity level
      const totalInteractions = await (this.databaseService as any).db.prepare(`
        SELECT COUNT(*) as count
        FROM user_interactions
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
      `).bind(userId).first();

      const interactionScore = totalInteractions ? Math.min(totalInteractions.count / 10, 1) : 0;

      return {
        userId,
        searchTerms,
        favoriteCategories,
        preferredLocations,
        interactionScore,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        userId,
        searchTerms: [],
        favoriteCategories: [],
        preferredLocations: [],
        interactionScore: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get trending search terms
   */
  async getTrendingSearchTerms(limit: number = 10): Promise<string[]> {
    try {
      const trending = await (this.databaseService as any).db.prepare(`
        SELECT search_query, COUNT(*) as search_count
        FROM user_search_history
        WHERE created_at > datetime('now', '-7 days')
        AND LENGTH(search_query) > 2
        GROUP BY LOWER(search_query)
        ORDER BY search_count DESC
        LIMIT ?
      `).bind(limit).all();

      return trending.results
        ? trending.results.map((item: any) => item.search_query)
        : [];
    } catch (error) {
      console.error('Error getting trending search terms:', error);
      return [];
    }
  }

  /**
   * Get popular listings based on interactions
   */
  async getPopularListings(limit: number = 10): Promise<string[]> {
    try {
      const popular = await (this.databaseService as any).db.prepare(`
        SELECT listing_id, COUNT(*) as interaction_count
        FROM user_interactions
        WHERE created_at > datetime('now', '-7 days')
        AND interaction_type IN ('view', 'favorite', 'contact')
        GROUP BY listing_id
        ORDER BY interaction_count DESC
        LIMIT ?
      `).bind(limit).all();

      return popular.results
        ? popular.results.map((item: any) => item.listing_id)
        : [];
    } catch (error) {
      console.error('Error getting popular listings:', error);
      return [];
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<any> {
    try {
      const summary = await (this.databaseService as any).db.prepare(`
        SELECT 
          COUNT(DISTINCT DATE(created_at)) as active_days,
          COUNT(*) as total_searches,
          AVG(results_count) as avg_results_per_search
        FROM user_search_history
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
      `).bind(userId).first();

      const interactions = await (this.databaseService as any).db.prepare(`
        SELECT 
          interaction_type,
          COUNT(*) as count
        FROM user_interactions
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        GROUP BY interaction_type
      `).bind(userId).all();

      return {
        activeDays: summary?.active_days || 0,
        totalSearches: summary?.total_searches || 0,
        avgResultsPerSearch: summary?.avg_results_per_search || 0,
        interactions: interactions.results || []
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      return {
        activeDays: 0,
        totalSearches: 0,
        avgResultsPerSearch: 0,
        interactions: []
      };
    }
  }
}
