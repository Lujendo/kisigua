import React, { useState, useEffect } from 'react';

interface Location {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  thumbnail: string;
  rating: number;
  reviews: number;
  price?: number;
  priceType?: 'free' | 'paid' | 'donation';
  tags: string[];
  createdBy: string;
  createdAt: string;
  isVerified: boolean;
  isFeatured: boolean;
}

interface SearchFilters {
  query: string;
  category: string;
  priceType: string;
  rating: number;
  location: string;
  radius: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const EnhancedSearchPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'map'>('cards');
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    priceType: '',
    rating: 0,
    location: '',
    radius: 10,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const categories = [
    { id: '', label: 'All Categories' },
    { id: 'nature', label: 'Nature & Parks' },
    { id: 'culture', label: 'Cultural Sites' },
    { id: 'food', label: 'Local Food' },
    { id: 'accommodation', label: 'Accommodation' },
    { id: 'activities', label: 'Activities' },
    { id: 'services', label: 'Local Services' }
  ];

  const sortOptions = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'rating', label: 'Rating' },
    { id: 'distance', label: 'Distance' },
    { id: 'price', label: 'Price' },
    { id: 'newest', label: 'Newest' },
    { id: 'popular', label: 'Most Popular' }
  ];

  // Mock data for demonstration
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
        isFeatured: true
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
        isFeatured: false
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
        isFeatured: true
      }
    ];
    
    setLocations(mockLocations);
    setFilteredLocations(mockLocations);
  }, []);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (currentFilters: SearchFilters) => {
    let filtered = [...locations];

    // Apply search query
    if (currentFilters.query) {
      filtered = filtered.filter(location =>
        location.title.toLowerCase().includes(currentFilters.query.toLowerCase()) ||
        location.description.toLowerCase().includes(currentFilters.query.toLowerCase()) ||
        location.tags.some(tag => tag.toLowerCase().includes(currentFilters.query.toLowerCase()))
      );
    }

    // Apply category filter
    if (currentFilters.category) {
      filtered = filtered.filter(location => location.category === currentFilters.category);
    }

    // Apply price type filter
    if (currentFilters.priceType) {
      filtered = filtered.filter(location => location.priceType === currentFilters.priceType);
    }

    // Apply rating filter
    if (currentFilters.rating > 0) {
      filtered = filtered.filter(location => location.rating >= currentFilters.rating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (currentFilters.sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'newest':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'popular':
          aValue = a.reviews;
          bValue = b.reviews;
          break;
        default:
          // Relevance: featured first, then by rating
          if (a.isFeatured !== b.isFeatured) {
            return b.isFeatured ? 1 : -1;
          }
          aValue = a.rating;
          bValue = b.rating;
      }

      if (currentFilters.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredLocations(filtered);
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

  const LocationCard: React.FC<{ location: Location }> = ({ location }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative">
        <img
          src={location.thumbnail}
          alt={location.title}
          className="w-full h-48 object-cover"
        />
        {location.isFeatured && (
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
        {location.isVerified && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{location.title}</h3>
          <div className="flex items-center space-x-1">
            {renderStars(location.rating)}
            <span className="text-sm text-gray-600 ml-1">({location.reviews})</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{location.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location.location.city}, {location.location.country}
          </div>
          
          {location.priceType === 'paid' && location.price && (
            <div className="text-lg font-semibold text-green-600">
              €{location.price}
            </div>
          )}
          {location.priceType === 'free' && (
            <div className="text-lg font-semibold text-green-600">Free</div>
          )}
          {location.priceType === 'donation' && (
            <div className="text-lg font-semibold text-blue-600">Donation</div>
          )}
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
          {location.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{location.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Local Resources</h1>
          <p className="text-gray-600 mt-1">Find sustainable locations and experiences in your area</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search locations, activities, or services..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                <select
                  value={filters.priceType}
                  onChange={(e) => handleFilterChange('priceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="donation">Donation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.8}>4.8+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City or region"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Radius (km)</label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map(location => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredLocations.map(location => (
            <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex space-x-4">
                <img
                  src={location.thumbnail}
                  alt={location.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{location.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{location.description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center">
                          {renderStars(location.rating)}
                          <span className="text-sm text-gray-600 ml-1">({location.reviews})</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {location.location.city}
                        </div>
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
          ))}
        </div>
      )}

      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map View</h3>
              <p className="text-gray-600">Map integration coming soon with location markers and detailed views</p>
            </div>
          </div>
        </div>
      )}

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchPage;
