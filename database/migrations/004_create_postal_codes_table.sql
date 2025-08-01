-- Migration: Create postal codes table for global location search
-- This table will store comprehensive postal code data from GeoNames
-- Optimized for fast search with proper indexing and country filtering

CREATE TABLE IF NOT EXISTS postal_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    place_name TEXT NOT NULL,
    admin_name1 TEXT, -- State/Region
    admin_code1 TEXT,
    admin_name2 TEXT, -- District/County
    admin_code2 TEXT,
    admin_name3 TEXT, -- Municipality
    admin_code3 TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy INTEGER DEFAULT 6,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast search performance
CREATE INDEX IF NOT EXISTS idx_postal_codes_country_code ON postal_codes(country_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_postal_code ON postal_codes(postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_place_name ON postal_codes(place_name);
CREATE INDEX IF NOT EXISTS idx_postal_codes_country_postal ON postal_codes(country_code, postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_country_place ON postal_codes(country_code, place_name);
CREATE INDEX IF NOT EXISTS idx_postal_codes_coordinates ON postal_codes(latitude, longitude);

-- Full-text search index for place names (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS postal_codes_fts USING fts5(
    place_name,
    admin_name1,
    admin_name2,
    admin_name3,
    content='postal_codes',
    content_rowid='id'
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS postal_codes_fts_insert AFTER INSERT ON postal_codes BEGIN
    INSERT INTO postal_codes_fts(rowid, place_name, admin_name1, admin_name2, admin_name3)
    VALUES (new.id, new.place_name, new.admin_name1, new.admin_name2, new.admin_name3);
END;

CREATE TRIGGER IF NOT EXISTS postal_codes_fts_delete AFTER DELETE ON postal_codes BEGIN
    INSERT INTO postal_codes_fts(postal_codes_fts, rowid, place_name, admin_name1, admin_name2, admin_name3)
    VALUES ('delete', old.id, old.place_name, old.admin_name1, old.admin_name2, old.admin_name3);
END;

CREATE TRIGGER IF NOT EXISTS postal_codes_fts_update AFTER UPDATE ON postal_codes BEGIN
    INSERT INTO postal_codes_fts(postal_codes_fts, rowid, place_name, admin_name1, admin_name2, admin_name3)
    VALUES ('delete', old.id, old.place_name, old.admin_name1, old.admin_name2, old.admin_name3);
    INSERT INTO postal_codes_fts(rowid, place_name, admin_name1, admin_name2, admin_name3)
    VALUES (new.id, new.place_name, new.admin_name1, new.admin_name2, new.admin_name3);
END;
