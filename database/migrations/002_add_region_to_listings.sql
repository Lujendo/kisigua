-- Migration: Add region field to listings table
-- Date: 2025-07-29
-- Description: Add region/state/province field to listings for better location categorization

-- Add region column to listings table
ALTER TABLE listings ADD COLUMN region TEXT;

-- Create index on region for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);

-- Create composite index for location-based queries
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(country, region, city);
