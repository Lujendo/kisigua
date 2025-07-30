export type ListingCategory = string; // Accept any category ID from the database

export type ListingStatus = 'active' | 'inactive' | 'pending' | 'rejected';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  status: ListingStatus;
  location: Location;
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  images: string[];
  tags: string[];
  isOrganic: boolean;
  isCertified: boolean;
  certificationDetails?: string;
  operatingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  priceRange?: 'free' | 'low' | 'medium' | 'high';
  userId: string; // Owner of the listing
  createdAt: string;
  updatedAt: string;
  views: number;
  favorites: number;
}

export interface SearchFilters {
  category?: ListingCategory[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  isOrganic?: boolean;
  isCertified?: boolean;
  priceRange?: ('free' | 'low' | 'medium' | 'high')[];
  tags?: string[];
  city?: string;
  region?: string;
  country?: string;
}

export interface SearchQuery {
  query?: string; // Full-text search
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'distance' | 'created_at' | 'views' | 'favorites';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SearchFilters;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  category: ListingCategory;
  location: Location;
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  images?: string[];
  tags?: string[];
  isOrganic?: boolean;
  isCertified?: boolean;
  certificationDetails?: string;
  operatingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  priceRange?: 'free' | 'low' | 'medium' | 'high';
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  status?: ListingStatus;
}

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  organic_farm: 'Organic Farm',
  local_product: 'Local Product',
  water_source: 'Water Source',
  vending_machine: 'Vending Machine',
  craft: 'Craft & Artisan',
  sustainable_good: 'Sustainable Good',
};

export const CATEGORY_DESCRIPTIONS: Record<ListingCategory, string> = {
  organic_farm: 'Certified organic farms and agricultural producers',
  local_product: 'Locally produced food, beverages, and goods',
  water_source: 'Public water fountains, wells, and clean water sources',
  vending_machine: 'Automated vending machines for local produce',
  craft: 'Handmade crafts, art, and artisan products',
  sustainable_good: 'Eco-friendly and sustainable products',
};
