-- Migration: Add beautiful images to all listings
-- Created: 2025-07-29
-- Purpose: Add professional images to make the application look appealing

-- The listing_images table already exists, so we'll just insert data
-- Table structure: id, listing_id, image_url, image_key, alt_text, sort_order, created_at

-- Add images for Organic Farm listings
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Green Valley Organic Farm
('img-001-1', 'listing-001', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop&crop=center', 'organic-farm-1', 'Organic farm with fresh vegetables', 1),
('img-001-2', 'listing-001', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&crop=center', 'organic-farm-2', 'Fresh organic vegetables harvest', 2),
('img-001-3', 'listing-001', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop&crop=center', 'organic-farm-3', 'Organic farming practices', 3),

-- Organic Farm Experience
('img-006-1', 'listing-006', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop&crop=center', 'farm-experience-1', 'Sustainable organic farm experience', 1),
('img-006-2', 'listing-006', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop&crop=center', 'farm-experience-2', 'Permaculture garden design', 2),

-- Community Garden Workshop
('img-007-1', 'listing-007', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&crop=center', 'garden-workshop-1', 'Community garden workshop', 1),
('img-007-2', 'listing-007', 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=800&h=600&fit=crop&crop=center', 'garden-workshop-2', 'Urban gardening techniques', 2),

-- Community Garden Fresh Produce
('img-013-1', 'listing-013', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&crop=center', 'garden-produce-1', 'Fresh community garden produce', 1),
('img-013-2', 'listing-013', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop&crop=center', 'garden-produce-2', 'Seasonal vegetables', 2);

-- Add images for Water Source listings
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Fresh Water Spring
('img-002-1', 'listing-002', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop&crop=center', 'water-spring-1', 'Natural spring water source', 1),
('img-002-2', 'listing-002', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center', 'water-spring-2', 'Clean mountain spring', 2),

-- Fresh Mountain Spring Water
('img-011-1', 'listing-011', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop&crop=center', 'mountain-water-1', 'Mountain spring water station', 1),
('img-011-2', 'listing-011', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center', 'mountain-water-2', 'Pure mountain water', 2),

-- Natural Spring Water Station
('img-014-1', 'listing-014', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop&crop=center', 'water-station-1', 'Public water station', 1),
('img-014-2', 'listing-014', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center', 'water-station-2', 'Filtered spring water', 2);

-- Add images for Local Product listings
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Local Honey & Bee Products
('img-003-1', 'listing-003', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop&crop=center', 'honey-products-1', 'Local honey and bee products', 1),
('img-003-2', 'listing-003', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop&crop=center', 'honey-products-2', 'Artisanal honey jars', 2),
('img-003-3', 'listing-003', 'https://images.unsplash.com/photo-1516824711017-d8b7b4b7e0b5?w=800&h=600&fit=crop&crop=center', 'honey-products-3', 'Beeswax candles', 3),

-- Traditional Cooking Class
('img-008-1', 'listing-008', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', 'cooking-class-1', 'Traditional cooking class', 1),
('img-008-2', 'listing-008', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', 'cooking-class-2', 'Local ingredients preparation', 2),

-- Artisan Bread & Pastries
('img-015-1', 'listing-015', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop&crop=center', 'bread-pastries-1', 'Artisan bread and pastries', 1),
('img-015-2', 'listing-015', 'https://images.unsplash.com/photo-1555507036-ab794f4afe5b?w=800&h=600&fit=crop&crop=center', 'bread-pastries-2', 'Traditional German bread', 2),
('img-015-3', 'listing-015', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop&crop=center', 'bread-pastries-3', 'Fresh baked goods', 3);

-- Add images for Craft listings
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Handcrafted Wooden Furniture
('img-004-1', 'listing-004', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center', 'wooden-furniture-1', 'Handcrafted wooden furniture', 1),
('img-004-2', 'listing-004', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&crop=center', 'wooden-furniture-2', 'Sustainable wood crafting', 2),
('img-004-3', 'listing-004', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center', 'wooden-furniture-3', 'Custom wooden designs', 3),

-- Local Art Gallery Tour
('img-010-1', 'listing-010', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center', 'art-gallery-1', 'Local art gallery', 1),
('img-010-2', 'listing-010', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=600&fit=crop&crop=center', 'art-gallery-2', 'Sustainable art practices', 2);

-- Add images for Sustainable Good listings
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Eco-Friendly Cleaning Products
('img-005-1', 'listing-005', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', 'cleaning-products-1', 'Eco-friendly cleaning products', 1),
('img-005-2', 'listing-005', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&crop=center', 'cleaning-products-2', 'Natural cleaning ingredients', 2),

-- Eco-Friendly Accommodation
('img-009-1', 'listing-009', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center', 'accommodation-1', 'Eco-friendly accommodation', 1),
('img-009-2', 'listing-009', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center', 'accommodation-2', 'Sustainable guesthouse', 2);

-- Add images for Vending Machine listing
INSERT INTO listing_images (id, listing_id, image_url, image_key, alt_text, sort_order) VALUES
-- Healthy Snack Vending Machine
('img-012-1', 'listing-012', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', 'vending-machine-1', 'Healthy snack vending machine', 1),
('img-012-2', 'listing-012', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=600&fit=crop&crop=center', 'vending-machine-2', 'Organic snacks and fruits', 2);
