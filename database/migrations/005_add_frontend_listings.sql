-- Migration: Add frontend listings to database
-- Created: 2025-07-29
-- Purpose: Import 10 listings from frontend components to have 15 total listings

-- Insert listings from Dashboard component (5 listings)
INSERT OR IGNORE INTO listings (
    id, user_id, title, description, category, status,
    latitude, longitude, address, city, country,
    contact_email, contact_website, is_organic, is_certified,
    views, featured, created_at, updated_at
) VALUES 
-- 1. Organic Farm Experience
('listing-006', 'user-001', 'Organic Farm Experience',
 'Visit our sustainable organic farm and learn about permaculture practices. Enjoy fresh produce and connect with nature.',
 'cat_organic_farm', 'active',
 52.5200, 13.4050, '123 Farm Road', 'Green Valley', 'Germany',
 'info@organicfarm.de', 'https://organicfarm.de', true, true,
 124, true, '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z'),

-- 2. Community Garden Workshop
('listing-007', 'premium-001', 'Community Garden Workshop',
 'Join our weekly community garden workshop. Learn to grow your own vegetables and herbs in an urban setting.',
 'cat_organic_farm', 'active',
 52.5170, 13.3889, '456 Community St', 'Berlin', 'Germany',
 'info@communitygarden.de', 'https://communitygarden.de', true, true,
 89, false, '2024-01-10T00:00:00Z', '2024-01-10T00:00:00Z'),

-- 3. Traditional Cooking Class
('listing-008', 'supporter-001', 'Traditional Cooking Class',
 'Learn to cook traditional local dishes using ingredients from our region. Small groups, authentic recipes.',
 'cat_local_product', 'active',
 48.1351, 11.5820, '789 Kitchen Lane', 'Munich', 'Germany',
 'chef@cookingclass.de', 'https://cookingclass.de', false, true,
 156, true, '2024-01-08T00:00:00Z', '2024-01-08T00:00:00Z'),

-- 4. Eco-Friendly Accommodation
('listing-009', 'admin-001', 'Eco-Friendly Accommodation',
 'Stay in our eco-friendly guesthouse powered by renewable energy. Perfect for sustainable travelers.',
 'cat_sustainable_good', 'active',
 53.5511, 9.9937, '321 Green Street', 'Hamburg', 'Germany',
 'stay@ecoguesthouse.de', 'https://ecoguesthouse.de', false, true,
 203, false, '2024-01-05T00:00:00Z', '2024-01-05T00:00:00Z'),

-- 5. Local Art Gallery Tour
('listing-010', 'user-001', 'Local Art Gallery Tour',
 'Discover local artists and their sustainable art practices. Interactive tour with the artists themselves.',
 'cat_craft', 'active',
 51.0504, 13.7373, '654 Art Avenue', 'Dresden', 'Germany',
 'art@gallery.de', 'https://artgallery.de', false, true,
 67, false, '2024-01-03T00:00:00Z', '2024-01-03T00:00:00Z');

-- Insert listings from MyListingsPage component (5 additional listings)
INSERT OR IGNORE INTO listings (
    id, user_id, title, description, category, status,
    latitude, longitude, address, city, country, region,
    contact_phone, contact_email, contact_website, is_organic, is_certified,
    views, featured, created_at, updated_at
) VALUES 
-- 6. Fresh Mountain Spring Water
('listing-011', 'premium-001', 'Fresh Mountain Spring Water',
 'Natural spring water source accessible to the public. Clean, tested water available 24/7. Perfect for filling bottles and containers.',
 'cat_water_source', 'active',
 48.1351, 11.5820, 'Bergweg 45', 'Munich', 'Germany', 'Bavaria',
 null, 'water@munich.de', 'https://munich-water.de', false, true,
 156, false, '2024-01-20T00:00:00Z', '2024-01-20T00:00:00Z'),

-- 7. Healthy Snack Vending Machine
('listing-012', 'supporter-001', 'Healthy Snack Vending Machine',
 'Automated vending machine offering organic snacks, fresh fruits, and healthy beverages. Available 24/7 with contactless payment options.',
 'cat_vending_machine', 'active',
 50.1109, 8.6821, 'Universitätsstraße 12', 'Frankfurt', 'Germany', 'Hesse',
 null, 'support@healthysnacks.de', 'https://healthysnacks.de', true, true,
 67, false, '2024-01-25T00:00:00Z', '2024-01-25T00:00:00Z'),

-- 8. Community Garden Fresh Produce
('listing-013', 'admin-001', 'Community Garden Fresh Produce',
 'Fresh vegetables and herbs grown by our community garden members. Seasonal produce available for pickup.',
 'cat_organic_farm', 'active',
 50.9375, 6.9603, 'Gartenweg 88', 'Cologne', 'Germany', 'North Rhine-Westphalia',
 null, 'community@gardencoop.de', 'https://gardencoop.de', true, true,
 76, false, '2024-01-18T00:00:00Z', '2024-01-18T00:00:00Z'),

-- 9. Natural Spring Water Station
('listing-014', 'user-001', 'Natural Spring Water Station',
 'Public water station with filtered natural spring water. Free access for everyone. Water quality tested weekly.',
 'cat_water_source', 'active',
 49.4521, 11.0767, 'Parkstraße 15', 'Nuremberg', 'Germany', 'Bavaria',
 null, 'water@nuremberg.de', null, false, true,
 112, false, '2024-01-22T00:00:00Z', '2024-01-22T00:00:00Z'),

-- 10. Artisan Bread & Pastries
('listing-015', 'premium-001', 'Artisan Bread & Pastries',
 'Traditional German bread and pastries made with organic flour and natural ingredients. Fresh daily baking using time-honored recipes.',
 'cat_local_product', 'active',
 51.3397, 12.3731, 'Bäckerstraße 42', 'Leipzig', 'Germany', 'Saxony',
 '+49 341 5566778', 'orders@traditionalbakery.de', 'https://traditionalbakery.de', true, true,
 203, false, '2024-01-08T00:00:00Z', '2024-01-08T00:00:00Z');

-- Log activity for the new listings
INSERT INTO activity_log (action_type, description, entity_type, entity_id, created_at) VALUES
('listing_created', 'Frontend listing imported: Organic Farm Experience', 'listing', 'listing-006', '2024-01-15T00:00:00Z'),
('listing_created', 'Frontend listing imported: Community Garden Workshop', 'listing', 'listing-007', '2024-01-10T00:00:00Z'),
('listing_created', 'Frontend listing imported: Traditional Cooking Class', 'listing', 'listing-008', '2024-01-08T00:00:00Z'),
('listing_created', 'Frontend listing imported: Eco-Friendly Accommodation', 'listing', 'listing-009', '2024-01-05T00:00:00Z'),
('listing_created', 'Frontend listing imported: Local Art Gallery Tour', 'listing', 'listing-010', '2024-01-03T00:00:00Z'),
('listing_created', 'Frontend listing imported: Fresh Mountain Spring Water', 'listing', 'listing-011', '2024-01-20T00:00:00Z'),
('listing_created', 'Frontend listing imported: Healthy Snack Vending Machine', 'listing', 'listing-012', '2024-01-25T00:00:00Z'),
('listing_created', 'Frontend listing imported: Community Garden Fresh Produce', 'listing', 'listing-013', '2024-01-18T00:00:00Z'),
('listing_created', 'Frontend listing imported: Natural Spring Water Station', 'listing', 'listing-014', '2024-01-22T00:00:00Z'),
('listing_created', 'Frontend listing imported: Artisan Bread & Pastries', 'listing', 'listing-015', '2024-01-08T00:00:00Z');
