import React, { useState, useEffect } from 'react';
import Map from '../Map';

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
  location: {
    street: string;
    houseNumber: string;
    city: string;
    region?: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    socials: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  images: string[];
  thumbnail: string;
  price?: number;
  priceType: 'free' | 'paid' | 'donation';
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  inquiries: number;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listingId, onClose, onEdit }) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockListings: Listing[] = [
      {
        id: '1',
        title: 'Green Valley Organic Farm',
        description: 'Family-owned organic farm specializing in seasonal vegetables, herbs, and fruits. We use sustainable farming practices and offer fresh produce year-round. Visit our farm shop and enjoy guided tours every weekend.',
        category: 'organic_farm',
        location: {
          street: 'Hauptstraße',
          houseNumber: '123',
          city: 'Berlin',
          region: 'Brandenburg',
          country: 'Germany',
          coordinates: { lat: 52.5200, lng: 13.4050 }
        },
        contact: {
          phone: '+49 30 12345678',
          mobile: '+49 170 1234567',
          email: 'info@greenvalley.de',
          website: 'https://greenvalley.de',
          socials: {
            facebook: 'https://facebook.com/greenvalley',
            instagram: 'https://instagram.com/greenvalley'
          }
        },
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
        priceType: 'free',
        tags: ['organic', 'vegetables', 'sustainable', 'family-owned'],
        status: 'published',
        isVerified: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        views: 245,
        inquiries: 12
      },
      // Add more mock listings as needed...
    ];

    const foundListing = mockListings.find(l => l.id === listingId);
    setListing(foundListing || null);
    setLoading(false);
  }, [listingId]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">{listing.title}</h2>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(listing.status)}`}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
            {listing.isVerified && (
              <div className="bg-blue-600 text-white p-1 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(listing.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={listing.images[currentImageIndex]}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {listing.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-green-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {getCategoryLabel(listing.category)}
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    {getPriceDisplay(listing)}
                  </span>
                </div>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: listing.description }} />
              </div>

              {/* Tags */}
              {listing.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">
                    {listing.location.street} {listing.location.houseNumber}<br />
                    {listing.location.city}, {listing.location.region && `${listing.location.region}, `}{listing.location.country}
                  </p>
                </div>
                <Map
                  center={[listing.location.coordinates.lat, listing.location.coordinates.lng]}
                  zoom={15}
                  height="300px"
                  markers={[
                    {
                      position: [listing.location.coordinates.lat, listing.location.coordinates.lng],
                      title: listing.title,
                      description: `${listing.location.street} ${listing.location.houseNumber}`,
                      isMain: true
                    }
                  ]}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {listing.contact.phone && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${listing.contact.phone}`} className="text-green-600 hover:text-green-700">
                        {listing.contact.phone}
                      </a>
                    </div>
                  )}
                  {listing.contact.email && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${listing.contact.email}`} className="text-green-600 hover:text-green-700">
                        {listing.contact.email}
                      </a>
                    </div>
                  )}
                  {listing.contact.website && (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={listing.contact.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Media */}
                {Object.values(listing.contact.socials).some(Boolean) && (
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
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{listing.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inquiries</span>
                    <span className="font-medium">{listing.inquiries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated</span>
                    <span className="font-medium">{new Date(listing.updatedAt).toLocaleDateString()}</span>
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
