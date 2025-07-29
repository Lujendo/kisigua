-- Seed data for categories table
-- Created: 2024-01-29

INSERT OR IGNORE INTO categories (id, name, slug, description, icon, color, sort_order) VALUES
('cat_organic_farm', 'Organic Farm', 'organic-farm', 'Organic farms and agricultural producers offering fresh, sustainable produce', '🌱', '#10B981', 1),
('cat_water_source', 'Water Source', 'water-source', 'Natural water sources, springs, and clean water access points', '💧', '#3B82F6', 2),
('cat_local_product', 'Local Product', 'local-product', 'Locally made products, artisanal goods, and regional specialties', '🏪', '#F59E0B', 3),
('cat_vending_machine', 'Vending Machine', 'vending-machine', 'Automated vending machines offering healthy and sustainable products', '🏪', '#8B5CF6', 4),
('cat_craft', 'Craft & Handmade', 'craft-handmade', 'Handcrafted items, artisan workshops, and creative products', '🎨', '#EF4444', 5),
('cat_sustainable_good', 'Sustainable Good', 'sustainable-good', 'Eco-friendly products and sustainable alternatives', '♻️', '#059669', 6),
('cat_community_garden', 'Community Garden', 'community-garden', 'Community gardens, shared growing spaces, and cooperative farming', '🌿', '#16A34A', 7),
('cat_food_service', 'Food Service', 'food-service', 'Restaurants, cafes, and food services focusing on local and sustainable ingredients', '🍽️', '#DC2626', 8),
('cat_education', 'Education & Workshop', 'education-workshop', 'Educational programs, workshops, and learning experiences', '📚', '#7C3AED', 9),
('cat_health_wellness', 'Health & Wellness', 'health-wellness', 'Health services, wellness products, and natural remedies', '🌿', '#059669', 10),
('cat_renewable_energy', 'Renewable Energy', 'renewable-energy', 'Solar, wind, and other renewable energy solutions', '⚡', '#F59E0B', 11),
('cat_transportation', 'Sustainable Transport', 'sustainable-transport', 'Bike sharing, electric vehicles, and eco-friendly transportation', '🚲', '#3B82F6', 12);
