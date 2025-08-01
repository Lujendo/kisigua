import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

import { usePerformance } from '../contexts/PerformanceContext';
import useOptimizedFetch from '../hooks/useOptimizedFetch';
import AdminPanel from './admin/AdminPanel';
import LocationDetail from './locations/LocationDetail';

import SearchHistory from './search/SearchHistory';
import CompactSearchCard from './search/CompactSearchCard';
import { LocationFilters as LocationFiltersType } from '../types/location';

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
  const { user, token: _token } = useAuth();

  const { getFromCache, setCache, isLoading: _isLoading } = usePerformance();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  // OPTIMIZED: Use optimized fetch for listings with caching
  const {
    data: listings,
    loading: _locationsLoading
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

  const [_selectedCategory] = useState(''); // Category filtering - can be extended later
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const [recentlyViewed, setRecentlyViewed] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [_loading, _setLoading] = useState(false);



  // Pagination State
  const [_currentPage, _setCurrentPage] = useState(1);
  const [_itemsPerPage] = useState(8); // Show 8 items per page

  // Sorting State
  const [_sortBy, _setSortBy] = useState<'relevance' | 'rating' | 'price' | 'distance' | 'newest' | 'popular'>('relevance');
  const [_sortOrder, _setSortOrder] = useState<'asc' | 'desc'>('desc');



  // Location-based search states

  const [_searchRadius] = useState(10); // km
  const [userLocation] = useState<{lat: number, lng: number} | null>(null);
  const [_locationSearch] = useState('');

  // const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Enhanced location filtering state
  const [_locationFilters] = useState<LocationFiltersType>({
    radius: 10,
    country: 'Germany' // Default to Germany
  });
  // const [showLocationFilters, setShowLocationFilters] = useState(false);

  // Search History State
  // const [showSearchHistory, setShowSearchHistory] = useState(false);

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
  /* const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationSearch('Current Location');
          setIsGettingLocation(false);

          // Respect user's explicit view choice - never override it
          // if (!userSelectedView) {
            console.log(`📍 Got location, no explicit view selected, keeping: ${viewMode}`);
          // } else {
          //   console.log(`📍 Got location, user has selected view: ${viewMode}, respecting their choice`);
          // }

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
  }; */

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
  /* const handleEnhancedLocationSelect = (location: LocationSearchResult) => {
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
    // if (!userSelectedView) {
      console.log(`🎯 No explicit view selected, keeping default view: ${viewMode}`);
    // } else {
    //   console.log(`🎯 User has selected view: ${viewMode}, respecting their choice`);
    // }

    // Don't automatically trigger search - let user click search button
    console.log(`📍 Location set to: ${location.displayName}. User can now click search to apply location filter.`);
  }; */

  /* const handleLocationFiltersChange = (filters: LocationFiltersType) => {
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
  }; */

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

  /*
  // Sorting functionality (commented out since we're using CompactSearchCard)
  const _applySorting = (locationsToSort: Location[]) => {
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
  */

  /*
  // Unified search functionality - commented out since we're using CompactSearchCard
  const _handleSearch = async (query: string) => {
    console.log('Search called with:', query);
  };
  */

  /*
  // Traditional search implementation - commented out
  const _performTraditionalSearch = async (query: string) => {
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
  */

  /*
  // AI hybrid search implementation - commented out
  const _performHybridSearch = async (query: string) => {
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
  */

  // Handle clear all search and filters
  /* const handleClearAll = () => {
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
    // setShowLocationFilters(false);
    // setShowSearchHistory(false);
  }; */



  /*
  // Transform search result to Location format - commented out
  const _transformSearchResultToLocation = (result: any): Location => {
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
  */

  /*
  // Handle sorting change - commented out
  const _handleSortChange = (newSortBy: typeof sortBy, newSortOrder?: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    }
    setCurrentPage(1); // Reset to first page when sorting

    // Re-apply sorting to current results
    const sortedLocations = applySorting(filteredLocations);
    setFilteredLocations(sortedLocations);
  };
  */

  /*
  // Pagination logic - commented out since we're using CompactSearchCard
  const _totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const _startIndex = (currentPage - 1) * itemsPerPage;
  const _endIndex = _startIndex + itemsPerPage;
  const _currentItems = filteredLocations.slice(_startIndex, _endIndex);

  const _handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.querySelector('.dashboard-results')?.scrollIntoView({ behavior: 'smooth' });
  };

  const _handleLocationClick = (locationId: string) => {
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
  */

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

          {/* Compact Search Card */}
          <CompactSearchCard
            onListingClick={(listing) => {
              // Handle listing click - could open detail view or navigate
              console.log('Listing clicked:', listing);
              // You can add navigation logic here
            }}
            className="mb-6"
          />

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

          {/* Enhanced Search with Listings */}
          <CompactSearchCard
            onListingClick={(listingId) => {
              // Navigate to listing detail
              setSelectedLocation(listingId);
            }}
            className="mb-6"
          />
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
