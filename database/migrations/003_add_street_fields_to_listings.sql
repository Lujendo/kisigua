-- Migration: Add separate street and house number fields to listings table
-- Date: 2025-07-30
-- Description: Add street and house_number fields to store detailed address information

-- Add street and house_number columns to listings table
ALTER TABLE listings ADD COLUMN street TEXT;
ALTER TABLE listings ADD COLUMN house_number TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_street ON listings(street);
CREATE INDEX IF NOT EXISTS idx_listings_house_number ON listings(house_number);

-- Update existing listings to extract street and house number from address field
-- This is a best-effort extraction - new listings will have proper separate fields
UPDATE listings 
SET 
  street = CASE 
    WHEN address LIKE '% %' THEN 
      TRIM(SUBSTR(address, 1, LENGTH(address) - LENGTH(LTRIM(address, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-'))))
    ELSE address
  END,
  house_number = CASE 
    WHEN address LIKE '% %' THEN 
      TRIM(SUBSTR(address, LENGTH(address) - LENGTH(LTRIM(address, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-')) + 1))
    ELSE NULL
  END
WHERE street IS NULL AND house_number IS NULL;
