-- Migration: Add favorites and collections tables
-- Created: 2025-07-29

-- Create favorites table for user-listing relationships
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY DEFAULT ('fav_' || lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Ensure unique user-listing pairs
    UNIQUE(user_id, listing_id)
);

-- Create favorite collections table
CREATE TABLE IF NOT EXISTS favorite_collections (
    id TEXT PRIMARY KEY DEFAULT ('col_' || lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10B981',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create junction table for collection-listing relationships
CREATE TABLE IF NOT EXISTS collection_listings (
    id TEXT PRIMARY KEY DEFAULT ('cl_' || lower(hex(randomblob(16)))),
    collection_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Foreign key constraints
    FOREIGN KEY (collection_id) REFERENCES favorite_collections(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Ensure unique collection-listing pairs
    UNIQUE(collection_id, listing_id)
);

-- Create activity log table for dashboard
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT ('act_' || lower(hex(randomblob(16)))),
    user_id TEXT,
    action_type TEXT NOT NULL, -- 'user_registered', 'listing_created', 'listing_approved', etc.
    entity_type TEXT, -- 'user', 'listing', 'category', etc.
    entity_id TEXT,
    description TEXT NOT NULL,
    metadata TEXT, -- JSON string for additional data
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Foreign key constraints (optional, as some activities might not have users)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

CREATE INDEX IF NOT EXISTS idx_favorite_collections_user_id ON favorite_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_collections_created_at ON favorite_collections(created_at);

CREATE INDEX IF NOT EXISTS idx_collection_listings_collection_id ON collection_listings(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_listings_listing_id ON collection_listings(listing_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
