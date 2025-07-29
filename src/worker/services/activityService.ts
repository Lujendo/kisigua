// import { D1Database } from '@cloudflare/workers-types';
type D1Database = any;

export interface Activity {
  id: string;
  userId?: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export type ActivityType = 
  | 'user_registered'
  | 'user_login'
  | 'listing_created'
  | 'listing_updated'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_deleted'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'favorite_added'
  | 'favorite_removed'
  | 'collection_created';

export class ActivityService {
  constructor(private db: D1Database) {}

  async logActivity(
    actionType: ActivityType,
    description: string,
    userId?: string,
    entityType?: string,
    entityId?: string,
    metadata?: any
  ): Promise<Activity> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `);
      
      const result = await stmt.bind(
        userId || null,
        actionType,
        entityType || null,
        entityId || null,
        description,
        metadata ? JSON.stringify(metadata) : null
      ).first();
      
      if (!result) {
        throw new Error('Failed to log activity');
      }

      return {
        id: result.id as string,
        userId: result.user_id as string,
        actionType: result.action_type as string,
        entityType: result.entity_type as string,
        entityId: result.entity_id as string,
        description: result.description as string,
        metadata: result.metadata ? JSON.parse(result.metadata as string) : null,
        createdAt: result.created_at as string,
      };
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          a.*,
          u.email,
          u.first_name,
          u.last_name
        FROM activity_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
      `);
      
      const result = await stmt.bind(limit).all();
      
      return result.results?.map((row: any) => ({
        id: row.id as string,
        userId: row.user_id as string,
        actionType: row.action_type as string,
        entityType: row.entity_type as string,
        entityId: row.entity_id as string,
        description: row.description as string,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
        createdAt: row.created_at as string,
        user: row.email ? {
          email: row.email as string,
          firstName: row.first_name as string,
          lastName: row.last_name as string,
        } : undefined,
      })) || [];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  async getUserActivities(userId: string, limit: number = 50): Promise<Activity[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          a.*,
          u.email,
          u.first_name,
          u.last_name
        FROM activity_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ?
      `);
      
      const result = await stmt.bind(userId, limit).all();
      
      return result.results?.map((row: any) => ({
        id: row.id as string,
        userId: row.user_id as string,
        actionType: row.action_type as string,
        entityType: row.entity_type as string,
        entityId: row.entity_id as string,
        description: row.description as string,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
        createdAt: row.created_at as string,
        user: {
          email: row.email as string,
          firstName: row.first_name as string,
          lastName: row.last_name as string,
        },
      })) || [];
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getActivityStats(): Promise<{
    totalActivities: number;
    todayActivities: number;
    weekActivities: number;
    topActions: Array<{ actionType: string; count: number }>;
  }> {
    try {
      // Get total activities
      const totalResult = await this.db.prepare(
        'SELECT COUNT(*) as count FROM activity_log'
      ).first();

      // Get today's activities
      const todayResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM activity_log 
        WHERE date(created_at) = date('now')
      `).first();

      // Get this week's activities
      const weekResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM activity_log 
        WHERE created_at >= date('now', '-7 days')
      `).first();

      // Get top action types
      const topActionsResult = await this.db.prepare(`
        SELECT action_type, COUNT(*) as count
        FROM activity_log
        WHERE created_at >= date('now', '-30 days')
        GROUP BY action_type
        ORDER BY count DESC
        LIMIT 5
      `).all();

      return {
        totalActivities: (totalResult?.count as number) || 0,
        todayActivities: (todayResult?.count as number) || 0,
        weekActivities: (weekResult?.count as number) || 0,
        topActions: topActionsResult.results?.map((row: any) => ({
          actionType: row.action_type as string,
          count: row.count as number,
        })) || [],
      };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return {
        totalActivities: 0,
        todayActivities: 0,
        weekActivities: 0,
        topActions: [],
      };
    }
  }

  // Helper methods for common activities
  async logUserRegistration(userId: string, email: string): Promise<void> {
    await this.logActivity(
      'user_registered',
      `New user registered: ${email}`,
      userId,
      'user',
      userId,
      { email }
    );
  }

  async logListingCreated(userId: string, listingId: string, title: string): Promise<void> {
    await this.logActivity(
      'listing_created',
      `New listing created: ${title}`,
      userId,
      'listing',
      listingId,
      { title }
    );
  }

  async logListingApproved(adminUserId: string, listingId: string, title: string): Promise<void> {
    await this.logActivity(
      'listing_approved',
      `Listing approved: ${title}`,
      adminUserId,
      'listing',
      listingId,
      { title }
    );
  }

  async logCategoryCreated(adminUserId: string, categoryId: string, name: string): Promise<void> {
    await this.logActivity(
      'category_created',
      `New category created: ${name}`,
      adminUserId,
      'category',
      categoryId,
      { name }
    );
  }

  async logFavoriteAdded(userId: string, listingId: string, listingTitle: string): Promise<void> {
    await this.logActivity(
      'favorite_added',
      `Added to favorites: ${listingTitle}`,
      userId,
      'listing',
      listingId,
      { listingTitle }
    );
  }
}
