import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePerformance } from '../contexts/PerformanceContext';
import useOptimizedFetch from '../hooks/useOptimizedFetch';
import AdminPanel from './admin/AdminPanel';
import LocationDetail from './locations/LocationDetail';
import Map from './Map';
import LocationSearchInput from './search/LocationSearchInput';
import LocationFilters from './search/LocationFilters';
import EnhancedSearchInput from './search/EnhancedSearchInput';
import SearchHistory from './search/SearchHistory';
import { LocationFilters as LocationFiltersType, LocationSearchResult } from '../types/location';

interface Location {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  images: string[];
  thumbnail: string;
  rating: number;
  reviews: number;
  price?: number;
  priceType: 'free' | 'paid' | 'donation';
  tags: string[];
  createdBy: string;
  createdAt: string;
  isVerified: boolean;
  isFeatured: boolean;
  views: number;
  favorites: number;
  lastViewed?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  results: number;
}

interface DashboardProps {
  onNavigateToSearch?: () => void;
  onNavigateToSubscription?: () => void;
  onNavigateToMyListings?: () => void;
}

// Transform API listings to Location format
const transformListingsToLocations = (listings: any[]): Location[] => {
  return listings.map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    location: {
      address: listing.address || '',
      city: listing.city || '',
      country: listing.country || '',
      coordinates: {
        lat: listing.latitude || 0,
        lng: listing.longitude || 0
      }
    },
    images: listing.images || [],
    thumbnail: listing.images?.[0] || '/api/placeholder/300/200',
    rating: listing.rating || 0,
    reviews: listing.reviewCount || 0,
    price: listing.price,
    priceType: listing.price ? 'paid' : 'free',
    tags: listing.tags || [],
    createdBy: listing.user_id || listing.userId,
    createdAt: listing.created_at || listing.createdAt,
    isVerified: listing.is_certified || false,
    isFeatured: false,
    views: listing.views || 0,
    favorites: 0,
    lastViewed: undefined,
    contact: {
      email: listing.contact_email || '',
      phone: listing.contact_phone || '',
      website: listing.contact_website || ''
    }
  }));
};

