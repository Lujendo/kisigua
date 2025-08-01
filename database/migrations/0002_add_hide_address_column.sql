-- Migration: Add hide_address column to listings table
-- Date: 2025-08-01
-- Description: Add hide_address column to support privacy settings for listings

-- Add hide_address column to listings table
ALTER TABLE listings ADD COLUMN hide_address BOOLEAN NOT NULL DEFAULT false;

-- Update any existing listings to have hide_address = false (default behavior)
UPDATE listings SET hide_address = false WHERE hide_address IS NULL;
