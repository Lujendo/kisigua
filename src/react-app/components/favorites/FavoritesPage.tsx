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
  savedAt?: string;
}

interface FavoriteCollection {
  id: string;
  name: string;
  description: string;
  locations: string[];
  createdAt: string;
  isPublic: boolean;
  color: string;
}

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [collections, setCollections] = useState<FavoriteCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockFavorites: Location[] = [
      {
        id: '1',
        title: 'Organic Farm Experience',
        description: 'Visit our sustainable organic farm and learn about permaculture practices.',
        category: 'nature',
        location: {
          address: '123 Farm Road',
          city: 'Green Valley',
          country: 'Germany',
          coordinates: { lat: 52.5200, lng: 13.4050 }
        },
        images: ['/api/placeholder/400/300'],
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
        views: 124,
        savedAt: '2024-01-20'
      },
      {
        id: '3',
        title: 'Traditional Cooking Class',
        description: 'Learn to cook traditional local dishes using ingredients from our region.',
        category: 'food',
        location: {
          address: '789 Kitchen Lane',
          city: 'Munich',
          country: 'Germany',
          coordinates: { lat: 48.1351, lng: 11.5820 }
        },
        images: ['/api/placeholder/400/300'],
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
        views: 156,
        savedAt: '2024-01-18'
      }
    ];

    const mockCollections: FavoriteCollection[] = [
      {
        id: 'weekend-plans',
        name: 'Weekend Plans',
        description: 'Places I want to visit this weekend',
        locations: ['1'],
        createdAt: '2024-01-20',
        isPublic: false,
        color: 'bg-blue-500'
      },
      {
        id: 'food-spots',
        name: 'Food & Dining',
        description: 'Amazing local food experiences',
        locations: ['3'],
        createdAt: '2024-01-18',
        isPublic: true,
        color: 'bg-red-500'
      }
    ];

    setFavorites(mockFavorites);
    setCollections(mockCollections);
  }, []);

  const getFilteredFavorites = () => {
    if (selectedCollection === 'all') {
      return favorites;
    }
    
    const collection = collections.find(c => c.id === selectedCollection);
    if (!collection) return [];
    
    return favorites.filter(fav => collection.locations.includes(fav.id));
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

  const CreateCollectionModal: React.FC = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      isPublic: false,
      color: 'bg-green-500'
    });

    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-red-500', 'bg-purple-500',
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newCollection: FavoriteCollection = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        locations: [],
        createdAt: new Date().toISOString(),
        isPublic: formData.isPublic,
        color: formData.color
      };
      setCollections(prev => [...prev, newCollection]);
      setShowCreateCollection(false);
      setFormData({ name: '', description: '', isPublic: false, color: 'bg-green-500' });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Collection</h3>
              <button
                onClick={() => setShowCreateCollection(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Weekend Adventures"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your collection..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full ${color} ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Make this collection public
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Collection
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCollection(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const filteredFavorites = getFilteredFavorites();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-600 mt-1">Save and organize your favorite locations</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
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
          </div>

          <button
            onClick={() => setShowCreateCollection(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Collections Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Collections</h3>
          <span className="text-sm text-gray-500">
            {filteredFavorites.length} location{filteredFavorites.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCollection('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCollection === 'all'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
            }`}
          >
            All Favorites ({favorites.length})
          </button>
          
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedCollection === collection.id
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${collection.color}`}></div>
              <span>{collection.name} ({collection.locations.length})</span>
              {collection.isPublic && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c0 5-4 9-9 9m0 0c-5 0-9-4-9-9m9 9V3m0 0C7.02 3 3 7.02 3 12s4.02 9 9 9m0 0v9" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Grid/List */}
      {filteredFavorites.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((location) => (
              <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={location.thumbnail}
                    alt={location.title}
                    className="w-full h-48 object-cover"
                  />
                  <button className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  {location.isVerified && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{location.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{location.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {location.location.city}
                    </div>
                    
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {renderStars(location.rating)}
                      <span className="text-sm text-gray-600 ml-1">({location.reviews})</span>
                    </div>
                    
                    {location.savedAt && (
                      <span className="text-xs text-gray-500">
                        Saved {new Date(location.savedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {filteredFavorites.map((location) => (
              <div key={location.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                          {location.savedAt && (
                            <span className="text-xs text-gray-500">
                              Saved {new Date(location.savedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {location.priceType === 'paid' && location.price && (
                          <div className="text-lg font-semibold text-green-600">€{location.price}</div>
                        )}
                        {location.priceType === 'free' && (
                          <div className="text-lg font-semibold text-green-600">Free</div>
                        )}
                        {location.priceType === 'donation' && (
                          <div className="text-lg font-semibold text-blue-600">Donation</div>
                        )}
                        <button className="text-red-500 hover:text-red-600 p-1">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-4">Start exploring and save your favorite locations</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Discover Locations
          </button>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateCollection && <CreateCollectionModal />}
    </div>
  );
};

export default FavoritesPage;
