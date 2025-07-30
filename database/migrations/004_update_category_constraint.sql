-- Migration: Update category constraint to match categories table IDs
-- Created: 2025-07-30
-- Description: Update listings table category constraint to accept full category IDs with 'cat_' prefix

-- Step 1: Create a temporary table with the new constraint
CREATE TABLE listings_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cat_organic_farm', 'cat_local_product', 'cat_water_source', 'cat_vending_machine', 'cat_craft', 'cat_sustainable_good')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'rejected')),

    -- Location data
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,

    -- Contact information
    contact_email TEXT,
    contact_phone TEXT,
    contact_website TEXT,

    -- Listing attributes
    is_organic BOOLEAN NOT NULL DEFAULT false,
    is_certified BOOLEAN NOT NULL DEFAULT false,
    certification_details TEXT,
    price_range TEXT CHECK (price_range IN ('free', 'low', 'medium', 'high')),

    -- Operating hours (JSON format)
    operating_hours TEXT, -- JSON string

    -- Metadata
    views INTEGER NOT NULL DEFAULT 0,
    favorites INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT false,
    featured_until DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table to new table, transforming category values
INSERT INTO listings_new (
    id, user_id, title, description, category, status,
    latitude, longitude, address, city, region, country, postal_code,
    contact_email, contact_phone, contact_website,
    is_organic, is_certified, certification_details, price_range,
    operating_hours, views, favorites, featured, featured_until,
    created_at, updated_at
)
SELECT
    id, user_id, title, description,
    CASE
        WHEN category LIKE 'cat_%' THEN category
        ELSE 'cat_' || category
    END as category,
    status,
    latitude, longitude, address, city, region, country, postal_code,
    contact_email, contact_phone, contact_website,
    is_organic, is_certified, certification_details, price_range,
    operating_hours, views, favorites, featured, featured_until,
    created_at, updated_at
FROM listings;

-- Step 3: Drop old table
DROP TABLE listings;

-- Step 4: Rename new table to original name
ALTER TABLE listings_new RENAME TO listings;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(country, region, city);
