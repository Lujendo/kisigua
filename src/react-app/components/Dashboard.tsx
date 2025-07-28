import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel from './admin/AdminPanel';
import LocationDetail from './locations/LocationDetail';

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

  // Mock data initialization
  useEffect(() => {
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

    const mockSearchHistory: SearchHistory[] = [
      { id: '1', query: 'organic farming', timestamp: '2024-01-20', results: 12 },
      { id: '2', query: 'cooking classes', timestamp: '2024-01-19', results: 8 },
      { id: '3', query: 'sustainable accommodation', timestamp: '2024-01-18', results: 15 }
    ];

    setLocations(mockLocations);
    setFilteredLocations(mockLocations);
    setSearchHistory(mockSearchHistory);

    // Set suggestions based on user preferences and popular items
    setSuggestions(mockLocations.filter(loc => loc.isFeatured || loc.rating >= 4.7));

    // Set recently viewed (mock data)
    setRecentlyViewed(mockLocations.slice(0, 3));
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

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (!query.trim()) {
        setFilteredLocations(locations);
      } else {
        const filtered = locations.filter(location =>
          location.title.toLowerCase().includes(query.toLowerCase()) ||
          location.description.toLowerCase().includes(query.toLowerCase()) ||
          location.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          location.location.city.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredLocations(filtered);

        // Add to search history
        if (query.trim()) {
          const newHistoryItem: SearchHistory = {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: new Date().toISOString(),
            results: filtered.length
          };
          setSearchHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
        }
      }
      setLoading(false);
    }, 300);
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
            <div className="relative">
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
          </div>

          {/* Search History & Suggestions */}
          {!searchQuery && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
                  <div className="space-y-2">
                    {searchHistory.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleSearch(search.query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-900">{search.query}</span>
                          </div>
                          <span className="text-xs text-gray-500">{search.results} results</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Viewed</h3>
                  <div className="space-y-3">
                    {recentlyViewed.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={location.thumbnail}
                            alt={location.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{location.title}</h4>
                            <p className="text-xs text-gray-500">{location.location.city}</p>
                          </div>
                          <div className="flex items-center">
                            {renderStars(location.rating)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions for You */}
          {!searchQuery && suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested for You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationClick(location.id)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={location.thumbnail}
                      alt={location.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h4 className="font-medium text-gray-900 mb-1">{location.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{location.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(location.rating)}
                        <span className="text-xs text-gray-500 ml-1">({location.reviews})</span>
                      </div>
                      {location.priceType === 'paid' && location.price && (
                        <span className="text-sm font-semibold text-green-600">€{location.price}</span>
                      )}
                      {location.priceType === 'free' && (
                        <span className="text-sm font-semibold text-green-600">Free</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results - List View with Thumbnails */}
          {(searchQuery || filteredLocations.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Locations'}
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredLocations.map((location) => (
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredLocations.length === 0 && searchQuery && (
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
