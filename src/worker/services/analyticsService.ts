export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  listingId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface PageViewEvent extends AnalyticsEvent {
  eventType: 'page_view';
  page: string;
  title?: string;
}

export interface SearchEvent extends AnalyticsEvent {
  eventType: 'search';
  query?: string;
  filters?: Record<string, any>;
  resultsCount: number;
}

export interface ListingEvent extends AnalyticsEvent {
  eventType: 'listing_view' | 'listing_favorite' | 'listing_contact' | 'listing_share';
  listingId: string;
}

export interface UserEvent extends AnalyticsEvent {
  eventType: 'user_register' | 'user_login' | 'user_logout' | 'subscription_change';
  userId: string;
}

export interface AnalyticsStats {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSearches: number;
  totalListingViews: number;
  topPages: Array<{ page: string; views: number }>;
  topSearches: Array<{ query: string; count: number }>;
  topListings: Array<{ listingId: string; views: number }>;
  userGrowth: Array<{ date: string; newUsers: number }>;
  geographicData: Array<{ country: string; visitors: number }>;
}

export class AnalyticsService {
  private analyticsEngine?: AnalyticsEngineDataset;
  private database?: D1Database;

  constructor(analyticsEngine?: AnalyticsEngineDataset, database?: D1Database) {
    this.analyticsEngine = analyticsEngine;
    this.database = database;
  }

  // Track page view
  async trackPageView(
    page: string,
    request: Request,
    userId?: string,
    sessionId?: string,
    title?: string
  ): Promise<void> {
    const event: PageViewEvent = {
      eventType: 'page_view',
      page,
      title,
      userId,
      sessionId,
      ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
      referrer: request.headers.get('Referer') || undefined,
      timestamp: Date.now()
    };

    await this.trackEvent(event);
  }

  // Track search
  async trackSearch(
    query: string | undefined,
    filters: Record<string, any> | undefined,
    resultsCount: number,
    request: Request,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    const event: SearchEvent = {
      eventType: 'search',
      query,
      filters,
      resultsCount,
      userId,
      sessionId,
      ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
      timestamp: Date.now()
    };

    await this.trackEvent(event);
  }

  // Track listing interaction
  async trackListingEvent(
    eventType: 'listing_view' | 'listing_favorite' | 'listing_contact' | 'listing_share',
    listingId: string,
    request: Request,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    const event: ListingEvent = {
      eventType,
      listingId,
      userId,
      sessionId,
      ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
      timestamp: Date.now()
    };

    await this.trackEvent(event);
  }

  // Track user events
  async trackUserEvent(
    eventType: 'user_register' | 'user_login' | 'user_logout' | 'subscription_change',
    userId: string,
    request: Request,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: UserEvent = {
      eventType,
      userId,
      sessionId,
      metadata,
      ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
      timestamp: Date.now()
    };

    await this.trackEvent(event);
  }

  // Generic event tracking
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Track in Cloudflare Analytics Engine if available
      if (this.analyticsEngine) {
        await this.trackInAnalyticsEngine(event);
      }

