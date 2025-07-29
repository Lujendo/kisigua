-- Seed Data for Kisigua Application
-- This file contains initial data for development and testing

-- Insert default admin user
INSERT OR IGNORE INTO users (
    id, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
) VALUES (
    'admin-001',
    'admin@kisigua.com',
    '$2b$10$edbL0BW.Z3drKGE.bUfAK.EodZ.Bcj84PLy5GhKp90Sj5PwfoIysO', -- password: admin123
    'admin',
    'Admin',
    'User',
    true,
    datetime('now'),
    datetime('now')
);

-- Insert test users for each role
INSERT OR IGNORE INTO users (
    id, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
) VALUES 
(
    'user-001',
    'user@test.com',
    '$2b$10$F8fGsKJYVEWnD3CQ309MAeH22Pmh9v.rLPxlbw85RzQ1f/Rv36HDi', -- password: test123
    'user',
    'Test',
    'User',
    true,
    datetime('now'),
    datetime('now')
),
(
    'premium-001',
    'premium@test.com',
    '$2b$10$ZJCGABZG9kICMNpMIekg.eDlwmec.1DIpcEtOL7W1tdsfJb54aOKi', -- password: premium123
    'premium',
    'Premium',
    'User',
    true,
    datetime('now'),
    datetime('now')
),
(
    'supporter-001',
    'supporter@test.com',
    '$2b$10$44khnqMAk8ZE8ip5yw4dEeY/iNNhReGW/psA1YDtjrB27ydwxfWeS', -- password: supporter123
    'supporter',
    'Supporter',
    'User',
    true,
    datetime('now'),
    datetime('now')
);

-- Insert sample subscriptions
INSERT OR IGNORE INTO subscriptions (
    id, user_id, plan_id, status, current_period_start, current_period_end, 
    cancel_at_period_end, created_at, updated_at
) VALUES 
(
    'sub-001',
    'premium-001',
    'premium',
    'active',
    datetime('now'),
    datetime('now', '+30 days'),
    false,
    datetime('now'),
    datetime('now')
),
(
    'sub-002',
    'supporter-001',
    'supporter',
    'active',
    datetime('now'),
    datetime('now', '+30 days'),
    false,
    datetime('now'),
    datetime('now')
);

-- Insert sample listings
INSERT OR IGNORE INTO listings (
    id, user_id, title, description, category, status, latitude, longitude,
    address, city, region, country, postal_code, contact_email, contact_phone,
    contact_website, is_organic, is_certified, certification_details,
    price_range, views, favorites, created_at, updated_at
) VALUES
(
    'listing-001',
    'user-001',
    'Green Valley Organic Farm',
    'Family-owned organic farm specializing in seasonal vegetables, herbs, and fruits. We use sustainable farming practices and offer fresh produce year-round.',
    'organic_farm',
    'active',
    52.5200,
    13.4050,
    'Hauptstraße 123',
    'Berlin',
    'Brandenburg',
    'Germany',
    '10115',
    'info@greenvalley.de',
    '+49 30 12345678',
    'https://greenvalley.de',
    true,
    true,
    'EU Organic Certification',
    'medium',
    245,
    18,
    datetime('now', '-15 days'),
    datetime('now', '-15 days')
),
(
    'listing-002',
    'admin-001',
    'Fresh Water Spring',
    'Natural spring water source accessible to the public. Clean, tested water available 24/7.',
    'water_source',
    'active',
    52.5100,
    13.3900,
    'Parkweg 45',
    'Berlin',
    'Brandenburg',
    'Germany',
    '10117',
    'water@berlin.de',
    null,
    null,
    false,
    true,
    'Water Quality Certified',
    'free',
    156,
    32,
    datetime('now', '-20 days'),
    datetime('now', '-20 days')
),
(
    'listing-003',
    'premium-001',
    'Local Honey & Bee Products',
    'Artisanal honey, beeswax candles, and bee pollen from local beekeepers. Supporting local bee populations.',
    'local_product',
    'active',
    52.5300,
    13.4200,
    'Marktplatz 7',
    'Berlin',
    'Brandenburg',
    'Germany',
    '10119',
    'honey@localbeekeepers.de',
    '+49 30 87654321',
    null,
    true,
    false,
    null,
    'medium',
    89,
    12,
    datetime('now', '-10 days'),
    datetime('now', '-10 days')
),
(
    'listing-004',
    'supporter-001',
    'Handcrafted Wooden Furniture',
    'Sustainable wooden furniture made from locally sourced timber. Custom designs available.',
    'craft',
    'active',
    52.4900,
    13.3700,
    'Werkstattstraße 12',
    'Berlin',
    'Brandenburg',
    'Germany',
    '10115',
    'craft@woodworks.de',
    null,
    'https://woodworks.de',
    false,
    true,
    'FSC Certified Wood',
    'high',
    67,
    8,
    datetime('now', '-5 days'),
    datetime('now', '-5 days')
),
(
    'listing-005',
    'user-001',
    'Eco-Friendly Cleaning Products',
    'Biodegradable cleaning products made from natural ingredients. Safe for families and the environment.',
    'sustainable_good',
    'active',
    52.5150,
    13.4100,
    'Ökostraße 33',
    'Berlin',
    'Brandenburg',
    'Germany',
    '10118',
    'info@ecoclean.de',
    '+49 30 11223344',
    'https://ecoclean.de',
    true,
    true,
    'Ecocert Certified',
    'medium',
    134,
    21,
    datetime('now', '-2 days'),
    datetime('now', '-2 days')
);

