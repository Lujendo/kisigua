import {
  Listing,
  SearchQuery,
  SearchResult,
  CreateListingRequest,
  UpdateListingRequest
} from '../types/listings';
import { DatabaseService } from './databaseService';

export class ListingsService {
  private listings: Map<string, Listing> = new Map();
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleListings: Listing[] = [
      {
        id: 'listing-001',
        title: 'Green Valley Organic Farm',
        description: 'Family-owned organic farm specializing in seasonal vegetables, herbs, and fruits. We use sustainable farming practices and offer fresh produce year-round.',
        category: 'organic_farm',
        status: 'active',
        location: {
          latitude: 52.5200,
          longitude: 13.4050,
          address: 'Hauptstraße 123',
          city: 'Berlin',
          region: 'Brandenburg',
          country: 'Germany',
          postalCode: '10115'
        },
        contactInfo: {
          email: 'info@greenvalley.de',
          phone: '+49 30 12345678',
          website: 'https://greenvalley.de'
        },
        images: [],
        tags: ['vegetables', 'herbs', 'seasonal', 'family-owned'],
        isOrganic: true,
        isCertified: true,
        certificationDetails: 'EU Organic Certification',
        operatingHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '16:00' },
          sunday: { closed: true, open: '', close: '' }
        },
        priceRange: 'medium',
        hideAddress: false,
        userId: 'user-001',
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString(),
        views: 245,
        favorites: 18
      },
      {
        id: 'listing-002',
        title: 'Fresh Water Spring',
        description: 'Natural spring water source accessible to the public. Clean, tested water available 24/7.',
        category: 'water_source',
        status: 'active',
        location: {
          latitude: 52.5100,
          longitude: 13.3900,
          address: 'Parkweg 45',
          city: 'Berlin',
          region: 'Brandenburg',
          country: 'Germany',
          postalCode: '10117'
        },
        contactInfo: {
          email: 'water@berlin.de'
        },
        images: [],
        tags: ['spring', 'natural', 'free', 'tested'],
        isOrganic: false,
        isCertified: true,
        certificationDetails: 'Water Quality Certified',
        priceRange: 'free',
        hideAddress: false,
        userId: 'admin-001',
        createdAt: new Date('2024-01-10').toISOString(),
        updatedAt: new Date('2024-01-10').toISOString(),
        views: 156,
        favorites: 32
      },
      {
        id: 'listing-003',
        title: 'Local Honey & Bee Products',
        description: 'Artisanal honey, beeswax candles, and bee pollen from local beekeepers. Supporting local bee populations.',
        category: 'local_product',
        status: 'active',
        location: {
          latitude: 52.5300,
          longitude: 13.4200,
          address: 'Marktplatz 7',
          city: 'Berlin',
          region: 'Brandenburg',
          country: 'Germany',
          postalCode: '10119'
        },
        contactInfo: {
          email: 'honey@localbeekeepers.de',
          phone: '+49 30 87654321'
        },
        images: [],
        tags: ['honey', 'beeswax', 'local', 'artisanal', 'bee-friendly'],
        isOrganic: true,
        isCertified: false,
        priceRange: 'medium',
        hideAddress: false,
        userId: 'premium-001',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-20').toISOString(),
        views: 89,
        favorites: 12
      },
      {
        id: 'listing-004',
        title: 'Handcrafted Wooden Furniture',
        description: 'Sustainable wooden furniture made from locally sourced timber. Custom designs available.',
        category: 'craft',
        status: 'active',
        location: {
          latitude: 52.4900,
          longitude: 13.3700,
          address: 'Werkstattstraße 12',
          city: 'Berlin',
          country: 'Germany',
          postalCode: '10115'
        },
        contactInfo: {
          email: 'craft@woodworks.de',
          website: 'https://woodworks.de'
        },
        images: [],
        tags: ['furniture', 'wood', 'handcrafted', 'custom', 'sustainable'],
        isOrganic: false,
        isCertified: true,
        certificationDetails: 'FSC Certified Wood',
        priceRange: 'high',
        hideAddress: false,
        userId: 'supporter-001',
        createdAt: new Date('2024-01-25').toISOString(),
        updatedAt: new Date('2024-01-25').toISOString(),
        views: 67,
        favorites: 8
      },
      {
        id: 'listing-005',
        title: 'Eco-Friendly Cleaning Products',
        description: 'Biodegradable cleaning products made from natural ingredients. Safe for families and the environment.',
        category: 'sustainable_good',
        status: 'active',
        location: {
          latitude: 52.5150,
          longitude: 13.4100,
          address: 'Ökostraße 33',
          city: 'Berlin',
          country: 'Germany',
          postalCode: '10118'
        },
        contactInfo: {
          email: 'info@ecoclean.de',
          phone: '+49 30 11223344',
          website: 'https://ecoclean.de'
        },
        images: [],
        tags: ['cleaning', 'biodegradable', 'natural', 'family-safe', 'eco-friendly'],
        isOrganic: true,
        isCertified: true,
        certificationDetails: 'Ecocert Certified',
        priceRange: 'medium',
        hideAddress: false,
        userId: 'user-001',
        createdAt: new Date('2024-01-30').toISOString(),
        updatedAt: new Date('2024-01-30').toISOString(),
        views: 134,
        favorites: 21
      }
    ];

    sampleListings.forEach(listing => {
      this.listings.set(listing.id, listing);
    });
  }

  async createListing(userId: string, data: CreateListingRequest): Promise<Listing> {
    const listingId = `listing-${Date.now()}`;
    const now = new Date().toISOString();

    const listing: Listing = {
      id: listingId,
      ...data,
      status: 'pending', // New listings start as pending
      images: data.images || [],
      tags: data.tags || [],
      isOrganic: data.isOrganic || false,
      isCertified: data.isCertified || false,
      hideAddress: data.hideAddress || false,
      userId,
      createdAt: now,
      updatedAt: now,
      views: 0,
      favorites: 0
    };

    this.listings.set(listingId, listing);
    return listing;
  }

  async updateListing(listingId: string, userId: string, data: UpdateListingRequest, isAdmin: boolean = false): Promise<Listing | null> {
    const listing = this.listings.get(listingId);
    
    if (!listing) {
      return null;
    }

    // Check permissions
    if (!isAdmin && listing.userId !== userId) {
      return null;
    }

    const updatedListing: Listing = {
      ...listing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.listings.set(listingId, updatedListing);
    return updatedListing;
  }

  async deleteListing(listingId: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    const listing = this.listings.get(listingId);
    
    if (!listing) {
      return false;
    }

    // Check permissions
    if (!isAdmin && listing.userId !== userId) {
      return false;
    }

    return this.listings.delete(listingId);
  }

  async getListing(listingId: string): Promise<Listing | null> {
    const listing = this.listings.get(listingId);
    
    if (listing) {
      // Increment view count
      listing.views++;
      this.listings.set(listingId, listing);
    }
    
    return listing || null;
  }

  async searchListings(searchQuery: SearchQuery): Promise<SearchResult> {
    let filteredListings = Array.from(this.listings.values());

    // Filter by status (only show active listings in search)
    filteredListings = filteredListings.filter(listing => listing.status === 'active');

    // Apply filters
    if (searchQuery.filters) {
      const { filters } = searchQuery;

      if (filters.category && filters.category.length > 0) {
        filteredListings = filteredListings.filter(listing => 
          filters.category!.includes(listing.category)
        );
      }

      if (filters.isOrganic !== undefined) {
        filteredListings = filteredListings.filter(listing => 
          listing.isOrganic === filters.isOrganic
        );
      }

      if (filters.isCertified !== undefined) {
        filteredListings = filteredListings.filter(listing => 
          listing.isCertified === filters.isCertified
        );
      }

      if (filters.priceRange && filters.priceRange.length > 0) {
        filteredListings = filteredListings.filter(listing => 
          listing.priceRange && filters.priceRange!.includes(listing.priceRange)
        );
      }

      if (filters.city) {
        filteredListings = filteredListings.filter(listing => 
          listing.location.city.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }

      if (filters.country) {
        filteredListings = filteredListings.filter(listing => 
          listing.location.country.toLowerCase().includes(filters.country!.toLowerCase())
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredListings = filteredListings.filter(listing => 
          filters.tags!.some(tag => 
            listing.tags.some(listingTag => 
              listingTag.toLowerCase().includes(tag.toLowerCase())
            )
          )
        );
      }

      // Location-based filtering (simple distance calculation)
      if (filters.location) {
        filteredListings = filteredListings.filter(listing => {
          const distance = this.calculateDistance(
            filters.location!.latitude,
            filters.location!.longitude,
            listing.location.latitude,
            listing.location.longitude
          );
          return distance <= filters.location!.radius;
        });
      }
    }

    // Full-text search
    if (searchQuery.query) {
      const query = searchQuery.query.toLowerCase();
      filteredListings = filteredListings.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.tags.some(tag => tag.toLowerCase().includes(query)) ||
        listing.location.city.toLowerCase().includes(query) ||
        listing.location.address.toLowerCase().includes(query)
      );
    }

    // Sorting
    const sortBy = searchQuery.sortBy || 'relevance';
    const sortOrder = searchQuery.sortOrder || 'desc';

    filteredListings.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'views':
          comparison = a.views - b.views;
          break;
        case 'favorites':
          comparison = a.favorites - b.favorites;
          break;
        case 'distance':
          // For distance, we'd need the user's location
          comparison = 0;
          break;
        case 'relevance':
        default:
          // Simple relevance based on views and favorites
          comparison = (a.views + a.favorites * 2) - (b.views + b.favorites * 2);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedListings = filteredListings.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredListings.length / limit);

    return {
      listings: paginatedListings,
      total: filteredListings.length,
      page,
      limit,
      totalPages,
      filters: searchQuery.filters || {}
    };
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => listing.userId === userId);
  }

  async getAllListings(): Promise<Listing[]> {
    try {
      // First try to get from database
      const searchResult = await this.databaseService.searchListings({
        query: '',
        filters: {},
        page: 1,
        limit: 100 // Get all listings
      });

      if (searchResult.listings.length > 0) {
        return searchResult.listings;
      }

      // Fallback to in-memory data if database is empty
      return Array.from(this.listings.values());
    } catch (error) {
      console.error('Error fetching listings from database:', error);
      // Fallback to in-memory data on error
      return Array.from(this.listings.values());
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
