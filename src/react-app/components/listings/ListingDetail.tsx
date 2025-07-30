import React, { useState, useEffect } from 'react';
import Map from '../Map';
import { useAuth } from '../../contexts/AuthContext';

interface ListingDetailProps {
  listingId: string;
  onClose: () => void;
  onEdit?: (listingId: string) => void;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  userId: string;
  location: {
    street?: string;
    houseNumber?: string;
    city: string;
    region?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  contact?: {
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  images: string[];
  thumbnail?: string;
  price?: number;
  priceType?: 'free' | 'paid' | 'donation';
  tags: string[];
  status: 'draft' | 'published' | 'archived' | 'active' | 'inactive' | 'pending' | 'rejected';
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  inquiries?: number;
  favorites?: number;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listingId, onClose, onEdit }) => {
  const { user, token } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCover, setUpdatingCover] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Check if current user owns this listing
  const isOwner = user && listing && user.id === listing.userId;

  // Function to set cover image
  const handleSetCoverImage = async (imageIndex: number) => {
    if (!listing || !token || !isOwner) return;

    try {
      setUpdatingCover(true);
      const response = await fetch(`/api/listings/${listing.id}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverImageIndex: imageIndex
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update cover image');
      }

      // Update the local listing state to reflect the change
      const updatedListing = { ...listing };
      // Move the selected image to the front of the array
      const selectedImage = updatedListing.images[imageIndex];
      updatedListing.images.splice(imageIndex, 1);
      updatedListing.images.unshift(selectedImage);
      updatedListing.thumbnail = selectedImage;

      setListing(updatedListing);
      setCurrentImageIndex(0); // Reset to show the new cover image

      alert('Cover image updated successfully!');
    } catch (error) {
      console.error('Error updating cover image:', error);
      alert('Failed to update cover image. Please try again.');
    } finally {
      setUpdatingCover(false);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/listings/${listingId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch listing');
        }

        const data = await response.json();
        setListing(data.listing);
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError('Failed to load listing details');
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  // Handle scroll indicator visibility
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 50) {
        setShowScrollIndicator(false);
      }
    };

    // Add scroll listener to the modal content
    const modalContent = document.querySelector('.listing-detail-scroll');
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll);
      return () => modalContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      organic_farm: 'Organic Farm',
      local_product: 'Local Product',
      water_source: 'Water Source',
      vending_machine: 'Vending Machine',
      craft: 'Craft & Handmade',
      sustainable_good: 'Sustainable Good'
    };
    return categories[category] || category;
  };

  const getPriceDisplay = (listing: Listing) => {
    if (listing.priceType === 'free') return 'Free';
    if (listing.priceType === 'donation') return 'Donation';
    if (listing.priceType === 'paid' && listing.price) return `€${listing.price}`;
    return 'Contact for pricing';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error Loading Listing</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Not Found</h3>
          <p className="text-gray-600 mb-6">The listing you're looking for could not be found.</p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{listing.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getCategoryLabel(listing.category)} • {getPriceDisplay(listing)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
                {listing.isVerified && (
                  <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(listing.id)}
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

        <div className="listing-detail-scroll flex-1 overflow-y-auto bg-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 shadow-inner relative">
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
              {listing.images && listing.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-96 object-cover rounded-xl shadow-lg"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop';
                      }}
                    />
                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1)}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {/* Image counter */}
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}
                </div>

                  {/* Thumbnail Gallery */}
                  {listing.images.length > 1 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">All Photos</h4>
                      <div className="flex space-x-3 overflow-x-auto pb-2">
                        {listing.images.map((image, index) => (
                          <div key={index} className="flex-shrink-0">
                            <button
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                index === currentImageIndex
                                  ? 'border-green-500 shadow-lg scale-105'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`${listing.title} ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop';
                                }}
                              />
                            </button>

                            {/* Set as Cover button for listing owner */}
                            {isOwner && index !== 0 && (
                              <button
                                onClick={() => handleSetCoverImage(index)}
                                disabled={updatingCover}
                                className="mt-2 w-24 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                {updatingCover ? 'Setting...' : 'Set Cover'}
                              </button>
                            )}

                            {/* Cover badge for current cover image */}
                            {index === 0 && (
                              <div className="mt-2 w-24 px-2 py-1 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-center font-medium">
                                Cover
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
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
                      {getCategoryLabel(listing.category)}
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {getPriceDisplay(listing)}
                    </span>
                  </div>
                  <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: listing.description }} />
                </div>

                {/* Tags */}
                {listing.tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {listing.tags.map((tag, index) => (
                        <span key={index} className="bg-gradient-to-r from-blue-100 to-green-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                      {listing.location.address ||
                       `${listing.location.street || ''} ${listing.location.houseNumber || ''}`.trim()}<br />
                      {listing.location.city}, {listing.location.region && `${listing.location.region}, `}{listing.location.country}
                    </p>
                  </div>
                {(listing.location.coordinates || (listing.location.latitude && listing.location.longitude)) && (
                  <Map
                    center={[
                      listing.location.coordinates?.lat || listing.location.latitude || 0,
                      listing.location.coordinates?.lng || listing.location.longitude || 0
                    ]}
                    zoom={15}
                    height="300px"
                    markers={[
                      {
                        position: [
                          listing.location.coordinates?.lat || listing.location.latitude || 0,
                          listing.location.coordinates?.lng || listing.location.longitude || 0
                        ],
                        title: listing.title,
                        description: listing.location.address ||
                                   `${listing.location.street || ''} ${listing.location.houseNumber || ''}`.trim(),
                        isMain: true
                      }
                    ]}
                  />
                )}
                </div>
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
                  {(listing.contactInfo?.phone || listing.contact?.phone) && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${listing.contactInfo?.phone || listing.contact?.phone}`} className="text-green-600 hover:text-green-700">
                        {listing.contactInfo?.phone || listing.contact?.phone}
                      </a>
                    </div>
                  )}
                  {(listing.contactInfo?.email || listing.contact?.email) && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${listing.contactInfo?.email || listing.contact?.email}`} className="text-green-600 hover:text-green-700">
                        {listing.contactInfo?.email || listing.contact?.email}
                      </a>
                    </div>
                  )}
                  {(listing.contactInfo?.website || listing.contact?.website) && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={listing.contactInfo?.website || listing.contact?.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Media */}
                {(listing.contact?.socials && Object.values(listing.contact.socials).some(Boolean)) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Follow Us</h4>
                    <div className="flex space-x-3">
                      {listing.contact.socials.facebook && (
                        <a href={listing.contact.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          <span className="sr-only">Facebook</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {listing.contact.socials.instagram && (
                        <a href={listing.contact.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                          <span className="sr-only">Instagram</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                      <div className="text-2xl font-bold text-blue-600">{listing.views}</div>
                      <div className="text-sm text-blue-700">Views</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{listing.inquiries}</div>
                      <div className="text-sm text-green-700">Inquiries</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Created
                      </span>
                      <span className="font-medium text-gray-800">{new Date(listing.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Updated
                      </span>
                      <span className="font-medium text-gray-800">{new Date(listing.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
