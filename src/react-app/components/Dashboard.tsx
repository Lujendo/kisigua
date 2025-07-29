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
}

const Dashboard = ({}: DashboardProps) => {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
        const transformedLocations: Location[] = data.listings.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          location: {
            address: listing.location.address,
            city: listing.location.city,
            country: listing.location.country,
            coordinates: {
              lat: listing.location.latitude,
              lng: listing.location.longitude
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
          isVerified: listing.isCertified,
          isFeatured: listing.featured || false,
          views: listing.views || 0,
          lastViewed: undefined
        }));

        setLocations(transformedLocations);
        setFilteredLocations(transformedLocations);

        // Set suggestions based on featured items
        setSuggestions(transformedLocations.filter(loc => loc.isFeatured || loc.rating >= 4.7));

        // Set recently viewed (first 3 items as mock)
        setRecentlyViewed(transformedLocations.slice(0, 3));

      } catch (error) {
        console.error('Error fetching locations:', error);
        // Fallback to mock data on error
        const mockLocations: Location[] = [
      {
        id: '1',
        title: 'Organic Farm Experience',
        description: 'Visit our sustainable organic farm and learn about permaculture practices. Enjoy fresh produce and connect with nature.',
        category: 'nature',
        location: {
          address: '123 Farm Road',
          city: 'Green Valley',
          country: 'Germany',
          coordinates: { lat: 52.5200, lng: 13.4050 }
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        rating: 4.8,
        reviews: 24,
        priceType: 'paid',
        price: 25,
        tags: ['organic', 'sustainable', 'educational'],
        createdBy: 'farmer-001',
        createdAt: '2024-01-15',
        isVerified: true,
        isFeatured: true,
        views: 124
      },
      {
        id: '2',
        title: 'Community Garden Workshop',
        description: 'Join our weekly community garden workshop. Learn to grow your own vegetables and herbs in an urban setting.',
        category: 'activities',
        location: {
          address: '456 Community St',
          city: 'Berlin',
          country: 'Germany',
          coordinates: { lat: 52.5170, lng: 13.3889 }
        },
        images: ['/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        rating: 4.6,
        reviews: 18,
        priceType: 'free',
        tags: ['community', 'gardening', 'workshop'],
        createdBy: 'community-001',
        createdAt: '2024-01-10',
        isVerified: true,
        isFeatured: false,
        views: 89
      },
      {
        id: '3',
        title: 'Traditional Cooking Class',
        description: 'Learn to cook traditional local dishes using ingredients from our region. Small groups, authentic recipes.',
        category: 'food',
        location: {
          address: '789 Kitchen Lane',
          city: 'Munich',
          country: 'Germany',
          coordinates: { lat: 48.1351, lng: 11.5820 }
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        rating: 4.9,
        reviews: 32,
        priceType: 'paid',
        price: 45,
        tags: ['cooking', 'traditional', 'local'],
        createdBy: 'chef-001',
        createdAt: '2024-01-08',
        isVerified: true,
        isFeatured: true,
        views: 156
      },
      {
        id: '4',
        title: 'Eco-Friendly Accommodation',
        description: 'Stay in our eco-friendly guesthouse powered by renewable energy. Perfect for sustainable travelers.',
        category: 'accommodation',
        location: {
          address: '321 Green Street',
          city: 'Hamburg',
          country: 'Germany',
          coordinates: { lat: 53.5511, lng: 9.9937 }
        },
        images: ['/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        rating: 4.7,
        reviews: 45,
        priceType: 'paid',
        price: 80,
        tags: ['eco-friendly', 'accommodation', 'renewable'],
        createdBy: 'host-001',
        createdAt: '2024-01-05',
        isVerified: true,
        isFeatured: false,
        views: 203
      },
      {
        id: '5',
        title: 'Local Art Gallery Tour',
        description: 'Discover local artists and their sustainable art practices. Interactive tour with the artists themselves.',
        category: 'culture',
        location: {
          address: '654 Art Avenue',
          city: 'Dresden',
          country: 'Germany',
          coordinates: { lat: 51.0504, lng: 13.7373 }
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        rating: 4.5,
        reviews: 28,
        priceType: 'donation',
        tags: ['art', 'culture', 'local'],
        createdBy: 'artist-001',
        createdAt: '2024-01-03',
        isVerified: true,
        isFeatured: false,
        views: 67
      }
        ];

        setLocations(mockLocations);

        // Apply default sorting (relevance)
        const sortedLocations = mockLocations.sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) {
            return b.isFeatured ? 1 : -1;
          }
          if (a.rating !== b.rating) {
            return b.rating - a.rating;
          }
          return b.views - a.views;
        });

        setFilteredLocations(sortedLocations);
        setSuggestions(mockLocations.filter(loc => loc.isFeatured || loc.rating >= 4.7));
        setRecentlyViewed(mockLocations.slice(0, 3));
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Discover Local Resources</h2>
                <p className="text-gray-600">Find sustainable locations and experiences in your area</p>
              </div>
              <div className="text-sm text-gray-500">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} available
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search locations, activities, or services..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    title="List view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    title="Map view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </button>
                </div>

                <span className="text-sm font-medium text-gray-700">Sort by:</span>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="price">Price</option>
                    <option value="distance">Distance</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Popular</option>
                  </select>

                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sort Order Toggle */}
              {sortBy !== 'relevance' && (
                <button
                  onClick={() => handleSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search History & Suggestions */}
          {!searchQuery && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Searches - Compact */}
              {searchHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Searches</h3>
                  <div className="space-y-1">
                    {searchHistory.slice(0, 3).map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleSearch(search.query)}
                        className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-sm text-gray-900">{search.query}</span>
                          </div>
                          <span className="text-xs text-gray-500">{search.results} results</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Viewed - Compact */}
              {recentlyViewed.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recently Viewed</h3>
                  <div className="space-y-1">
                    {recentlyViewed.slice(0, 3).map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location.id)}
                        className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={location.thumbnail}
                            alt={location.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{location.title}</h4>
                            <p className="text-xs text-gray-500">{location.location.city}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions for You - Compact */}
          {!searchQuery && suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested for You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {suggestions.map((location) => (
                  <div key={location.id} className="relative">
                    <button
                      onClick={() => handleLocationClick(location.id)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={location.thumbnail}
                        alt={location.title}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">{location.title}</h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">{location.location.city}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {renderStars(location.rating)}
                        </div>
                        {location.priceType === 'paid' && location.price && (
                          <span className="text-xs font-semibold text-green-600">€{location.price}</span>
                        )}
                        {location.priceType === 'free' && (
                          <span className="text-xs font-semibold text-green-600">Free</span>
                        )}
                      </div>
                    </button>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(location.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                        isFavorite(location.id)
                          ? 'text-red-500 hover:text-red-600 bg-white shadow-sm'
                          : 'text-gray-400 hover:text-red-500 bg-white shadow-sm'
                      }`}
                      title={isFavorite(location.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="w-4 h-4" fill={isFavorite(location.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results - List View with Thumbnails */}
          {(searchQuery || filteredLocations.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'All Locations'}
                    </h3>
                    <span className="text-sm text-gray-500 ml-4">
                      {filteredLocations.length} {filteredLocations.length === 1 ? 'location' : 'locations'}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-4">
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, 'asc' | 'desc'];
                          handleSortChange(newSortBy, newSortOrder);
                        }}
                        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="relevance-desc">Relevance</option>
                        <option value="rating-desc">Rating (High to Low)</option>
                        <option value="rating-asc">Rating (Low to High)</option>
                        <option value="newest-desc">Newest First</option>
                        <option value="popular-desc">Most Popular</option>
                        <option value="price-asc">Price (Low to High)</option>
                        <option value="price-desc">Price (High to Low)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'list'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="List View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'map'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="Map View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* List View */}
              {viewMode === 'list' && (
                <div className="divide-y divide-gray-200 dashboard-results">
                  {currentItems.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationClick(location.id)}
                    className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex space-x-4">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={location.thumbnail}
                          alt={location.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        {location.isFeatured && (
                          <div className="absolute -top-1 -right-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                            Featured
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{location.title}</h3>
                              {location.isVerified && (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{location.description}</p>

                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {location.location.city}, {location.location.country}
                              </div>

                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {location.views} views
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  {renderStars(location.rating)}
                                  <span className="text-sm text-gray-600 ml-1">({location.reviews})</span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {location.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  {location.priceType === 'paid' && location.price && (
                                    <div className="text-lg font-semibold text-green-600">€{location.price}</div>
                                  )}
                                  {location.priceType === 'free' && (
                                    <div className="text-lg font-semibold text-green-600">Free</div>
                                  )}
                                  {location.priceType === 'donation' && (
                                    <div className="text-lg font-semibold text-blue-600">Donation</div>
                                  )}
                                </div>

                                {/* Favorite Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(location.id);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${
                                    isFavorite(location.id)
                                      ? 'text-red-500 hover:text-red-600 bg-red-50'
                                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                  title={isFavorite(location.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <svg className="w-5 h-5" fill={isFavorite(location.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLocations.length)} of {filteredLocations.length} results
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Map View */}
              {viewMode === 'map' && (
                <div className="p-6">
                  {currentItems.length > 0 ? (
                    <Map
                      center={[52.5200, 13.4050]} // Default center (Berlin)
                      zoom={10}
                      height="500px"
                      markers={currentItems.map(location => ({
                        position: [location.location.coordinates.lat, location.location.coordinates.lng],
                        title: location.title,
                        description: `${location.location.city} • ${location.priceType === 'paid' && location.price ? `€${location.price}` : location.priceType === 'free' ? 'Free' : 'Donation'}`,
                        isMain: location.isFeatured
                      }))}
                      onMarkerClick={(marker) => {
                        const location = currentItems.find(loc =>
                          loc.location.coordinates.lat === marker.position[0] &&
                          loc.location.coordinates.lng === marker.position[1]
                        );
                        if (location) {
                          handleLocationClick(location.id);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No locations to display</h3>
                        <p className="text-gray-600">Try adjusting your search terms to see locations on the map.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls for Map View */}
              {viewMode === 'map' && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLocations.length)} of {filteredLocations.length} locations on map
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {filteredLocations.length === 0 && searchQuery && viewMode === 'list' && (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">Try adjusting your search terms or browse our suggestions above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location Detail Modal */}
      {selectedLocation && (
        <LocationDetail
          locationId={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
