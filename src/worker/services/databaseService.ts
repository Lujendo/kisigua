import { User, UserRole } from '../types/auth';
import { Listing, CreateListingRequest, UpdateListingRequest, SearchQuery, SearchResult } from '../types/listings';
import { UserSubscription } from '../types/subscription';

export interface DatabaseUser extends Omit<User, 'password'> {
  password_hash: string;
}

export interface DatabaseListing extends Omit<Listing, 'location' | 'contactInfo' | 'operatingHours'> {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region?: string;
  country: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  operating_hours?: string; // JSON string
  is_organic: boolean;
  is_certified: boolean;
  certification_details?: string;
  price_range?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private db: D1Database;

  constructor(database: D1Database) {
    this.db = database;
  }

  // User operations
  async createUser(userData: {
    id: string;
    email: string;
    password_hash: string;
    role: UserRole;
    first_name: string;
    last_name: string;
  }): Promise<DatabaseUser> {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      userData.id,
      userData.email,
      userData.password_hash,
      userData.role,
      userData.first_name,
      userData.last_name
    ).run();

    return this.getUserById(userData.id) as Promise<DatabaseUser>;
  }

  async getUserById(userId: string): Promise<DatabaseUser | null> {
    const stmt = this.db.prepare(`
      SELECT
        id,
        email,
        password_hash,
        role,
        first_name as firstName,
        last_name as lastName,
        is_active as isActive,
        profile_image_url as profileImageUrl,
        created_at as createdAt,
        updated_at as updatedAt,
        last_login_at as lastLoginAt
      FROM users
      WHERE id = ?
    `);
    const result = await stmt.bind(userId).first();
    return result as DatabaseUser | null;
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    console.log(`getUserByEmail called for: ${email}`);
    const stmt = this.db.prepare(`
      SELECT
        id,
        email,
        password_hash,
        role,
        first_name as firstName,
        last_name as lastName,
        is_active as isActive,
        profile_image_url as profileImageUrl,
        created_at as createdAt,
        updated_at as updatedAt,
        last_login_at as lastLoginAt
      FROM users
      WHERE email = ?
    `);
    const result = await stmt.bind(email).first();
    console.log(`getUserByEmail result for ${email}:`, {
      found: !!result,
      id: result?.id,
      email: result?.email,
      password_hash: typeof result?.password_hash === 'string' ? result.password_hash.substring(0, 20) + '...' : result?.password_hash,
      updated_at: result?.updatedAt
    });
    return result as DatabaseUser | null;
  }

  async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`
      UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    await stmt.bind(...values, userId).run();
    return this.getUserById(userId);
  }

  async getAllUsers(): Promise<DatabaseUser[]> {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const result = await stmt.all();
    return result.results as unknown as DatabaseUser[];
  }

  async updateLastLogin(userId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    await stmt.bind(userId).run();
  }

  // Listing operations
  async createListing(listingData: CreateListingRequest & { id: string; user_id: string }): Promise<DatabaseListing> {
    // Transform category from API format (organic_farm) to database format (cat_organic_farm)
    const dbCategory = listingData.category.startsWith('cat_')
      ? listingData.category
      : `cat_${listingData.category}`;

    const stmt = this.db.prepare(`
      INSERT INTO listings (
        id, user_id, title, description, category, latitude, longitude,
        address, city, region, country, postal_code, contact_email, contact_phone,
        contact_website, is_organic, is_certified, certification_details,
        price_range, operating_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      listingData.id,
      listingData.user_id,
      listingData.title,
      listingData.description,
      dbCategory,
      listingData.location.latitude,
      listingData.location.longitude,
      listingData.location.address,
      listingData.location.city,
      listingData.location.region || null,
      listingData.location.country,
      listingData.location.postalCode || null,
      listingData.contactInfo.email || null,
      listingData.contactInfo.phone || null,
      listingData.contactInfo.website || null,
      listingData.isOrganic || false,
      listingData.isCertified || false,
      listingData.certificationDetails || null,
      listingData.priceRange || null,
      listingData.operatingHours ? JSON.stringify(listingData.operatingHours) : null
    ).run();

    // Add tags if provided
    if (listingData.tags && listingData.tags.length > 0) {
      await this.addListingTags(listingData.id, listingData.tags);
    }

    // Add images if provided
    if (listingData.images && listingData.images.length > 0) {
      await this.addListingImages(listingData.id, listingData.images);
    }

    return this.getListingById(listingData.id) as Promise<DatabaseListing>;
  }

  async getListingById(listingId: string): Promise<DatabaseListing | null> {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE id = ?');
    const result = await stmt.bind(listingId).first();
    return result as DatabaseListing | null;
  }

  async getFullListingById(listingId: string): Promise<Listing | null> {
    const dbListing = await this.getListingById(listingId);
    if (!dbListing) {
      return null;
    }
    return this.convertDatabaseListingToListing(dbListing);
  }

  async updateListing(listingId: string, updates: Partial<UpdateListingRequest>): Promise<DatabaseListing | null> {
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.title) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.category) {
      updateFields.push('category = ?');
      // Transform category from API format to database format
      const dbCategory = updates.category.startsWith('cat_')
        ? updates.category
        : `cat_${updates.category}`;
      values.push(dbCategory);
    }
    if (updates.location) {
      updateFields.push('latitude = ?', 'longitude = ?', 'address = ?', 'city = ?', 'country = ?');
      values.push(
        updates.location.latitude,
        updates.location.longitude,
        updates.location.address,
        updates.location.city,
        updates.location.country
      );
      if (updates.location.postalCode !== undefined) {
        updateFields.push('postal_code = ?');
        values.push(updates.location.postalCode);
      }
    }
    if (updates.contactInfo) {
      if (updates.contactInfo.email !== undefined) {
        updateFields.push('contact_email = ?');
        values.push(updates.contactInfo.email);
      }
      if (updates.contactInfo.phone !== undefined) {
        updateFields.push('contact_phone = ?');
        values.push(updates.contactInfo.phone);
      }
      if (updates.contactInfo.website !== undefined) {
        updateFields.push('contact_website = ?');
        values.push(updates.contactInfo.website);
      }
    }
    if (updates.isOrganic !== undefined) {
      updateFields.push('is_organic = ?');
      values.push(updates.isOrganic);
    }
    if (updates.isCertified !== undefined) {
      updateFields.push('is_certified = ?');
      values.push(updates.isCertified);
    }
    if (updates.certificationDetails !== undefined) {
      updateFields.push('certification_details = ?');
      values.push(updates.certificationDetails);
    }
    if (updates.priceRange !== undefined) {
      updateFields.push('price_range = ?');
      values.push(updates.priceRange);
    }
    if (updates.operatingHours !== undefined) {
      updateFields.push('operating_hours = ?');
      values.push(updates.operatingHours ? JSON.stringify(updates.operatingHours) : null);
    }
    if (updates.status) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }

    if (updateFields.length === 0) {
      return this.getListingById(listingId);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const stmt = this.db.prepare(`
      UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?
    `);

    await stmt.bind(...values, listingId).run();

    // Update tags if provided
    if (updates.tags) {
      await this.replaceListingTags(listingId, updates.tags);
    }

    // Update images if provided
    if (updates.images !== undefined) {
      await this.updateListingImages(listingId, updates.images);
    }

    return this.getListingById(listingId);
  }

  async deleteListing(listingId: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM listings WHERE id = ?');
    const result = await stmt.bind(listingId).run();
    return result.success && (result.meta?.changes || 0) > 0;
  }

  async searchListings(searchQuery: SearchQuery): Promise<SearchResult> {
    let sql = `
      SELECT DISTINCT l.* FROM listings l
      LEFT JOIN listing_tags lt ON l.id = lt.listing_id
      WHERE l.status = 'active'
    `;
    const params: any[] = [];

    // Add filters
    if (searchQuery.filters) {
      const { filters } = searchQuery;

      if (filters.category && filters.category.length > 0) {
        sql += ` AND l.category IN (${filters.category.map(() => '?').join(',')})`;
        // Transform category filters from API format to database format
        const dbCategories = filters.category.map(cat =>
          cat.startsWith('cat_') ? cat : `cat_${cat}`
        );
        params.push(...dbCategories);
      }

      if (filters.isOrganic !== undefined) {
        sql += ' AND l.is_organic = ?';
        params.push(filters.isOrganic);
      }

      if (filters.isCertified !== undefined) {
        sql += ' AND l.is_certified = ?';
        params.push(filters.isCertified);
      }

      if (filters.priceRange && filters.priceRange.length > 0) {
        sql += ` AND l.price_range IN (${filters.priceRange.map(() => '?').join(',')})`;
        params.push(...filters.priceRange);
      }

      if (filters.city) {
        sql += ' AND l.city LIKE ?';
        params.push(`%${filters.city}%`);
      }

      if (filters.country) {
        sql += ' AND l.country LIKE ?';
        params.push(`%${filters.country}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        sql += ` AND lt.tag IN (${filters.tags.map(() => '?').join(',')})`;
        params.push(...filters.tags);
      }
    }

    // Add full-text search
    if (searchQuery.query) {
      sql += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.address LIKE ?)';
      const searchTerm = `%${searchQuery.query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add sorting
    const sortBy = searchQuery.sortBy || 'created_at';
    const sortOrder = searchQuery.sortOrder || 'desc';
    
    switch (sortBy) {
      case 'views':
        sql += ` ORDER BY l.views ${sortOrder.toUpperCase()}`;
        break;
      case 'favorites':
        sql += ` ORDER BY l.favorites ${sortOrder.toUpperCase()}`;
        break;
      case 'created_at':
        sql += ` ORDER BY l.created_at ${sortOrder.toUpperCase()}`;
        break;
      default:
        sql += ` ORDER BY l.created_at DESC`;
    }

    // Add pagination
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const offset = (page - 1) * limit;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const result = await stmt.bind(...params).all();
    const listings = result.results as unknown as DatabaseListing[];

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT l.id) as total FROM listings l
      LEFT JOIN listing_tags lt ON l.id = lt.listing_id
      WHERE l.status = 'active'
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset

    if (searchQuery.filters || searchQuery.query) {
      // Rebuild count query with same filters
      countSql = sql.replace(/SELECT DISTINCT l\.\*/, 'SELECT COUNT(DISTINCT l.id) as total')
                    .replace(/ORDER BY.*$/, '')
                    .replace(/LIMIT.*$/, '');
    }

    const countStmt = this.db.prepare(countSql);
    const countResult = await countStmt.bind(...countParams).first() as { total: number };
    const total = countResult.total;

    // Convert listings with images
    const convertedListings = await Promise.all(
      listings.map(listing => this.convertDatabaseListingToListing(listing))
    );

    return {
      listings: convertedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: searchQuery.filters || {}
    };
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
    const result = await stmt.bind(userId).all();
    const listings = result.results as unknown as DatabaseListing[];

    // Convert listings with images
    const convertedListings = await Promise.all(
      listings.map(listing => this.convertDatabaseListingToListing(listing))
    );

    return convertedListings;
  }

  async incrementListingViews(listingId: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?');
    await stmt.bind(listingId).run();
  }

  // Tag operations
  async addListingTags(listingId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    const placeholders = tags.map(() => '(?, ?)').join(',');
    const stmt = this.db.prepare(`INSERT OR IGNORE INTO listing_tags (listing_id, tag) VALUES ${placeholders}`);
    
    const params: string[] = [];
    tags.forEach(tag => {
      params.push(listingId, tag.toLowerCase().trim());
    });

    await stmt.bind(...params).run();
  }

  async replaceListingTags(listingId: string, tags: string[]): Promise<void> {
    // Delete existing tags
    const deleteStmt = this.db.prepare('DELETE FROM listing_tags WHERE listing_id = ?');
    await deleteStmt.bind(listingId).run();

    // Add new tags
    if (tags.length > 0) {
      await this.addListingTags(listingId, tags);
    }
  }

  async getListingTags(listingId: string): Promise<string[]> {
    const stmt = this.db.prepare('SELECT tag FROM listing_tags WHERE listing_id = ?');
    const result = await stmt.bind(listingId).all();
    return (result.results as any[]).map((row: any) => row.tag);
  }

  // Subscription operations
  async createSubscription(subscription: UserSubscription): Promise<UserSubscription> {
    const stmt = this.db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, cancel_at_period_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      subscription.id,
      subscription.userId,
      subscription.planId,
      subscription.stripeSubscriptionId || null,
      subscription.stripeCustomerId || null,
      subscription.status,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      subscription.cancelAtPeriodEnd
    ).run();

    return subscription;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const result = await stmt.bind(userId).first();
    return result as UserSubscription | null;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`
      UPDATE subscriptions SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    await stmt.bind(...values, subscriptionId).run();
    
    const getStmt = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?');
    const result = await getStmt.bind(subscriptionId).first();
    return result as UserSubscription | null;
  }

  // Helper method to get images for a listing
  async getListingImages(listingId: string): Promise<string[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT image_url
        FROM listing_images
        WHERE listing_id = ?
        ORDER BY sort_order ASC
      `);
      const result = await stmt.bind(listingId).all();
      return (result.results as any[])?.map(row => row.image_url) || [];
    } catch (error) {
      console.error('Error fetching listing images:', error);
      return [];
    }
  }

  // Helper method to add images to a listing
  async addListingImages(listingId: string, imageUrls: string[]): Promise<void> {
    try {
      for (let i = 0; i < imageUrls.length; i++) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const stmt = this.db.prepare(`
          INSERT INTO listing_images (id, listing_id, image_url, image_key, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `);

        // Extract the R2 key from the URL (assuming URL format: https://domain/path/key)
        const imageKey = imageUrls[i].split('/').pop() || imageUrls[i];

        await stmt.bind(imageId, listingId, imageUrls[i], imageKey, i).run();
      }
    } catch (error) {
      console.error('Error adding listing images:', error);
      throw error;
    }
  }

  // Helper method to update images for a listing
  async updateListingImages(listingId: string, imageUrls: string[]): Promise<void> {
    try {
      // First, delete existing images
      const deleteStmt = this.db.prepare(`DELETE FROM listing_images WHERE listing_id = ?`);
      await deleteStmt.bind(listingId).run();

      // Then add new images
      if (imageUrls.length > 0) {
        await this.addListingImages(listingId, imageUrls);
      }
    } catch (error) {
      console.error('Error updating listing images:', error);
      throw error;
    }
  }

  // Helper method to convert database listing to API listing format
  private async convertDatabaseListingToListing(dbListing: DatabaseListing): Promise<Listing> {
    // Fetch images for this listing
    const images = await this.getListingImages(dbListing.id);

    // Transform category from database format (cat_organic_farm) to API format (organic_farm)
    const apiCategory = dbListing.category.startsWith('cat_')
      ? dbListing.category.substring(4)
      : dbListing.category;

    return {
      id: dbListing.id,
      title: dbListing.title,
      description: dbListing.description,
      category: apiCategory as any, // Cast to maintain type compatibility
      status: dbListing.status,
      location: {
        latitude: dbListing.latitude,
        longitude: dbListing.longitude,
        address: dbListing.address,
        city: dbListing.city,
        region: dbListing.region || undefined,
        country: dbListing.country,
        postalCode: dbListing.postal_code || undefined
      },
      contactInfo: {
        email: dbListing.contact_email || undefined,
        phone: dbListing.contact_phone || undefined,
        website: dbListing.contact_website || undefined
      },
      images: images,
      tags: [], // Will be populated separately
      isOrganic: dbListing.is_organic,
      isCertified: dbListing.is_certified,
      certificationDetails: dbListing.certification_details || undefined,
      operatingHours: dbListing.operating_hours ? JSON.parse(dbListing.operating_hours) : undefined,
      priceRange: (dbListing.price_range as 'free' | 'low' | 'medium' | 'high') || undefined,
      userId: dbListing.user_id,
      createdAt: dbListing.created_at,
      updatedAt: dbListing.updated_at,
      views: dbListing.views,
      favorites: dbListing.favorites
    };
  }
}
