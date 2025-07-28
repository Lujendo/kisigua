import React, { useState, useEffect } from 'react';
import ListingImageUpload from './ListingImageUpload';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    street: string;
    houseNumber: string;
    city: string;
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

const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockListings: Listing[] = [
      {
        id: '1',
        title: 'Organic Vegetable Garden Tour',
        description: 'Join us for a guided tour of our organic vegetable garden. Learn about sustainable farming practices and take home fresh produce.',
        category: 'nature',
        location: {
          street: 'Garden Street',
          houseNumber: '123',
          city: 'Berlin',
          country: 'Germany',
          coordinates: { lat: 52.5200, lng: 13.4050 }
        },
        contact: {
          phone: '+49 30 12345678',
          mobile: '+49 170 1234567',
          email: 'garden@example.com',
          website: 'https://organicgarden.example.com',
          socials: {
            facebook: 'https://facebook.com/organicgarden',
            instagram: 'https://instagram.com/organicgarden'
          }
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        price: 15,
        priceType: 'paid',
        tags: ['organic', 'garden', 'sustainable'],
        status: 'published',
        isVerified: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        views: 124,
        inquiries: 8
      },
      {
        id: '2',
        title: 'Community Cooking Workshop',
        description: 'Learn to cook traditional dishes using local ingredients. Perfect for beginners and food enthusiasts.',
        category: 'food',
        location: {
          street: 'Kitchen Lane',
          houseNumber: '456',
          city: 'Munich',
          country: 'Germany',
          coordinates: { lat: 48.1351, lng: 11.5820 }
        },
        contact: {
          mobile: '+49 175 9876543',
          email: 'cooking@example.com',
          website: 'https://cookingworkshop.example.com',
          socials: {
            instagram: 'https://instagram.com/cookingworkshop',
            twitter: 'https://twitter.com/cookingworkshop'
          }
        },
        images: ['/api/placeholder/400/300'],
        thumbnail: '/api/placeholder/300/200',
        priceType: 'donation',
        tags: ['cooking', 'community', 'traditional'],
        status: 'draft',
        isVerified: false,
        createdAt: '2024-01-10',
        updatedAt: '2024-01-12',
        views: 0,
        inquiries: 0
      }
    ];
    
    setListings(mockListings);
  }, []);

  const filteredListings = listings.filter(listing => {
    if (filterStatus === 'all') return true;
    return listing.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative">
        <img
          src={listing.thumbnail}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(listing.status)}`}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </span>
        </div>
        {listing.isVerified && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {listing.location.city}
          </div>
          
          {listing.priceType === 'paid' && listing.price && (
            <div className="text-lg font-semibold text-green-600">€{listing.price}</div>
          )}
          {listing.priceType === 'free' && (
            <div className="text-lg font-semibold text-green-600">Free</div>
          )}
          {listing.priceType === 'donation' && (
            <div className="text-lg font-semibold text-blue-600">Donation</div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {listing.views} views
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {listing.inquiries} inquiries
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {listing.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => console.log('Edit listing:', listing.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
            View
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const CreateListingForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'contact' | 'media' | 'pricing'>('basic');
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: '',
      street: '',
      houseNumber: '',
      city: '',
      country: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      priceType: 'free' as 'free' | 'paid' | 'donation',
      price: '',
      tags: ''
    });
    const [images, setImages] = useState<string[]>([]);

    const categories = [
      { id: 'nature', label: 'Nature & Parks' },
      { id: 'culture', label: 'Cultural Sites' },
      { id: 'food', label: 'Local Food' },
      { id: 'accommodation', label: 'Accommodation' },
      { id: 'activities', label: 'Activities' },
      { id: 'services', label: 'Local Services' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Handle form submission
      console.log('Form submitted:', formData, images);
      setShowCreateForm(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-[900px] h-[700px] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Listing</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {[
                {
                  id: 'basic',
                  label: 'Basic Info',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  id: 'location',
                  label: 'Location',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  id: 'contact',
                  label: 'Contact',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )
                },
                {
                  id: 'media',
                  label: 'Media',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  id: 'pricing',
                  label: 'Pricing',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  )
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    activeTab === tab.id
                      ? 'text-green-600 border-b-2 border-green-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 p-6">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter a descriptive title for your listing"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Describe your location, what makes it special, and what visitors can expect..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter tags separated by commas (e.g., organic, sustainable, family-friendly)"
                        />
                        <p className="text-sm text-gray-500 mt-1">Tags help people find your listing more easily</p>
                      </div>
                    </div>
                  )}

                  {/* Location Tab */}
                  {activeTab === 'location' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
                          <input
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Street name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">House Number *</label>
                          <input
                            type="text"
                            value={formData.houseNumber}
                            onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="City name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Country name"
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-blue-900">Location Tips</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Provide accurate address information to help visitors find your location easily.
                              The coordinates will be automatically generated from your address.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="+49 30 12345678"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                          <input
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="+49 170 1234567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="contact@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://www.example.com"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Social Media</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Facebook</label>
                            <input
                              type="url"
                              value={formData.facebook}
                              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="https://facebook.com/yourpage"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Instagram</label>
                            <input
                              type="url"
                              value={formData.instagram}
                              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="https://instagram.com/yourprofile"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Twitter</label>
                              <input
                                type="url"
                                value={formData.twitter}
                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="https://twitter.com/yourhandle"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">LinkedIn</label>
                              <input
                                type="url"
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="https://linkedin.com/company/yourcompany"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Tab */}
                  {activeTab === 'media' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Images</label>
                        <ListingImageUpload
                          onImagesChange={setImages}
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Upload high-quality images that showcase your location. The first image will be used as the main thumbnail.
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-yellow-900">Image Guidelines</h4>
                            <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                              <li>Use high-resolution images (at least 1200x800 pixels)</li>
                              <li>Show different angles and aspects of your location</li>
                              <li>Include people enjoying the space if possible</li>
                              <li>Avoid heavily filtered or edited photos</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Tab */}
                  {activeTab === 'pricing' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Pricing Type *</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            {
                              value: 'free',
                              label: 'Free',
                              description: 'No cost to visitors',
                              icon: (
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                                </svg>
                              )
                            },
                            {
                              value: 'paid',
                              label: 'Paid',
                              description: 'Fixed price per person',
                              icon: (
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                              )
                            },
                            {
                              value: 'donation',
                              label: 'Donation',
                              description: 'Voluntary contribution',
                              icon: (
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )
                            }
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                formData.priceType === option.value
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="priceType"
                                value={option.value}
                                checked={formData.priceType === option.value}
                                onChange={(e) => setFormData({ ...formData, priceType: e.target.value as 'free' | 'paid' | 'donation' })}
                                className="sr-only"
                              />
                              <div className="flex items-center justify-between mb-2">
                                {option.icon}
                                {formData.priceType === option.value && (
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-medium text-gray-900">{option.label}</span>
                              <span className="text-sm text-gray-500">{option.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.priceType === 'paid' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price per Person (€) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="25.00"
                            required
                          />
                        </div>
                      )}

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-green-900">Pricing Tips</h4>
                            <ul className="text-sm text-green-700 mt-1 list-disc list-inside space-y-1">
                              <li><strong>Free:</strong> Great for community spaces and public locations</li>
                              <li><strong>Paid:</strong> For guided tours, workshops, or premium experiences</li>
                              <li><strong>Donation:</strong> Let visitors contribute what they can afford</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {activeTab !== 'basic' && (
                        <button
                          type="button"
                          onClick={() => {
                            const tabs = ['basic', 'location', 'contact', 'media', 'pricing'];
                            const currentIndex = tabs.indexOf(activeTab);
                            if (currentIndex > 0) {
                              setActiveTab(tabs[currentIndex - 1] as typeof activeTab);
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          Previous
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Tab Progress Indicators */}
                      <div className="flex space-x-1">
                        {['basic', 'location', 'contact', 'media', 'pricing'].map((tab, index) => (
                          <div
                            key={tab}
                            className={`w-2 h-2 rounded-full ${
                              tab === activeTab ? 'bg-green-600' :
                              ['basic', 'location', 'contact', 'media', 'pricing'].indexOf(activeTab) > index ? 'bg-green-300' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {activeTab !== 'pricing' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const tabs = ['basic', 'location', 'contact', 'media', 'pricing'];
                            const currentIndex = tabs.indexOf(activeTab);
                            if (currentIndex < tabs.length - 1) {
                              setActiveTab(tabs[currentIndex + 1] as typeof activeTab);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Create Listing
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600 mt-1">Manage your shared locations and experiences</p>
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
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Listing</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <div className="text-sm text-gray-600">
          {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Listings Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map(listing => (
            <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex space-x-4">
                <img
                  src={listing.thumbnail}
                  alt={listing.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(listing.status)}`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {listing.views} views
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {listing.inquiries} inquiries
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {listing.location.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => console.log('Edit listing:', listing.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-4">Create your first listing to share with the community</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First Listing
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && <CreateListingForm />}
    </div>
  );
};

export default MyListingsPage;