const Dashboard = ({ onNavigateToMyListings }: DashboardProps) => {
  const { user, token } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getFromCache, setCache, isLoading } = usePerformance();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  // OPTIMIZED: Use optimized fetch for listings with caching
  const {
    data: listings,
    loading: locationsLoading
  } = useOptimizedFetch<any>('/api/listings', {
    method: 'GET',
    cache: true,
    cacheTTL: 10 * 60 * 1000, // 10 minutes cache
    immediate: true,
    onSuccess: (data) => {
      console.log('⚡ Dashboard listings loaded from optimized fetch:', data?.listings?.length || 0);
      // Transform API data to Location format
      const transformedLocations = transformListingsToLocations(data?.listings || []);
      setFilteredLocations(transformedLocations);
    }
  });

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState(''); // Category filtering - can be extended later
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const [recentlyViewed, setRecentlyViewed] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Combine loading states for UI
  const isPageLoading = locationsLoading || isLoading('search-history') || loading;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Show 8 items per page

  // Sorting State
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'price' | 'distance' | 'newest' | 'popular'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'map'>('list');
  const [userSelectedView, setUserSelectedView] = useState(false); // Track if user explicitly selected a view

  // Wrapper function for user-initiated view changes
  const handleUserViewChange = (newViewMode: 'list' | 'cards' | 'map') => {
    setViewMode(newViewMode);
    setUserSelectedView(true); // Mark that user has explicitly chosen a view
    console.log(`🎯 User explicitly selected view: ${newViewMode}`);
  };

  // Location-based search states
  const [locationSearch, setLocationSearch] = useState('');
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Enhanced location filtering state
  const [locationFilters, setLocationFilters] = useState<LocationFiltersType>({
    radius: 10,
    country: 'Germany' // Default to Germany
  });
  const [showLocationFilters, setShowLocationFilters] = useState(false);

  // Search History State
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // Detail card states
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showDetailCard, setShowDetailCard] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Enhanced geocoding using the new service
  /* const geocodeLocation = async (locationName: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const result = await GeocodingService.geocode(locationName, {
        preferredCountry: 'Germany',
        useCache: true
      });

      if (result) {
        return result.coordinates;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }; */

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationSearch('Current Location');
          setIsGettingLocation(false);

          // Respect user's explicit view choice - never override it
          if (!userSelectedView) {
            console.log(`📍 Got location, no explicit view selected, keeping: ${viewMode}`);
          } else {
            console.log(`📍 Got location, user has selected view: ${viewMode}, respecting their choice`);
          }

          console.log(`📍 Got user location: ${latitude}, ${longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
          alert('Unable to get your location. Please enter a location manually.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setIsGettingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle location search by city name
  /* const handleLocationSearch = async () => {
    if (!locationSearch.trim()) {
      setUserLocation(null);
      handleSearch(searchQuery);
      return;
    }

    console.log(`🔍 Searching for location: ${locationSearch}`);

    // Try to geocode the location
    const coordinates = await geocodeLocation(locationSearch);
    if (coordinates) {
      setUserLocation(coordinates);
      console.log(`✅ Found coordinates for ${locationSearch}:`, coordinates);

      // Auto-switch to map view for better location search experience
      setViewMode('map');

      handleSearch(searchQuery);
    } else {
      console.log(`❌ Could not find coordinates for ${locationSearch}`);
      alert(`Could not find location "${locationSearch}". Try entering a major German city name.`);
    }
  }; */

  // Enhanced location search handlers
  const handleEnhancedLocationSelect = (location: LocationSearchResult) => {
    console.log(`🔍 Enhanced location selected:`, location);

    setUserLocation(location.coordinates);
    setLocationSearch(location.displayName);

    // Update location filters
    setLocationFilters(prev => ({
      ...prev,
      country: location.hierarchy.country,
      countryCode: location.hierarchy.countryCode,
      region: location.hierarchy.region,
      city: location.hierarchy.city,
      coordinates: location.coordinates
    }));

    // Respect user's explicit view choice - never override it
    if (!userSelectedView) {
      console.log(`🎯 No explicit view selected, keeping default view: ${viewMode}`);
    } else {
      console.log(`🎯 User has selected view: ${viewMode}, respecting their choice`);
    }

    // Don't automatically trigger search - let user click search button
    console.log(`📍 Location set to: ${location.displayName}. User can now click search to apply location filter.`);
  };

  const handleLocationFiltersChange = (filters: LocationFiltersType) => {
    console.log(`🔍 Location filters changed:`, filters);
    setLocationFilters(filters);

    // Update search radius for backward compatibility
    setSearchRadius(filters.radius);

    // If coordinates are set, update user location
    if (filters.coordinates) {
      setUserLocation(filters.coordinates);
    }

    // Don't automatically trigger search - let user click search button
    console.log(`🔧 Location filters updated. User can click search to apply changes.`);
  };

  // OLD FETCH FUNCTION REMOVED - using optimized fetch hook

    // OPTIMIZED: Load search history with caching
    const loadSearchHistory = () => {
      try {
        // Check performance cache first
        const cached = getFromCache<SearchHistory[]>('search-history');
        if (cached) {
          setSearchHistory(cached);
          return;
        }

        const stored = localStorage.getItem('kisigua_search_history');
        if (stored) {
          const history = JSON.parse(stored);
          const recentHistory = history.slice(0, 10); // Keep last 10
          setSearchHistory(recentHistory);
          // Cache for 30 minutes
          setCache('search-history', recentHistory, 30 * 60 * 1000);
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };

  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory();
  }, [getFromCache, setCache]);

  // Load recently viewed after listings are loaded
  useEffect(() => {
    if (listings && listings.listings && listings.listings.length > 0) {
      const transformedLocations = transformListingsToLocations(listings.listings);
      setFilteredLocations(transformedLocations);
      const loadRecentlyViewed = () => {
        try {
          const stored = localStorage.getItem('kisigua_recently_viewed');
          if (stored) {
            const recentIds = JSON.parse(stored);
            const recentItems = transformedLocations.filter(loc => recentIds.includes(loc.id));
            setRecentlyViewed(recentItems.slice(0, 5));
          }
        } catch (error) {
          console.error('Error loading recently viewed:', error);
        }
      };
      loadRecentlyViewed();
    }
  }, [listings]);

  // Remove automatic re-search on location changes to prevent interference
  // Users will manually trigger search using the search button

  if (!user) {
    return null;
  }

  const getRolePermissions = () => {
    switch (user.role) {
      case 'admin':
        return {
          canCreateListings: true,
          canEditAllListings: true,
          canAccessAdminDashboard: true,
          canManageUsers: true,
          maxListingsPerMonth: 'Unlimited',
        };
      case 'premium':
        return {
          canCreateListings: true,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 50,
        };
      case 'supporter':
        return {
          canCreateListings: true,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 10,
        };
      default:
        return {
          canCreateListings: false,
          canEditAllListings: false,
          canAccessAdminDashboard: false,
          canManageUsers: false,
          maxListingsPerMonth: 0,
        };
    }
  };

  const permissions = getRolePermissions();

  // Sorting functionality
  const applySorting = (locationsToSort: Location[]) => {
    const sorted = [...locationsToSort].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'distance':
          // Calculate real distance from user location if available
          if (userLocation) {
            aValue = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              a.location.coordinates.lat,
              a.location.coordinates.lng
            );
            bValue = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              b.location.coordinates.lat,
              b.location.coordinates.lng
            );
          } else {
            // If no user location, sort by creation date as fallback
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
          }
          break;
        case 'newest':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'popular':
          aValue = a.views + (a.reviews * 2); // Popularity score
          bValue = b.views + (b.reviews * 2);
          break;
        case 'relevance':
        default:
          // Relevance: featured first, then by rating, then by views
          if (a.isFeatured !== b.isFeatured) {
            return b.isFeatured ? 1 : -1;
          }
          if (a.rating !== b.rating) {
            return b.rating - a.rating;
          }
          aValue = a.views;
          bValue = b.views;
          break;
      }

      if (sortBy === 'relevance') {
        return bValue - aValue; // Always desc for relevance
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  };

  // Unified search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    setCurrentPage(1); // Reset to first page when searching

    try {
      // Determine search type based on user role and query
      const shouldUseAISearch = user && ['admin', 'premium', 'supporter'].includes(user.role) && query.trim().length > 0;

      let searchResults = [];

      if (shouldUseAISearch) {
        // Use hybrid search for premium users with AI capabilities
        console.log('🤖 Using AI hybrid search for premium user');
        searchResults = await performHybridSearch(query);
      } else {
        // Use traditional search for free users or empty queries
        console.log('🔍 Using traditional search');
        searchResults = await performTraditionalSearch(query);
      }

      // Transform search results to Location format if needed
      const transformedResults = searchResults.map(transformSearchResultToLocation);

      // Apply client-side location filtering if coordinates are set
      let filtered = transformedResults;
      if (locationFilters.coordinates || userLocation) {
        const searchCoords = locationFilters.coordinates || userLocation;
        if (searchCoords) {
          console.log(`🗺️ Applying location filter: radius: ${locationFilters.radius}km`);
          filtered = filtered.filter((location: Location) => {
            const distance = calculateDistance(
              searchCoords.lat,
              searchCoords.lng,
              location.location.coordinates.lat,
              location.location.coordinates.lng
            );
            return distance <= locationFilters.radius;
          });
        }
      }

      // Add to search history if there was a text query
      if (query.trim()) {
        const searchText = locationSearch ? `"${query}" near ${locationSearch} (${searchRadius}km)` : query.trim();
        const newHistoryItem: SearchHistory = {
          id: Date.now().toString(),
          query: searchText,
          timestamp: new Date().toISOString(),
          results: filtered.length
        };

        // Update state and localStorage
        const updatedHistory = [newHistoryItem, ...searchHistory.slice(0, 9)]; // Keep last 10
        setSearchHistory(updatedHistory);

        try {
          localStorage.setItem('kisigua_search_history', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error('Error saving search history:', error);
        }
      }

      // Apply sorting and update state
      const sortedFiltered = applySorting(filtered);
      setFilteredLocations(sortedFiltered);

    } catch (error) {
      console.error('Search error:', error);
      // Show empty results on search error
      setFilteredLocations([]);
      // You could also show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  // Traditional search implementation
  const performTraditionalSearch = async (query: string) => {
    const searchPayload = {
      query: query.trim() || undefined,
      filters: {
        ...(selectedCategory && { category: selectedCategory }),
        ...(locationFilters.coordinates && {
          location: {
            latitude: locationFilters.coordinates.lat,
            longitude: locationFilters.coordinates.lng,
            radius: locationFilters.radius || 25
          }
        })
      },
      page: 1,
      limit: 100
    };

    console.log('🔍 Traditional search payload:', JSON.stringify(searchPayload, null, 2));

    try {
      const response = await fetch('/api/listings/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        throw new Error(`Traditional search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.listings || [];
    } catch (error) {
      console.error('Traditional search failed:', error);
      throw error; // Re-throw to be handled by main search function
    }
  };

  // AI hybrid search implementation
  const performHybridSearch = async (query: string) => {
    const searchPayload = {
      query: query.trim(),
      limit: 100,
      minScore: 0.6,
      ...(selectedCategory && { category: selectedCategory }),
      ...(locationFilters.coordinates && {
        location: {
          latitude: locationFilters.coordinates.lat,
          longitude: locationFilters.coordinates.lng,
          radius: locationFilters.radius || 25
        }
      })
    };

    console.log('🤖 AI hybrid search payload:', JSON.stringify(searchPayload, null, 2));

    try {
      const response = await fetch('/api/listings/hybrid-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        throw new Error(`Hybrid search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.combinedResults || [];
    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw error; // Re-throw to be handled by main search function
    }
  };

  // Handle clear all search and filters
  const handleClearAll = () => {
    setSearchQuery('');
    setLocationSearch('');
    setLocationFilters({
      radius: 10,
      country: 'Germany' // Keep default country
    });
    setUserLocation(null);
    setCurrentPage(1);
    // Reset to show all locations
    if (listings && listings.listings) {
      const transformedLocations = transformListingsToLocations(listings.listings);
      setFilteredLocations(transformedLocations);
    } else {
      setFilteredLocations([]);
    }
    // Hide any open panels
    setShowLocationFilters(false);
    setShowSearchHistory(false);
  };



  // Transform search result to Location format
  const transformSearchResultToLocation = (result: any): Location => {
    // Handle both traditional search results and AI search results
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      category: result.category,
      location: {
        address: result.location?.address || `${result.location?.city || ''}, ${result.location?.country || ''}`,
        city: result.location?.city || '',
        country: result.location?.country || '',
        coordinates: {
          lat: result.location?.latitude || result.location?.coordinates?.lat || 0,
          lng: result.location?.longitude || result.location?.coordinates?.lng || 0
        }
      },
      images: result.images || [],
      thumbnail: result.thumbnail || (result.images && result.images[0]) || '/placeholder-image.jpg',
      price: result.price || 0,
      priceType: (result.priceType || result.price_type || 'free') as 'free' | 'paid' | 'donation',
      rating: result.rating || 0,
      reviews: result.reviews || 0,
      tags: result.tags || [],
      views: result.views || 0,
      favorites: result.favorites || 0,
      isVerified: result.isVerified || result.is_verified || false,
      isFeatured: result.isFeatured || result.is_featured || false,
      createdBy: result.userId || result.user_id || '',
      createdAt: result.createdAt || result.created_at || new Date().toISOString(),
      contact: {
        phone: result.contactInfo?.phone || result.contact?.phone,
        email: result.contactInfo?.email || result.contact?.email,
        website: result.contactInfo?.website || result.contact?.website
      }
    };
  };

  // Handle sorting change
  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder?: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    }
    setCurrentPage(1); // Reset to first page when sorting

    // Re-apply sorting to current results
    const sortedLocations = applySorting(filteredLocations);
    setFilteredLocations(sortedLocations);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredLocations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.querySelector('.dashboard-results')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLocationClick = (locationId: string) => {
    // Update recently viewed in localStorage
    try {
      const stored = localStorage.getItem('kisigua_recently_viewed');
      let recentIds = stored ? JSON.parse(stored) : [];

      // Remove if already exists and add to front
      recentIds = recentIds.filter((id: string) => id !== locationId);
      recentIds.unshift(locationId);

      // Keep only last 10 items
      recentIds = recentIds.slice(0, 10);

      localStorage.setItem('kisigua_recently_viewed', JSON.stringify(recentIds));

      // Update recently viewed state
      const transformedLocations = listings && listings.listings ? transformListingsToLocations(listings.listings) : [];
      const recentItems = transformedLocations.filter(loc => recentIds.includes(loc.id));
      setRecentlyViewed(recentItems.slice(0, 5));
    } catch (error) {
      console.error('Error updating recently viewed:', error);
    }

    // Show detail card
    setSelectedLocationId(locationId);
    setShowDetailCard(true);
    // Scroll to top to show the detail card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditLocation = (locationId: string) => {
    // Close the location detail modal
    setSelectedLocation(null);
    // Navigate to My Listings page where the edit functionality is
    if (onNavigateToMyListings) {
      onNavigateToMyListings();
      // Store the location ID to edit in localStorage so MyListingsPage can pick it up
      localStorage.setItem('editLocationId', locationId);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Detail Card Component (similar to MyListings card style)
  const DetailCard: React.FC<{ location: Location }> = ({ location }) => (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-6">
      {/* Header with close button */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Listing Details</h2>
        <button
          onClick={() => {
            setShowDetailCard(false);
            setSelectedLocationId(null);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image section */}
          <div className="relative">
            <img
              src={location.images?.[0] || location.thumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'}
              alt={location.title}
              className="w-full h-64 lg:h-80 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop';
              }}
            />
            {location.isVerified && (
              <div className="absolute top-3 right-3 bg-blue-600 text-white p-2 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Details section */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{location.title}</h1>
              <p className="text-gray-600 leading-relaxed">{location.description}</p>
            </div>

            {/* Location and distance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{location.location.city}, {location.location.country}</span>
              </div>
              {userLocation && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                  {calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    location.location.coordinates.lat,
                    location.location.coordinates.lng
                  ).toFixed(1)} km away
                </span>
              )}
            </div>

            {/* Rating and price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(location.rating)}
                  <span className="text-sm text-gray-600 ml-2">({location.reviews} reviews)</span>
                </div>
              </div>
              <div className="text-right">
                {location.priceType === 'paid' && location.price && (
                  <div className="text-2xl font-bold text-green-600">€{location.price}</div>
                )}
                {location.priceType === 'free' && (
                  <div className="text-2xl font-bold text-green-600">Free</div>
                )}
                {location.priceType === 'donation' && (
                  <div className="text-2xl font-bold text-blue-600">Donation</div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {location.views} views
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {location.favorites} favorites
              </div>
            </div>

            {/* Tags */}
            {location.tags && location.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {location.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Contact information */}
            {location.contact && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                {location.contact.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${location.contact.email}`} className="hover:text-green-600">
                      {location.contact.email}
                    </a>
                  </div>
                )}
                {location.contact.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${location.contact.phone}`} className="hover:text-green-600">
                      {location.contact.phone}
                    </a>
                  </div>
                )}
                {location.contact.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <a href={location.contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs for Admin */}
      {permissions.canAccessAdminDashboard && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin Panel
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'admin' && permissions.canAccessAdminDashboard ? (
        <AdminPanel />
      ) : (
        <div className="space-y-6">
          {/* Detail Card */}
          {showDetailCard && selectedLocationId && (
            <DetailCard
              location={filteredLocations.find(loc => loc.id === selectedLocationId)!}
            />
          )}

          {/* Search Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg text-white p-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Discover Sustainable Locations</h1>
              <p className="text-green-100 text-lg mb-6">
                Find eco-friendly places, organic farms, sustainable businesses, and more in your community
              </p>

              {/* Compact Search Bar with Location */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-2">
                  {/* Enhanced Search Input with Autocomplete */}
                  <EnhancedSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                    placeholder={
                      user && ['admin', 'premium', 'supporter'].includes(user.role)
                        ? "AI-powered search: organic farms, water sources, sustainable businesses..."
                        : "Search for organic farms, water sources, sustainable businesses..."
                    }
                    showAIBadge={user && ['admin', 'premium', 'supporter'].includes(user.role)}
                    className="flex-1"
                  />

                  {/* Location Search */}
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-1 min-w-[200px]">
                      <LocationSearchInput
                        placeholder="Location..."
                        value={locationSearch}
                        onLocationSelect={handleEnhancedLocationSelect}
                        showSuggestions={true}
                        includeMinorLocations={true}
                        className="w-full px-4 py-3 text-gray-900 bg-transparent rounded-full focus:outline-none text-sm"
                      />
                      <button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                        title="Use current location"
                      >
                        {isGettingLocation ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Distance Range */}
                    <select
                      value={locationFilters.radius}
                      onChange={(e) => handleLocationFiltersChange({ ...locationFilters, radius: Number(e.target.value) })}
                      className="px-3 py-3 border-0 bg-transparent rounded-full focus:outline-none text-sm text-gray-700 min-w-[80px]"
                    >
                      <option value={1}>1km</option>
                      <option value={2}>2km</option>
                      <option value={5}>5km</option>
                      <option value={10}>10km</option>
                      <option value={20}>20km</option>
                      <option value={50}>50km</option>
                      <option value={100}>100km</option>
                    </select>

                    {/* Search Button */}
                    <button
                      onClick={() => handleSearch(searchQuery)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                  </div>
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    { label: 'Organic', icon: 'leaf', filter: 'organic' },
                    { label: 'Water Sources', icon: 'droplet', filter: 'water' },
                    { label: 'Free', icon: 'shield-check', filter: 'free' },
                    { label: 'Nearby', icon: 'location-marker', filter: 'nearby' },
                    { label: 'Markets', icon: 'shopping-cart', filter: 'market' },
                    { label: 'Crafts', icon: 'paint-brush', filter: 'craft' }
                  ].map((quickFilter) => (
                    <button
                      key={quickFilter.filter}
                      onClick={() => {
                        const filterQuery = quickFilter.filter === 'nearby'
                          ? (userLocation ? searchQuery : 'nearby locations')
                          : quickFilter.filter === 'free'
                          ? 'free'
                          : quickFilter.filter === 'organic'
                          ? 'organic'
                          : quickFilter.filter === 'water'
                          ? 'water sources'
                          : quickFilter.filter === 'market'
                          ? 'local markets'
                          : 'crafts';

                        setSearchQuery(filterQuery);
                        handleSearch(filterQuery);
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {quickFilter.icon === 'leaf' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 5.5 13.5 3M7 7l2.5 2.5L7 12.5 4.5 10M13 13l2.5 2.5L13 18.5 10.5 16M21 21l-2.5-2.5L21 15.5 23.5 18" />
                        )}
                        {quickFilter.icon === 'droplet' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25c0-1.5 1.5-3 3.75-3s3.75 1.5 3.75 3-1.5 3-3.75 3-3.75-1.5-3.75-3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.25c-1.5 0-3 1.5-3 3.75 0 2.25 3 6.75 3 6.75s3-4.5 3-6.75c0-2.25-1.5-3.75-3-3.75z" />
                          </>
                        )}
                        {quickFilter.icon === 'shield-check' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        )}
                        {quickFilter.icon === 'location-marker' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </>
                        )}
                        {quickFilter.icon === 'shopping-cart' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-7.5 0h7.5" />
                        )}
                        {quickFilter.icon === 'paint-brush' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 5H5v12a2 2 0 002 2 2 2 0 002-2V5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l4-4 4 4-4 4-4-4z" />
                          </>
                        )}
                      </svg>
                      <span>{quickFilter.label}</span>
                    </button>
                  ))}
                </div>

                {/* Advanced Options */}
                <div className="flex justify-center space-x-6 mt-3">
                  <button
                    onClick={() => setShowLocationFilters(!showLocationFilters)}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <span>{showLocationFilters ? 'Hide' : 'Show'} Filters</span>
                  </button>

                  <button
                    onClick={() => setShowSearchHistory(!showSearchHistory)}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{showSearchHistory ? 'Hide' : 'Show'} History</span>
                  </button>

                  {/* Clear All Button */}
                  {(searchQuery || locationSearch || Object.keys(locationFilters).some(key => key !== 'country' && locationFilters[key as keyof LocationFiltersType])) && (
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Enhanced Location Filters */}
                {showLocationFilters && (
                  <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <LocationFilters
                      filters={locationFilters}
                      onFiltersChange={handleLocationFiltersChange}
                      showAdvanced={true}
                    />
                  </div>
                )}

                {/* Search History */}
                {showSearchHistory && (
                  <div className="mt-4">
                    <SearchHistory
                      onSearchSelect={(query, filters) => {
                        setSearchQuery(query);
                        if (filters) {
                          // Apply any saved filters
                          if (filters.location) {
                            setLocationFilters(prev => ({ ...prev, ...filters.location }));
                          }
                        }
                        handleSearch(query);
                        setShowSearchHistory(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{listings?.listings?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Locations</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredLocations.length}</div>
              <div className="text-sm text-gray-600">Search Results</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{searchHistory.length}</div>
              <div className="text-sm text-gray-600">Recent Searches</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{recentlyViewed.length}</div>
              <div className="text-sm text-gray-600">Recently Viewed</div>
            </div>
          </div>

          {/* Search Results */}
          <div className="dashboard-results bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'All Locations'}
                    </h2>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          handleSearch('');
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                        title="Clear search"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}
                    {isPageLoading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        <span className="text-sm text-gray-500">Searching...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{filteredLocations.length}</span> {filteredLocations.length === 1 ? 'location' : 'locations'} found
                      {userLocation && (
                        <span className="ml-2 text-gray-700 font-medium">
                          • within {searchRadius} km of {locationSearch}
                        </span>
                      )}
                    </p>

                    {/* Search performance indicator */}
                    {!isPageLoading && searchQuery && (
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {user && ['admin', 'premium', 'supporter'].includes(user.role) ? 'AI-powered' : 'Standard'} search
                      </div>
                    )}
                  </div>

                  {userLocation && viewMode === 'map' && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Click anywhere on the map to set a new search location
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, 'asc' | 'desc'];
                        handleSortChange(newSortBy, newSortOrder);
                      }}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors min-w-[200px]"
                    >
                      <option value="relevance-desc">Best Match</option>
                      <option value="rating-desc">Highest Rated</option>
                      <option value="rating-asc">Lowest Rated</option>
                      <option value="newest-desc">Newest First</option>
                      <option value="popular-desc">Most Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      {userLocation && <option value="distance-asc">Nearest First</option>}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleUserViewChange('list')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                        viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => handleUserViewChange('cards')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                        viewMode === 'cards'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Card View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Cards</span>
                    </button>
                    <button
                      onClick={() => handleUserViewChange('map')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                        viewMode === 'map'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Map View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Searching locations...</h3>
                  <p className="text-gray-600 flex items-center justify-center space-x-2">
                    {user && ['admin', 'premium', 'supporter'].includes(user.role) ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Using AI-powered search for better results</span>
                      </>
                    ) : (
                      <span>Finding the best matches for you</span>
                    )}
                  </p>
                  <div className="mt-4 flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xs">!</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? `No results for "${searchQuery}". Try different keywords or expand your search area.` : 'No locations available at the moment.'}
                  </p>

                  {/* Suggestions for empty results */}
                  <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Try searching for:</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['organic farms', 'water sources', 'local markets', 'sustainable shops'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setSearchQuery(suggestion);
                            handleSearch(suggestion);
                          }}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : viewMode === 'map' ? (
                <div className="h-96 rounded-lg overflow-hidden">
                  {(() => {
                    // Filter locations with valid coordinates (allow 0 coordinates as they might be valid)
                    const validLocations = currentItems.filter(location =>
                      location.location.coordinates &&
                      typeof location.location.coordinates.lat === 'number' &&
                      typeof location.location.coordinates.lng === 'number' &&
                      !isNaN(location.location.coordinates.lat) &&
                      !isNaN(location.location.coordinates.lng) &&
                      // Only filter out obviously invalid coordinates
                      Math.abs(location.location.coordinates.lat) <= 90 &&
                      Math.abs(location.location.coordinates.lng) <= 180
                    );

                    console.log(`Dashboard Map: Found ${validLocations.length} locations with valid coordinates out of ${currentItems.length} total`);

                    // Calculate center point from valid locations
                    let mapCenter: [number, number] = [52.5200, 13.4050]; // Default to Berlin
                    if (validLocations.length > 0) {
                      const avgLat = validLocations.reduce((sum, loc) => sum + loc.location.coordinates.lat, 0) / validLocations.length;
                      const avgLng = validLocations.reduce((sum, loc) => sum + loc.location.coordinates.lng, 0) / validLocations.length;
                      mapCenter = [avgLat, avgLng];
                      console.log(`Dashboard Map: Calculated center at [${avgLat}, ${avgLng}]`);
                    }

                    const markers = validLocations.map(location => ({
                      position: [location.location.coordinates.lat, location.location.coordinates.lng] as [number, number],
                      title: location.title,
                      description: location.description
                    }));

                    console.log(`Dashboard Map: Created ${markers.length} markers`);

                    return (
                      <Map
                        center={userLocation ? [userLocation.lat, userLocation.lng] : mapCenter}
                        zoom={userLocation ? 12 : (validLocations.length > 1 ? 10 : 13)}
                        height="384px"
                        markers={markers}
                        searchLocation={userLocation || undefined}
                        searchRadius={searchRadius}
                        onMarkerClick={(marker) => {
                          const location = validLocations.find(loc => loc.title === marker.title);
                          if (location) handleLocationClick(location.id);
                        }}
                        onMapClick={async (lat, lng) => {
                          console.log(`🗺️ Map clicked at: ${lat}, ${lng}`);
                          setUserLocation({ lat, lng });
                          setLocationSearch(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                          // Trigger search with new location
                          handleSearch(searchQuery);
                        }}
                      />
                    );
                  })()}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-4">
                  {currentItems.map((location) => (
                    <div
                      key={location.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
                      onClick={() => handleLocationClick(location.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 relative">
                          <img
                            src={location.images?.[0] || location.thumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'}
                            alt={location.title}
                            className="w-24 h-24 object-cover rounded-lg"
                            onLoad={() => {
                              console.log(`✅ Dashboard List: Successfully loaded image for ${location.title}:`, location.images?.[0]);
                            }}
                            onError={(e) => {
                              console.error(`❌ Dashboard List: Failed to load image for ${location.title}:`, location.images?.[0]);
                              console.error('Error details:', e);
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(location.id);
                              }}
                              className={`p-1 rounded-full shadow-lg transition-colors ${
                                isFavorite(location.id)
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-white text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          {location.isVerified && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded-full">
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{location.title}</h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{location.description}</p>

                              <div className="flex items-center space-x-4 mb-2">
                                <div className="flex items-center">
                                  {renderStars(location.rating)}
                                  <span className="ml-1 text-sm text-gray-600">({location.reviews})</span>
                                </div>
                                <span className="text-sm font-medium text-green-600">
                                  {location.price ? `$${location.price}` : 'Free'}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  {location.category}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {location.location.city}, {location.location.country}
                                </div>
                                {userLocation && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                    {calculateDistance(
                                      userLocation.lat,
                                      userLocation.lng,
                                      location.location.coordinates.lat,
                                      location.location.coordinates.lng
                                    ).toFixed(1)} km away
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentItems.map((location) => (
                    <div
                      key={location.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleLocationClick(location.id)}
                    >
                      <div className="relative">
                        <img
                          src={location.images?.[0] || location.thumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'}
                          alt={location.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                          onLoad={() => {
                            console.log(`✅ Dashboard Grid: Successfully loaded image for ${location.title}:`, location.images?.[0]);
                          }}
                          onError={(e) => {
                            console.error(`❌ Dashboard Grid: Failed to load image for ${location.title}:`, location.images?.[0]);
                            console.error('Error details:', e);
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(location.id);
                            }}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                              isFavorite(location.id)
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-white text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        {location.isVerified && (
                          <div className="absolute top-3 left-3 bg-blue-600 text-white p-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{location.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{location.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {renderStars(location.rating)}
                            <span className="ml-1 text-sm text-gray-600">({location.reviews})</span>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            {location.price ? `$${location.price}` : 'Free'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {location.location.city}, {location.location.country}
                          </div>
                          {userLocation && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              {calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                location.location.coordinates.lat,
                                location.location.coordinates.lng
                              ).toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredLocations.length)} of {filteredLocations.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Detail Modal */}
      {selectedLocation && (
        <LocationDetail
          locationId={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onEdit={handleEditLocation}
        />
      )}
    </div>
  );
};

export default Dashboard;
