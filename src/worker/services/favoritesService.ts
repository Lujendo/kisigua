// import { D1Database } from '@cloudflare/workers-types';
type D1Database = any;

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  listingCount?: number;
}

export interface FavoriteWithListing {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    thumbnail?: string;
    priceType: string;
    price?: number;
    tags: string[];
    createdBy: string;
    createdAt: string;
    isVerified: boolean;
    isFeatured: boolean;
    views: number;
  };
}

export class FavoritesService {
  constructor(private db: D1Database) {}

  async addToFavorites(userId: string, listingId: string): Promise<Favorite> {
    try {
      // Check if already favorited
      const existing = await this.db.prepare(
        'SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?'
      ).bind(userId, listingId).first();

      if (existing) {
        throw new Error('Listing already in favorites');
      }

      // Add to favorites
      const stmt = this.db.prepare(`
        INSERT INTO favorites (user_id, listing_id)
        VALUES (?, ?)
        RETURNING *
      `);
      
      const result = await stmt.bind(userId, listingId).first();
      
      if (!result) {
        throw new Error('Failed to add to favorites');
      }

      return {
        id: result.id as string,
        userId: result.user_id as string,
        listingId: result.listing_id as string,
        createdAt: result.created_at as string,
        updatedAt: result.updated_at as string,
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId: string, listingId: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        'DELETE FROM favorites WHERE user_id = ? AND listing_id = ?'
      );
      
      const result = await stmt.bind(userId, listingId).run();
      return result.success;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getUserFavorites(userId: string): Promise<FavoriteWithListing[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          f.id,
          f.user_id,
          f.listing_id,
          f.created_at,
          l.id as listing_id,
          l.title,
          l.description,
          l.category,
          l.location,
          l.city,
          l.country,
          l.latitude,
          l.longitude,
          l.images,
          l.thumbnail,
          l.price_type,
          l.price,
          l.tags,
          l.created_by,
          l.created_at as listing_created_at,
          l.is_verified,
          l.is_featured,
          l.views
        FROM favorites f
        JOIN listings l ON f.listing_id = l.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `);
      
      const result = await stmt.bind(userId).all();
      
      return result.results?.map((row: any) => ({
        id: row.id as string,
        userId: row.user_id as string,
        listingId: row.listing_id as string,
        createdAt: row.created_at as string,
        listing: {
          id: row.listing_id as string,
          title: row.title as string,
          description: row.description as string,
          category: row.category as string,
          location: row.location as string,
          city: row.city as string,
          country: row.country as string,
          latitude: row.latitude as number,
          longitude: row.longitude as number,
          images: row.images ? JSON.parse(row.images as string) : [],
          thumbnail: row.thumbnail as string,
          priceType: row.price_type as string,
          price: row.price as number,
          tags: row.tags ? JSON.parse(row.tags as string) : [],
          createdBy: row.created_by as string,
          createdAt: row.listing_created_at as string,
          isVerified: Boolean(row.is_verified),
          isFeatured: Boolean(row.is_featured),
          views: row.views as number || 0,
        }
      })) || [];
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }

  async isListingFavorited(userId: string, listingId: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(
        'SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?'
      ).bind(userId, listingId).first();
      
      return !!result;
    } catch (error) {
      console.error('Error checking if listing is favorited:', error);
      return false;
    }
  }

  async createCollection(userId: string, name: string, description?: string, color?: string, isPublic?: boolean): Promise<FavoriteCollection> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO favorite_collections (user_id, name, description, color, is_public)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
      `);
      
      const result = await stmt.bind(
        userId,
        name,
        description || null,
        color || '#10B981',
        isPublic || false
      ).first();
      
      if (!result) {
        throw new Error('Failed to create collection');
      }

      return {
        id: result.id as string,
        userId: result.user_id as string,
        name: result.name as string,
        description: result.description as string,
        color: result.color as string,
        isPublic: Boolean(result.is_public),
        createdAt: result.created_at as string,
        updatedAt: result.updated_at as string,
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async getUserCollections(userId: string): Promise<FavoriteCollection[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          fc.*,
          COUNT(cl.listing_id) as listing_count
        FROM favorite_collections fc
        LEFT JOIN collection_listings cl ON fc.id = cl.collection_id
        WHERE fc.user_id = ?
        GROUP BY fc.id
        ORDER BY fc.created_at DESC
      `);
      
      const result = await stmt.bind(userId).all();
      
      return result.results?.map((row: any) => ({
        id: row.id as string,
        userId: row.user_id as string,
        name: row.name as string,
        description: row.description as string,
        color: row.color as string,
        isPublic: Boolean(row.is_public),
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        listingCount: row.listing_count as number || 0,
      })) || [];
    } catch (error) {
      console.error('Error getting user collections:', error);
      throw error;
    }
  }

  async addToCollection(collectionId: string, listingId: string): Promise<boolean> {
    try {
      // Check if already in collection
      const existing = await this.db.prepare(
        'SELECT id FROM collection_listings WHERE collection_id = ? AND listing_id = ?'
      ).bind(collectionId, listingId).first();

      if (existing) {
        return true; // Already in collection
      }

      const stmt = this.db.prepare(`
        INSERT INTO collection_listings (collection_id, listing_id)
        VALUES (?, ?)
      `);
      
      const result = await stmt.bind(collectionId, listingId).run();
      return result.success;
    } catch (error) {
      console.error('Error adding to collection:', error);
      throw error;
    }
  }

  async removeFromCollection(collectionId: string, listingId: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        'DELETE FROM collection_listings WHERE collection_id = ? AND listing_id = ?'
      );
      
      const result = await stmt.bind(collectionId, listingId).run();
      return result.success;
    } catch (error) {
      console.error('Error removing from collection:', error);
      throw error;
    }
  }

  async getFavoritesCount(userId: string): Promise<number> {
    try {
      const result = await this.db.prepare(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
      ).bind(userId).first();
      
      return (result?.count as number) || 0;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }
}
