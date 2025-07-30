-- Migration: Fix image consistency after category ID changes
-- Created: 2025-07-30
-- Purpose: Ensure all listing images are properly associated and remove any orphaned image references

-- Step 1: Remove any orphaned images (images that reference non-existent listings)
DELETE FROM listing_images 
WHERE listing_id NOT IN (SELECT id FROM listings);

-- Step 2: Ensure all images have proper sort_order (starting from 0)
-- This fixes any gaps in sort_order that might have been created
WITH ranked_images AS (
  SELECT 
    id,
    listing_id,
    ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY sort_order, created_at) - 1 as new_sort_order
  FROM listing_images
)
UPDATE listing_images 
SET sort_order = (
  SELECT new_sort_order 
  FROM ranked_images 
  WHERE ranked_images.id = listing_images.id
);

-- Step 3: Add indexes for better performance on image queries
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_sort_order ON listing_images(listing_id, sort_order);

-- Step 4: Update any missing alt_text with default values
UPDATE listing_images 
SET alt_text = 'Listing image'
WHERE alt_text IS NULL OR alt_text = '';

-- Step 5: Ensure all image_key values are properly set
UPDATE listing_images 
SET image_key = COALESCE(image_key, 'img_' || id)
WHERE image_key IS NULL OR image_key = '';
