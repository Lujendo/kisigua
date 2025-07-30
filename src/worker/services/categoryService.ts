export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class CategoryService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate unique ID
  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Get all categories
  async getAllCategories(includeInactive: boolean = false): Promise<Category[]> {
    try {
      let query = `
        SELECT id, name, slug, description, icon, color, is_active as isActive, 
               sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM categories
      `;
      
      if (!includeInactive) {
        query += ' WHERE is_active = TRUE';
      }
      
      query += ' ORDER BY sort_order ASC, name ASC';

      const stmt = this.db.prepare(query);
      const result = await stmt.all();
      
      return result.results?.map((row: any) => {
        // Transform category ID from database format (cat_organic_farm) to API format (organic_farm)
        const apiId = (row.id as string).startsWith('cat_')
          ? (row.id as string).substring(4)
          : (row.id as string);

        return {
          id: apiId,
          name: row.name as string,
          slug: row.slug as string,
          description: row.description as string | undefined,
          icon: row.icon as string | undefined,
          color: (row.color as string) || '#10B981',
          isActive: Boolean(row.isActive),
          sortOrder: (row.sortOrder as number) || 0,
          createdAt: row.createdAt as string,
          updatedAt: row.updatedAt as string,
          createdBy: row.createdBy as string | undefined
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      // Transform API format ID to database format if needed
      const dbId = id.startsWith('cat_') ? id : `cat_${id}`;

      const stmt = this.db.prepare(`
        SELECT id, name, slug, description, icon, color, is_active as isActive,
               sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM categories
        WHERE id = ?
      `);

      const result = await stmt.bind(dbId).first();

      if (!result) return null;

      // Transform category ID from database format to API format
      const apiId = (result.id as string).startsWith('cat_')
        ? (result.id as string).substring(4)
        : (result.id as string);

      return {
        id: apiId,
        name: result.name as string,
        slug: result.slug as string,
        description: result.description as string | undefined,
        icon: result.icon as string | undefined,
        color: (result.color as string) || '#10B981',
        isActive: Boolean(result.isActive),
        sortOrder: (result.sortOrder as number) || 0,
        createdAt: result.createdAt as string,
        updatedAt: result.updatedAt as string,
        createdBy: result.createdBy as string | undefined
      };
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw new Error('Failed to fetch category');
    }
  }

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, slug, description, icon, color, is_active as isActive, 
               sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt, created_by as createdBy
        FROM categories 
        WHERE slug = ? AND is_active = TRUE
      `);
      
      const result = await stmt.bind(slug).first();
      
      if (!result) return null;
      
      return {
        id: result.id as string,
        name: result.name as string,
        slug: result.slug as string,
        description: result.description as string | undefined,
        icon: result.icon as string | undefined,
        color: (result.color as string) || '#10B981',
        isActive: Boolean(result.isActive),
        sortOrder: (result.sortOrder as number) || 0,
        createdAt: result.createdAt as string,
        updatedAt: result.updatedAt as string,
        createdBy: result.createdBy as string | undefined
      };
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw new Error('Failed to fetch category');
    }
  }

  // Create new category
  async createCategory(data: CreateCategoryRequest, createdBy: string): Promise<Category> {
    try {
      const id = this.generateId();
      const slug = this.generateSlug(data.name);
      const now = new Date().toISOString();
      
      // Check if name or slug already exists
      const existingStmt = this.db.prepare(`
        SELECT id FROM categories WHERE name = ? OR slug = ?
      `);
      const existing = await existingStmt.bind(data.name, slug).first();
      
      if (existing) {
        throw new Error('Category with this name already exists');
      }
      
      const stmt = this.db.prepare(`
        INSERT INTO categories (id, name, slug, description, icon, color, sort_order, created_at, updated_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        id,
        data.name,
        slug,
        data.description || null,
        data.icon || null,
        data.color || '#10B981',
        data.sortOrder || 0,
        now,
        now,
        createdBy
      ).run();
      
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new Error('Failed to create category');
      }
      
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create category');
    }
  }

  // Update category
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const existing = await this.getCategoryById(id);
      if (!existing) {
        throw new Error('Category not found');
      }
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (data.name !== undefined) {
        const slug = this.generateSlug(data.name);
        
        // Check if new name/slug conflicts with other categories
        const conflictStmt = this.db.prepare(`
          SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?
        `);
        const conflict = await conflictStmt.bind(data.name, slug, id).first();
        
        if (conflict) {
          throw new Error('Category with this name already exists');
        }
        
        updates.push('name = ?', 'slug = ?');
        values.push(data.name, slug);
      }
      
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description || null);
      }
      
      if (data.icon !== undefined) {
        updates.push('icon = ?');
        values.push(data.icon || null);
      }
      
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color);
      }
      
      if (data.isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(data.isActive);
      }
      
      if (data.sortOrder !== undefined) {
        updates.push('sort_order = ?');
        values.push(data.sortOrder);
      }
      
      if (updates.length === 0) {
        return existing;
      }
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const stmt = this.db.prepare(`
        UPDATE categories SET ${updates.join(', ')} WHERE id = ?
      `);
      
      await stmt.bind(...values).run();
      
      const updated = await this.getCategoryById(id);
      if (!updated) {
        throw new Error('Failed to update category');
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating category:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update category');
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      // Check if category is being used by any listings
      const usageStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM listings WHERE category = ?
      `);
      const usage = await usageStmt.bind(id).first();
      
      if (usage && (usage.count as number) > 0) {
        throw new Error('Cannot delete category that is being used by listings');
      }

      const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
      const result = await stmt.bind(id).run();

      return result.success;
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete category');
    }
  }

  // Reorder categories
  async reorderCategories(categoryIds: string[]): Promise<boolean> {
    try {
      const stmt = this.db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
      
      for (let i = 0; i < categoryIds.length; i++) {
        await stmt.bind(i, categoryIds[i]).run();
      }
      
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw new Error('Failed to reorder categories');
    }
  }
}