-- Insert listing tags
INSERT OR IGNORE INTO listing_tags (listing_id, tag, created_at) VALUES 
('listing-001', 'vegetables', datetime('now')),
('listing-001', 'herbs', datetime('now')),
('listing-001', 'seasonal', datetime('now')),
('listing-001', 'family-owned', datetime('now')),
('listing-002', 'spring', datetime('now')),
('listing-002', 'natural', datetime('now')),
('listing-002', 'free', datetime('now')),
('listing-002', 'tested', datetime('now')),
('listing-003', 'honey', datetime('now')),
('listing-003', 'beeswax', datetime('now')),
('listing-003', 'local', datetime('now')),
('listing-003', 'artisanal', datetime('now')),
('listing-003', 'bee-friendly', datetime('now')),
('listing-004', 'furniture', datetime('now')),
('listing-004', 'wood', datetime('now')),
('listing-004', 'handcrafted', datetime('now')),
('listing-004', 'custom', datetime('now')),
('listing-004', 'sustainable', datetime('now')),
('listing-005', 'cleaning', datetime('now')),
('listing-005', 'biodegradable', datetime('now')),
('listing-005', 'natural', datetime('now')),
('listing-005', 'family-safe', datetime('now')),
('listing-005', 'eco-friendly', datetime('now'));

-- Insert some sample favorites
INSERT OR IGNORE INTO user_favorites (user_id, listing_id, created_at) VALUES 
('premium-001', 'listing-001', datetime('now')),
('premium-001', 'listing-002', datetime('now')),
('supporter-001', 'listing-001', datetime('now')),
('supporter-001', 'listing-003', datetime('now')),
('user-001', 'listing-002', datetime('now'));

-- Insert sample analytics events
INSERT OR IGNORE INTO analytics_events (
    event_type, user_id, listing_id, session_id, ip_address, 
    user_agent, referrer, metadata, created_at
) VALUES 
('page_view', 'user-001', null, 'session-001', '192.168.1.1', 
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
 'https://google.com', '{"page": "/"}', datetime('now', '-1 hour')),
('search', 'user-001', null, 'session-001', '192.168.1.1', 
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
 null, '{"query": "organic farm", "resultsCount": 3}', datetime('now', '-50 minutes')),
('listing_view', 'user-001', 'listing-001', 'session-001', '192.168.1.1', 
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
 null, null, datetime('now', '-45 minutes')),
('user_login', 'premium-001', null, 'session-002', '192.168.1.2', 
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 
 null, null, datetime('now', '-30 minutes')),
('listing_favorite', 'premium-001', 'listing-001', 'session-002', '192.168.1.2', 
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 
 null, null, datetime('now', '-25 minutes'));
