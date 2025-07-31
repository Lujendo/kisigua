import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import AdminPanel from './admin/AdminPanel';
import LocationDetail from './locations/LocationDetail';
import Map from './Map';

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
  lastViewed?: string;
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

const Dashboard = ({ onNavigateToMyListings }: DashboardProps) => {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const [recentlyViewed, setRecentlyViewed] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Show 8 items per page

  // Sorting State
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'price' | 'distance' | 'newest' | 'popular'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'map'>('list');

  // Fetch real data from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data = await response.json();

        // Transform API data to match Location interface
        const transformedLocations: Location[] = data.listings.map((listing: {
          id: string;
          title: string;
          description: string;
          category: string;
          location?: { address?: string; city?: string; country?: string; latitude?: number; longitude?: number };
          images?: string[];
          priceRange?: string;
          tags?: string[];
          userId: string;
          createdAt: string;
          isCertified?: boolean;
          views?: number;
        }) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          location: {
            address: listing.location?.address || '',
            city: listing.location?.city || '',
            country: listing.location?.country || '',
            coordinates: {
              lat: listing.location?.latitude || 0,
              lng: listing.location?.longitude || 0
            }
          },
          images: listing.images || [],
          thumbnail: listing.images?.[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
          rating: 4.5, // Default rating since not in database
          reviews: Math.floor(Math.random() * 50) + 10, // Mock reviews
          price: listing.priceRange === 'low' ? 10 : listing.priceRange === 'medium' ? 25 : listing.priceRange === 'high' ? 50 : undefined,
          priceType: listing.priceRange ? 'paid' : 'free',
          tags: listing.tags || [],
          createdBy: listing.userId,
          createdAt: listing.createdAt,
          isVerified: listing.isCertified || false,
          isFeatured: false, // Default to false
          views: listing.views || 0,
          lastViewed: undefined
        }));

        setLocations(transformedLocations);
        setFilteredLocations(transformedLocations);

        // Set recently viewed (first 3 items as mock)
        setRecentlyViewed(transformedLocations.slice(0, 3));

      } catch (error) {
        console.error('Error fetching locations:', error);
        // Set empty array on error instead of mock data
        setLocations([]);
        setFilteredLocations([]);
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    };

    // Mock search history
    const mockSearchHistory: SearchHistory[] = [
      {
        id: '1',
        query: 'organic farm',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        results: 3
      },
      {
        id: '2',
        query: 'water source',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        results: 2
      }
    ];
    setSearchHistory(mockSearchHistory);

    fetchLocations();
  }, []);

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
          // Mock distance calculation - in real app, calculate from user location
          aValue = Math.random() * 50; // Random distance for demo
          bValue = Math.random() * 50;
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

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    setCurrentPage(1); // Reset to first page when searching

    // Simulate API call delay
    setTimeout(() => {
      let filtered: Location[];

      if (!query.trim()) {
        filtered = locations;
      } else {
        filtered = locations.filter(location =>
          location.title.toLowerCase().includes(query.toLowerCase()) ||
          location.description.toLowerCase().includes(query.toLowerCase()) ||
          location.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          location.location.city.toLowerCase().includes(query.toLowerCase())
        );

        // Add to search history
        const newHistoryItem: SearchHistory = {
          id: Date.now().toString(),
          query: query.trim(),
          timestamp: new Date().toISOString(),
          results: filtered.length
        };
        setSearchHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
      }

      // Apply sorting
      const sortedFiltered = applySorting(filtered);
      setFilteredLocations(sortedFiltered);
      setLoading(false);
    }, 300);
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
    // Update recently viewed
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      const updatedLocation = { ...location, lastViewed: new Date().toISOString() };
      setRecentlyViewed(prev => {
        const filtered = prev.filter(loc => loc.id !== locationId);
        return [updatedLocation, ...filtered.slice(0, 4)];
      });
    }
    setSelectedLocation(locationId);
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
          {/* Search Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg text-white p-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Discover Sustainable Locations</h1>
              <p className="text-green-100 text-lg mb-6">
                Find eco-friendly places, organic farms, sustainable businesses, and more in your community
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Search for organic farms, water sources, sustainable businesses..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-6 py-4 text-gray-900 bg-white rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300 text-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{locations.length}</div>
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'All Locations'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredLocations.length} {filteredLocations.length === 1 ? 'location' : 'locations'} found
                  </p>
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
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors"
                    >
                      <option value="relevance-desc">Relevance</option>
                      <option value="rating-desc">Rating: High to Low</option>
                      <option value="rating-asc">Rating: Low to High</option>
                      <option value="newest-desc">Newest First</option>
                      <option value="popular-desc">Most Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
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
                      onClick={() => setViewMode('list')}
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
                      onClick={() => setViewMode('cards')}
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
                      onClick={() => setViewMode('map')}
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
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Searching...</span>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? `No results for "${searchQuery}". Try different keywords.` : 'No locations available at the moment.'}
                  </p>
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
                        center={mapCenter}
                        zoom={validLocations.length > 1 ? 10 : 13}
                        height="384px"
                        markers={markers}
                        onMarkerClick={(marker) => {
                          const location = validLocations.find(loc => loc.title === marker.title);
                          if (location) handleLocationClick(location.id);
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
                            onError={(e) => {
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

                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {location.location.city}, {location.location.country}
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
                          onError={(e) => {
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

                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {location.location.city}, {location.location.country}
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
