import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface LocationDetailProps {
  locationId: string;
  onClose: () => void;
  onEdit?: (locationId: string) => void;
}

const LocationDetail: React.FC<LocationDetailProps> = ({ locationId, onClose, onEdit }) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Mock data - in real app, fetch based on locationId
  const location: Location = {
    id: locationId,
    title: 'Organic Farm Experience',
    description: 'Experience sustainable farming practices at our certified organic farm. Learn about permaculture, participate in harvesting, and enjoy fresh organic produce.',
    category: 'Organic Farm',
    location: {
      address: 'Musterstraße 123',
      city: 'Berlin',
      country: 'Germany',
      coordinates: { lat: 52.5200, lng: 13.4050 }
    },
    images: [
      'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/organic-farm-1.jpg',
      'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/organic-farm-2.jpg',
      'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/organic-farm-3.jpg'
    ],
    rating: 4.8,
    reviews: 24,
    price: 25,
    priceType: 'paid',
    tags: ['organic', 'sustainable', 'educational', 'family-friendly'],
    createdBy: 'user123',
    createdAt: '2024-01-15',
    isVerified: true,
    isFeatured: true,
    views: 156
  };

  // Handle scroll indicator visibility
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 50) {
        setShowScrollIndicator(false);
      }
    };

    // Add scroll listener to the modal content
    const modalContent = document.querySelector('.location-detail-scroll');
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll);
      return () => modalContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Check if user can edit this listing
  const canEdit = user && (
    user.role === 'admin' ||
    user.id === location.createdBy
  );

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

  const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Contact form submitted:', formData);
      setShowContactForm(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Host</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Send Message
              </button>
              <button
                type="button"
                onClick={() => setShowContactForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{location.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {location.category} • {location.price ? `€${location.price}` : 'Free'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(location.rating)}
                  <span className="ml-1 text-sm text-gray-600">({location.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(locationId)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-2 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute top-20 right-4 z-10 opacity-50 animate-bounce transition-opacity duration-300">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m0 0l7-7" />
            </svg>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="location-detail-scroll flex-1 overflow-y-auto bg-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner relative">
          {/* Scroll gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none z-10"></div>
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photos
              </h3>
              {location.images && location.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={location.images[currentImageIndex]}
                      alt={location.title}
                      className="w-full h-96 object-cover rounded-xl shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop';
                      }}
                    />
                    {location.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? location.images.length - 1 : prev - 1)}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === location.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {location.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {location.images.length > 1 && (
                    <div className="grid grid-cols-6 gap-2">
                      {location.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden ${
                            index === currentImageIndex ? 'ring-2 ring-green-500' : ''
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${location.title} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium">No images available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    About This Place
                  </h3>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                      {location.category}
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {location.price ? `€${location.price}` : 'Free'}
                    </span>
                  </div>
                  <div className="prose max-w-none text-gray-700">
                    <p>{location.description}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h3>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <p className="text-gray-800 font-medium">
                      {location.location?.address || `${location.location?.city}, ${location.location?.country}`}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {location.tags && location.tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {location.tags.map((tag, index) => (
                        <span key={index} className="bg-gradient-to-r from-blue-100 to-green-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Contact Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {location.contact?.phone && (
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${location.contact.phone}`} className="text-green-600 hover:text-green-700">
                          {location.contact.phone}
                        </a>
                      </div>
                    )}
                    {location.contact?.email && (
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${location.contact.email}`} className="text-green-600 hover:text-green-700">
                          {location.contact.email}
                        </a>
                      </div>
                    )}
                    {location.contact?.website && (
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a href={location.contact.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Contact Host
                    </button>
                    <button className="w-full border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors">
                      Save to Favorites
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{location.views}</div>
                      <div className="text-sm text-blue-700">Views</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{location.reviews}</div>
                      <div className="text-sm text-green-700">Reviews</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Rating
                      </span>
                      <span className="font-medium text-gray-800">{location.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && <ContactForm />}
      </div>
    </div>
  );
};

export default LocationDetail;