      // Also store in D1 database for detailed analytics
      if (this.database) {
        await this.storeInDatabase(event);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  // Track in Cloudflare Analytics Engine
  private async trackInAnalyticsEngine(event: AnalyticsEvent): Promise<void> {
    if (!this.analyticsEngine) return;

    const dataPoint = {
      blobs: [
        event.eventType,
        event.userId || '',
        event.listingId || '',
        event.sessionId || '',
        event.ipAddress || '',
        event.userAgent || '',
        event.referrer || ''
      ],
      doubles: [
        event.timestamp
      ],
      indexes: [
        event.eventType
      ]
    };

    this.analyticsEngine.writeDataPoint(dataPoint);
  }

  // Store in D1 database
  private async storeInDatabase(event: AnalyticsEvent): Promise<void> {
    if (!this.database) return;

    const stmt = this.database.prepare(`
      INSERT INTO analytics_events (
        event_type, user_id, listing_id, session_id, ip_address,
        user_agent, referrer, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    await stmt.bind(
      event.eventType,
      event.userId || null,
      event.listingId || null,
      event.sessionId || null,
      event.ipAddress || null,
      event.userAgent || null,
      event.referrer || null,
      event.metadata ? JSON.stringify(event.metadata) : null
    ).run();
  }

  // Get analytics stats
  async getAnalyticsStats(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<AnalyticsStats> {
    if (!this.database) {
      return this.getEmptyStats();
    }

    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Build base query conditions
      let whereClause = 'WHERE created_at BETWEEN ? AND ?';
      const params = [startDateStr, endDateStr];

      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }

      // Total page views
      const pageViewsStmt = this.database.prepare(`
        SELECT COUNT(*) as count FROM analytics_events 
        ${whereClause} AND event_type = 'page_view'
      `);
      const pageViewsResult = await pageViewsStmt.bind(...params).first() as { count: number };

      // Unique visitors (based on IP address)
      const uniqueVisitorsStmt = this.database.prepare(`
        SELECT COUNT(DISTINCT ip_address) as count FROM analytics_events 
        ${whereClause} AND ip_address IS NOT NULL
      `);
      const uniqueVisitorsResult = await uniqueVisitorsStmt.bind(...params).first() as { count: number };

      // Total searches
      const searchesStmt = this.database.prepare(`
        SELECT COUNT(*) as count FROM analytics_events 
        ${whereClause} AND event_type = 'search'
      `);
      const searchesResult = await searchesStmt.bind(...params).first() as { count: number };

      // Total listing views
      const listingViewsStmt = this.database.prepare(`
        SELECT COUNT(*) as count FROM analytics_events 
        ${whereClause} AND event_type = 'listing_view'
      `);
      const listingViewsResult = await listingViewsStmt.bind(...params).first() as { count: number };

      // Top pages
      const topPagesStmt = this.database.prepare(`
        SELECT JSON_EXTRACT(metadata, '$.page') as page, COUNT(*) as views
        FROM analytics_events 
        ${whereClause} AND event_type = 'page_view' AND metadata IS NOT NULL
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `);
      const topPagesResult = await topPagesStmt.bind(...params).all();

      // Top searches
      const topSearchesStmt = this.database.prepare(`
        SELECT JSON_EXTRACT(metadata, '$.query') as query, COUNT(*) as count
        FROM analytics_events 
        ${whereClause} AND event_type = 'search' AND metadata IS NOT NULL
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `);
      const topSearchesResult = await topSearchesStmt.bind(...params).all();

      // Top listings
      const topListingsStmt = this.database.prepare(`
        SELECT listing_id, COUNT(*) as views
        FROM analytics_events 
        ${whereClause} AND event_type = 'listing_view' AND listing_id IS NOT NULL
        GROUP BY listing_id
        ORDER BY views DESC
        LIMIT 10
      `);
      const topListingsResult = await topListingsStmt.bind(...params).all();

      // User growth (daily new registrations)
      const userGrowthStmt = this.database.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as newUsers
        FROM analytics_events 
        ${whereClause} AND event_type = 'user_register'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);
      const userGrowthResult = await userGrowthStmt.bind(...params).all();

      // Geographic data (by country from IP)
      const geoStmt = this.database.prepare(`
        SELECT 
          COALESCE(JSON_EXTRACT(metadata, '$.country'), 'Unknown') as country,
          COUNT(DISTINCT ip_address) as visitors
        FROM analytics_events 
        ${whereClause} AND ip_address IS NOT NULL
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 20
      `);
      const geoResult = await geoStmt.bind(...params).all();

      return {
        totalPageViews: pageViewsResult.count,
        uniqueVisitors: uniqueVisitorsResult.count,
        totalSearches: searchesResult.count,
        totalListingViews: listingViewsResult.count,
        topPages: topPagesResult.results.map((row: any) => ({
          page: row.page || 'Unknown',
          views: row.views
        })),
        topSearches: topSearchesResult.results.map((row: any) => ({
          query: row.query || 'Unknown',
          count: row.count
        })),
        topListings: topListingsResult.results.map((row: any) => ({
          listingId: row.listing_id,
          views: row.views
        })),
        userGrowth: userGrowthResult.results.map((row: any) => ({
          date: row.date,
          newUsers: row.newUsers
        })),
        geographicData: geoResult.results.map((row: any) => ({
          country: row.country,
          visitors: row.visitors
        }))
      };
    } catch (error) {
      console.error('Analytics stats error:', error);
      return this.getEmptyStats();
    }
  }

  // Get real-time stats
  async getRealTimeStats(): Promise<{
    activeUsers: number;
    recentEvents: Array<{
      eventType: string;
      timestamp: number;
      userId?: string;
      listingId?: string;
    }>;
  }> {
    if (!this.database) {
      return { activeUsers: 0, recentEvents: [] };
    }

    try {
      // Active users in last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const activeUsersStmt = this.database.prepare(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM analytics_events 
        WHERE created_at > ? AND user_id IS NOT NULL
      `);
      const activeUsersResult = await activeUsersStmt.bind(fiveMinutesAgo).first() as { count: number };

      // Recent events
      const recentEventsStmt = this.database.prepare(`
        SELECT event_type, user_id, listing_id, created_at
        FROM analytics_events 
        ORDER BY created_at DESC
        LIMIT 50
      `);
      const recentEventsResult = await recentEventsStmt.all();

      return {
        activeUsers: activeUsersResult.count,
        recentEvents: recentEventsResult.results.map((row: any) => ({
          eventType: row.event_type,
          timestamp: new Date(row.created_at).getTime(),
          userId: row.user_id || undefined,
          listingId: row.listing_id || undefined
        }))
      };
    } catch (error) {
      console.error('Real-time stats error:', error);
      return { activeUsers: 0, recentEvents: [] };
    }
  }

  // Clean up old analytics data
  async cleanupOldData(olderThanDays: number = 90): Promise<number> {
    if (!this.database) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const stmt = this.database.prepare(`
        DELETE FROM analytics_events 
        WHERE created_at < ?
      `);
      
      const result = await stmt.bind(cutoffDate.toISOString()).run();
      return result.meta?.changes || 0;
    } catch (error) {
      console.error('Analytics cleanup error:', error);
      return 0;
    }
  }

  private getEmptyStats(): AnalyticsStats {
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalSearches: 0,
      totalListingViews: 0,
      topPages: [],
      topSearches: [],
      topListings: [],
      userGrowth: [],
      geographicData: []
    };
  }
}
