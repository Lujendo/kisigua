import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePerformance } from '../../contexts/PerformanceContext';
import ListingImageUpload from './ListingImageUpload';
import RichTextEditor from '../RichTextEditor';
import ListingDetail from './ListingDetail';
import LocationInputWithPostalCode from './LocationInputWithPostalCode';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    street?: string;
    houseNumber?: string;
    city: string;
    region?: string;
    country: string;
    postalCode?: string;
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

// Map category labels to database values
const getCategoryDatabaseValue = (categoryLabel: string): string => {
  const categoryMapping: { [key: string]: string } = {
    'Organic Farm': 'organic_farm',
    'Local Product': 'local_product',
    'Water Source': 'water_source',
    'Vending Machine': 'vending_machine',
    'Craft': 'craft',
    'Sustainable Good': 'sustainable_good',
    // Add more mappings as needed
    'Organic Farms': 'organic_farm',
    'Local Products': 'local_product',
    'Water Sources': 'water_source',
    'Vending Machines': 'vending_machine',
    'Crafts': 'craft',
    'Sustainable Goods': 'sustainable_good'
  };

  return categoryMapping[categoryLabel] || 'local_product'; // Default fallback
};

const MyListingsPage: React.FC = () => {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [showDropdownId, setShowDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form optimization states
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [loadingEditData, setLoadingEditData] = useState<string | null>(null);

  // Global categories cache - shared across all form instances
  const [globalCategories, setGlobalCategories] = useState<Array<{ id: string; label: string; color?: string; icon?: string }>>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    duplicates: Array<{
      id: string;
      title: string;
      address: string;
      reason: string;
      confidence: number;
    }>;
    message: string;
  } | null>(null);

  // SUPER OPTIMIZED: Categories loading with performance context
  const { getFromCache, setCache, startTimer, endTimer } = usePerformance();

  const preloadCategories = async () => {
    if (categoriesLoaded || categoriesLoading) {
      return globalCategories; // Return cached categories immediately
    }

    startTimer('categories-load');

    // Check performance cache first (fastest)
    const cachedCategories = getFromCache<Array<{ id: string; label: string; color?: string; icon?: string }>>('categories');
    if (cachedCategories) {
      setGlobalCategories(cachedCategories);
      setCategoriesLoaded(true);
      endTimer('categories-load');
      console.log('⚡ Categories loaded from performance cache instantly:', cachedCategories.length, 'categories');
      return cachedCategories;
    }

    // Try localStorage as fallback
    try {
      const storedCategories = localStorage.getItem('kisigua_categories');
      const cacheTimestamp = localStorage.getItem('kisigua_categories_timestamp');
      const cacheAge = Date.now() - (parseInt(cacheTimestamp || '0'));
      const maxCacheAge = 10 * 60 * 1000; // 10 minutes

      if (storedCategories && cacheAge < maxCacheAge) {
        const parsedCategories = JSON.parse(storedCategories);
        setGlobalCategories(parsedCategories);
        setCategoriesLoaded(true);
        // Also cache in performance context for next time
        setCache('categories', parsedCategories, maxCacheAge);
        endTimer('categories-load');
        console.log('⚡ Categories loaded from localStorage and cached:', parsedCategories.length, 'categories');
        return parsedCategories;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load categories from localStorage:', error);
    }

    setCategoriesLoading(true);
    try {
      console.log('🔄 Fetching fresh categories from API...');
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        const formattedCategories = data.categories.map((cat: { id: string; name: string; color: string; icon: string }) => ({
          id: cat.id,
          label: cat.name,
          color: cat.color,
          icon: cat.icon
        }));

        // Cache in localStorage for next time
        localStorage.setItem('kisigua_categories', JSON.stringify(formattedCategories));
        localStorage.setItem('kisigua_categories_timestamp', Date.now().toString());

        setGlobalCategories(formattedCategories);
        setCategoriesLoaded(true);
        console.log('✅ Categories fetched and cached:', formattedCategories.length, 'categories');
        return formattedCategories;
      } else {
        console.warn('⚠️ Failed to load categories from API, using fallback');
        const fallbackCategories = [
          { id: 'organic_farm', label: 'Organic Farm' },
          { id: 'local_product', label: 'Local Product' },
          { id: 'water_source', label: 'Water Source' },
          { id: 'vending_machine', label: 'Vending Machine' },
          { id: 'craft', label: 'Craft & Handmade' },
          { id: 'sustainable_good', label: 'Sustainable Good' }
        ];
        setGlobalCategories(fallbackCategories);
        setCategoriesLoaded(true);
        return fallbackCategories;
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      const fallbackCategories = [
        { id: 'organic_farm', label: 'Organic Farm' },
        { id: 'local_product', label: 'Local Product' },
        { id: 'water_source', label: 'Water Source' },
        { id: 'vending_machine', label: 'Vending Machine' },
        { id: 'craft', label: 'Craft & Handmade' },
        { id: 'sustainable_good', label: 'Sustainable Good' }
      ];
      setGlobalCategories(fallbackCategories);
      setCategoriesLoaded(true);
      return fallbackCategories;
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Helper function to get status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Initialize categories from cache immediately on mount
  useEffect(() => {
    const initializeCategories = () => {
      try {
        const cachedCategories = localStorage.getItem('kisigua_categories');
        const cacheTimestamp = localStorage.getItem('kisigua_categories_timestamp');
        const cacheAge = Date.now() - (parseInt(cacheTimestamp || '0'));
        const maxCacheAge = 10 * 60 * 1000; // 10 minutes

        if (cachedCategories && cacheAge < maxCacheAge) {
          const parsedCategories = JSON.parse(cachedCategories);
          setGlobalCategories(parsedCategories);
          setCategoriesLoaded(true);
          console.log('⚡ Categories initialized from cache on mount:', parsedCategories.length, 'categories');
        }
      } catch (error) {
        console.warn('⚠️ Failed to initialize categories from cache:', error);
      }
    };

    initializeCategories();
  }, []);

  // Fetch user's listings from API
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!token) {
        setError('Please log in to view your listings');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/user/listings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data = await response.json();

        // Transform API data to match component interface
        const transformedListings: Listing[] = data.listings.map((listing: {
          id: string;
          title: string;
          description: string;
          category: string;
          location?: { address?: string; city?: string; region?: string; country?: string; latitude?: number; longitude?: number };
          images?: string[];
          priceRange?: string;
          tags?: string[];
          userId: string;
          createdAt: string;
          updatedAt: string;
          isCertified?: boolean;
          views?: number;
          contactInfo?: { phone?: string; email?: string; website?: string };
        }) => {
          // Parse address safely
          const addressParts = listing.location?.address?.split(' ') || [];
          const houseNumber = addressParts[0] || '';
          const street = addressParts.slice(1).join(' ') || '';

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            category: listing.category,
            location: {
              street: street,
              houseNumber: houseNumber,
              city: listing.location?.city || '',
              region: listing.location?.region || '',
              country: listing.location?.country || '',
              coordinates: {
                lat: listing.location?.latitude || 0,
                lng: listing.location?.longitude || 0
              }
            },
            contact: {
              phone: listing.contactInfo?.phone || '',
              mobile: '', // Not available in API
              email: listing.contactInfo?.email || '',
              website: listing.contactInfo?.website || '',
              socials: {}
            },
            images: listing.images || [],
            thumbnail: listing.images?.[0] || undefined,
            price: listing.priceRange === 'low' ? 10 : listing.priceRange === 'medium' ? 25 : listing.priceRange === 'high' ? 50 : undefined,
            priceType: listing.priceRange ? 'paid' : 'free',
            tags: listing.tags || [],
            status: 'published', // Default status
            isVerified: listing.isCertified || false,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
            views: listing.views || 0,
            inquiries: 0 // Default value
          };
        });

        setListings(transformedListings);
        setError(null);
      } catch (error) {
        console.error('Error fetching user listings:', error);
        setError('Failed to load your listings. Please try again.');
        setListings([]); // Set empty array instead of mock data

      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();

    // Preload categories in parallel for faster form loading
    preloadCategories();
  }, [token]);

  // Check for edit location ID from localStorage (from Dashboard navigation)
  useEffect(() => {
    const editLocationId = localStorage.getItem('editLocationId');
    if (editLocationId && listings.length > 0) {
      localStorage.removeItem('editLocationId');
      // Automatically open edit form for this location
      handleEditListing(editLocationId);
    }
  }, [listings]); // Run after listings are loaded

  // Function to refresh listings data without full page reload
  const refreshListings = async () => {
    try {
      console.log('Starting to refresh listings...');
      setLoading(true);
      const response = await fetch('/api/user/listings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedListings = data.listings.map((listing: {
          id: string;
          title: string;
          description: string;
          category: string;
          location?: {
            address?: string;
            city?: string;
            region?: string;
            country?: string;
            latitude?: number;
            longitude?: number
          };
          images?: string[];
          priceRange?: string;
          tags?: string[];
          createdAt: string;
          updatedAt: string;
          isCertified?: boolean;
          views?: number;
          contactInfo?: { phone?: string; email?: string; website?: string };
        }) => {
          // Parse address from the location.address field
          const addressParts = listing.location?.address ? listing.location.address.split(' ') : [];
          const houseNumber = addressParts[0] || '';
          const street = addressParts.slice(1).join(' ') || '';

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            category: listing.category,
            location: {
              street: street,
              houseNumber: houseNumber,
              city: listing.location?.city || '',
              region: listing.location?.region || '',
              country: listing.location?.country || '',
              coordinates: {
                lat: listing.location?.latitude || 0,
                lng: listing.location?.longitude || 0
              }
            },
            contact: {
              phone: listing.contactInfo?.phone || '',
              mobile: '',
              email: listing.contactInfo?.email || '',
              website: listing.contactInfo?.website || '',
              socials: {}
            },
            images: listing.images || [],
            thumbnail: listing.images?.[0] || undefined,
            price: listing.priceRange === 'low' ? 10 : listing.priceRange === 'medium' ? 25 : listing.priceRange === 'high' ? 50 : undefined,
            priceType: listing.priceRange ? 'paid' : 'free',
            tags: listing.tags || [],
            status: 'published',
            isVerified: listing.isCertified || false,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
            views: listing.views || 0,
            inquiries: 0
          };
        });

        setListings(transformedListings);
        console.log(`Refreshed listings: ${transformedListings.length} listings loaded`);
        setError(null);
      } else {
        throw new Error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error refreshing listings:', error);
      setError('Failed to refresh listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filterStatus === 'all') return true;
    return listing.status === filterStatus;
  });

  // Handler functions for listing actions
  const handleViewListing = (listingId: string) => {
    setSelectedListingId(listingId);
  };

  const handleEditListing = async (listingId: string) => {
    console.log('🚀 Opening edit form for listing:', listingId);

    // Step 1: Open form immediately with cached listing data (optimistic UI)
    const cachedListing = listings.find(l => l.id === listingId);
    if (cachedListing) {
      console.log('⚡ Using cached listing data for instant form opening');
      setEditingListing(cachedListing);
      setEditingListingId(listingId);
      setShowCreateForm(true);
    }

    // Step 2: Fetch complete data in background (non-blocking)
    setLoadingEditData(listingId);
    try {
      console.log('🔄 Fetching complete listing data in background...');
      const response = await fetch(`/api/listings/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Complete listing data loaded, updating form');
        setEditingListing(data.listing);
      } else {
        console.warn('⚠️ Failed to fetch complete data, using cached data');
        // Keep using cached data - form is already open and functional
      }
    } catch (error) {
      console.error('❌ Error fetching complete listing data:', error);
      // Keep using cached data - form is already open and functional
    } finally {
      setLoadingEditData(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/listings/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete listing');
        }

        // Remove from local state
        setListings(prev => prev.filter(l => l.id !== listingId));
        console.log('Deleted listing:', listingId);
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing. Please try again.');
      }
    }
  };

  const handleDuplicateListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing || !token) return;

    try {
      // Prepare the listing data for duplication
      const duplicateData = {
        title: `${listing.title} (Copy)`,
        description: listing.description,
        category: listing.category,
        location: listing.location,
        contactInfo: listing.contact,
        images: listing.images || [],
        tags: listing.tags || [],
        priceRange: listing.priceType === 'free' ? 'free' :
                   listing.priceType === 'paid' ? 'medium' : 'low',
        isOrganic: false,
        isCertified: false
      };

      console.log('Duplicating listing with data:', duplicateData);

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(duplicateData)
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate listing');
      }

      const result = await response.json();
      console.log('Duplicated listing created:', result.listing);

      // Refresh the listings to show the new duplicate
      console.log('Refreshing listings after duplication...');
      await refreshListings();
      console.log('Listings refreshed successfully');

      // Show success message
      alert(`Listing "${result.listing.title}" duplicated successfully!`);

    } catch (error) {
      console.error('Error duplicating listing:', error);
      setError('Failed to duplicate listing. Please try again.');
      alert('Failed to duplicate listing. Please try again.');
    }
  };

  const handleToggleStatus = (listingId: string) => {
    setListings(prev => prev.map(listing => {
      if (listing.id === listingId) {
        const newStatus = listing.status === 'published' ? 'draft' : 'published';
        return { ...listing, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return listing;
    }));
  };



  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={listing.images?.[0] || listing.thumbnail || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'}
          alt={listing.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
          }}
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
          {/* Enhanced Location Display */}
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex items-center space-x-2">
              {/* Country Flag */}
              <span className="text-base">
                {listing.location.country === 'Germany' || listing.location.country === 'DE' ? '🇩🇪' :
                 listing.location.country === 'Italy' || listing.location.country === 'IT' ? '🇮🇹' :
                 listing.location.country === 'Spain' || listing.location.country === 'ES' ? '🇪🇸' :
                 listing.location.country === 'France' || listing.location.country === 'FR' ? '🇫🇷' : '🌍'}
              </span>

              {/* Postal Code */}
              {listing.location.postalCode && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  {listing.location.postalCode}
                </span>
              )}

              {/* City */}
              <span>{listing.location.city}</span>
            </div>
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
            onClick={() => handleEditListing(listing.id)}
            disabled={loadingEditData === listing.id}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
              loadingEditData === listing.id
                ? 'bg-green-400 cursor-wait'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loadingEditData === listing.id ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Opening...</span>
              </>
            ) : (
              <span>Edit</span>
            )}
          </button>
          <button
            onClick={() => handleViewListing(listing.id)}
            className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdownId(showDropdownId === listing.id ? null : listing.id)}
              className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdownId === listing.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleToggleStatus(listing.id);
                      setShowDropdownId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    {listing.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicateListing(listing.id);
                      setShowDropdownId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteListing(listing.id);
                      setShowDropdownId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const CreateListingForm: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'contact' | 'media' | 'pricing'>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = editingListing !== null;
    const isLoadingCompleteData = loadingEditData === editingListingId;

    // LAZY FORM INITIALIZATION - minimal data upfront, load details on demand
    const [formData, setFormData] = useState(() => {
      // Always start with minimal default data for instant form opening
      const defaultData = {
        title: '', description: '', category: '', street: '', houseNumber: '',
        city: '', region: '', country: '', postalCode: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined,
        phone: '', mobile: '', email: '', website: '', facebook: '', instagram: '', twitter: '', linkedin: '',
        priceType: 'free' as 'free' | 'paid' | 'donation', price: '', tags: '',
        status: 'active' as 'active' | 'inactive' | 'pending' | 'rejected', hideAddress: false
      };

      // If editing, populate only essential fields immediately for instant form opening
      if (editingListing) {
        return {
          ...defaultData,
          title: editingListing.title || '',
          description: editingListing.description || '',
          category: editingListing.category || '',
          city: editingListing.location?.city || '',
          country: editingListing.location?.country || '',
          postalCode: editingListing.location?.postalCode || '',
          status: (editingListing.status || 'active') as 'active' | 'inactive' | 'pending' | 'rejected'
        };
      }

      return defaultData;
    });
    const [images, setImages] = useState<string[]>([]);
    // Use global categories cache instead of local state
    const categories = globalCategories;
    const loadingCategories = !categoriesLoaded;

    // Initialize images when editingListing changes
    useEffect(() => {
      if (editingListing?.images) {
        setImages(editingListing.images);
      } else {
        setImages([]);
      }
    }, [editingListing]);

    // PROGRESSIVE FORM LOADING - update form data incrementally as complete data loads
    useEffect(() => {
      if (editingListing && !isLoadingCompleteData) {
        console.log('🔄 Progressively updating form with complete listing data');

        // Update form data incrementally to avoid blocking UI
        setFormData(prevData => ({
          ...prevData,
          // Core fields (already loaded for instant opening)
          title: editingListing.title || prevData.title,
          description: editingListing.description || prevData.description,
          category: editingListing.category || prevData.category,

          // Location fields (progressive loading)
          street: editingListing.location?.street || prevData.street,
          houseNumber: editingListing.location?.houseNumber || prevData.houseNumber,
          city: editingListing.location?.city || prevData.city,
          region: editingListing.location?.region || prevData.region,
          country: editingListing.location?.country || prevData.country,
          postalCode: editingListing.location?.postalCode || prevData.postalCode,
          latitude: editingListing.location?.latitude || editingListing.location?.coordinates?.lat || prevData.latitude,
          longitude: editingListing.location?.longitude || editingListing.location?.coordinates?.lng || prevData.longitude,

          // Contact fields (loaded on demand)
          phone: editingListing.contactInfo?.phone || editingListing.contact?.phone || prevData.phone,
          mobile: editingListing.contact?.mobile || prevData.mobile,
          email: editingListing.contactInfo?.email || editingListing.contact?.email || prevData.email,
          website: editingListing.contactInfo?.website || editingListing.contact?.website || prevData.website,
          facebook: editingListing.contact?.socials?.facebook || prevData.facebook,
          instagram: editingListing.contact?.socials?.instagram || prevData.instagram,
          twitter: editingListing.contact?.socials?.twitter || prevData.twitter,
          linkedin: editingListing.contact?.socials?.linkedin || prevData.linkedin,

          // Pricing and metadata (loaded on demand)
          priceType: (editingListing.priceType || prevData.priceType) as 'free' | 'paid' | 'donation',
          price: editingListing.price?.toString() || prevData.price,
          tags: editingListing.tags?.join(', ') || prevData.tags,
          status: (editingListing.status || prevData.status) as 'active' | 'inactive' | 'pending' | 'rejected',
          hideAddress: (editingListing as any)?.hideAddress ?? prevData.hideAddress
        }));
      }
    }, [editingListing, isLoadingCompleteData]);

    // Countries list - now handled by LocationInputWithPostalCode component

    // Ensure categories are loaded when form opens
    useEffect(() => {
      if (!categoriesLoaded && !categoriesLoading) {
        console.log('🔄 Form opened, ensuring categories are loaded...');
        preloadCategories();
      }
    }, [categoriesLoaded, categoriesLoading]);



    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!token) {
        alert('You must be logged in to create a listing');
        return;
      }

      // Basic validation for required fields
      if (!formData.title.trim()) {
        alert('Please enter a title for your listing');
        return;
      }

      if (!formData.description.trim()) {
        alert('Please enter a description for your listing');
        return;
      }

      if (!formData.category) {
        alert('Please select a category for your listing');
        return;
      }

      if (!formData.city.trim()) {
        alert('Please enter a city for your listing');
        return;
      }

      setIsSubmitting(true);

      try {
        // Prepare the listing data according to the API format
        const listingData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: {
            latitude: formData.latitude || 52.5200, // Use form coordinates or default
            longitude: formData.longitude || 13.4050,
            address: `${formData.street || ''} ${formData.houseNumber || ''}`.trim(),
            street: formData.street || undefined,
            houseNumber: formData.houseNumber || undefined,
            city: formData.city,
            region: formData.region || undefined,
            country: formData.country,
            postalCode: formData.postalCode || undefined
          },
          contactInfo: {
            email: formData.email || undefined,
            phone: formData.phone || formData.mobile || undefined,
            website: formData.website || undefined
          },
          images: images,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          isOrganic: false, // Could be added as a form field
          isCertified: false, // Could be added as a form field
          priceRange: formData.priceType === 'free' ? 'free' :
                     formData.priceType === 'paid' ? 'medium' : 'low',
          hideAddress: formData.hideAddress,
          status: formData.status
        };

        console.log(`Submitting listing data for ${isEditing ? 'update' : 'create'}:`, listingData);

        const url = isEditing ? `/api/listings/${editingListing.id}` : '/api/listings';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(listingData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`Listing ${isEditing ? 'updated' : 'created'} successfully:`, result);
          alert(`Listing ${isEditing ? 'updated' : 'created'} successfully!`);
          setEditingListing(null);
          setShowCreateForm(false);
          // Refresh the listings without full page reload
          await refreshListings();
        } else {
          const error = await response.json();
          console.error(`Failed to ${isEditing ? 'update' : 'create'} listing:`, error);

          // Handle duplicate detection
          if (response.status === 409 && error.duplicates) {
            setDuplicateWarning({
              duplicates: error.duplicates,
              message: error.message
            });
          } else {
            alert(`Failed to ${isEditing ? 'update' : 'create'} listing: ${error.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} listing:`, error);
        alert(`An error occurred while ${isEditing ? 'updating' : 'creating'} the listing. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Listing' : 'Create New Listing'}
                  </h2>
                  {isLoadingCompleteData && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs font-medium">Loading complete data...</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditing ? 'Update your listing information' : 'Share your sustainable location with the community'}
                  {isLoadingCompleteData && (
                    <span className="text-blue-600 ml-2">• Complete data loading in background</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingListing(null);
                  setEditingListingId(null);
                  setLoadingEditData(null);
                  setShowCreateForm(false);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-2 transition-all duration-200"
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
                  className={`flex-1 px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-green-600 border-green-600 bg-white rounded-t-lg shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Title *
                            <span className="text-gray-500 font-normal ml-2">Give your listing a clear, descriptive name</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-lg"
                            placeholder="e.g., Organic Farm Market, Community Garden, Local Artisan Shop"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Description *
                            <span className="text-gray-500 font-normal ml-2">Tell people what makes this place special</span>
                          </label>
                          <RichTextEditor
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value })}
                            placeholder="Describe your location, what makes it special, and what visitors can expect..."
                            minHeight="250px"
                            className="focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl"
                          />
                          <p className="text-sm text-gray-600 mt-2 bg-blue-50 p-3 rounded-lg">
                            💡 <strong>Tip:</strong> Use the toolbar to format your text with bold, italic, bullet points, and more.
                            Include details about accessibility, opening hours, and what visitors should bring.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Category *
                            <span className="text-gray-500 font-normal ml-2">Choose the best category for your listing</span>
                            {loadingCategories && (
                              <span className="ml-2 text-blue-600 text-xs">
                                <span className="animate-spin inline-block w-3 h-3 border border-blue-600 border-t-transparent rounded-full mr-1"></span>
                                Loading...
                              </span>
                            )}
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-lg ${
                              loadingCategories ? 'bg-gray-50 cursor-wait' : ''
                            }`}
                            required
                            disabled={loadingCategories}
                          >
                            <option value="">
                              {loadingCategories ? 'Loading categories...' : 'Select a category'}
                            </option>
                            {!loadingCategories && categories.map(category => {
                              // Map category labels to database values
                              const categoryValue = getCategoryDatabaseValue(category.label);
                              return (
                                <option key={category.id} value={categoryValue}>
                                  {category.icon ? `${category.icon} ` : ''}{category.label}
                                </option>
                              );
                            })}
                            {loadingCategories && (
                              <option disabled>⏳ Loading categories...</option>
                            )}
                        </select>
                          {loadingCategories && (
                            <div className="mt-2 text-sm text-gray-500 flex items-center bg-yellow-50 p-3 rounded-lg">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              Loading categories from database...
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Tags
                            <span className="text-gray-500 font-normal ml-2">Help people discover your listing</span>
                          </label>
                          <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="organic, sustainable, family-friendly, local, artisan"
                          />
                          <p className="text-sm text-gray-600 mt-2">Separate tags with commas. Good tags help people find your listing more easily.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Location Tab with Postal Code Integration */}
                  {activeTab === 'location' && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Information</h3>
                          <p className="text-sm text-gray-600">
                            Enter your location details. Our system will help you find the exact postal code and coordinates.
                          </p>
                        </div>

                        {/* Enhanced Location Input with Postal Code Integration */}
                        <LocationInputWithPostalCode
                          value={{
                            street: formData.street,
                            houseNumber: formData.houseNumber,
                            city: formData.city,
                            region: formData.region,
                            country: formData.country,
                            postalCode: formData.postalCode,
                            latitude: formData.latitude,
                            longitude: formData.longitude
                          }}
                          onChange={(locationData) => {
                            setFormData({
                              ...formData,
                              street: locationData.street || '',
                              houseNumber: locationData.houseNumber || '',
                              city: locationData.city,
                              region: locationData.region || '',
                              country: locationData.country,
                              postalCode: locationData.postalCode || '',
                              latitude: locationData.latitude as number | undefined,
                              longitude: locationData.longitude as number | undefined
                            });
                          }}

                          required={true}
                          className="w-full"
                        />

                      {/* Privacy Settings */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-gray-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Address Privacy</h4>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hideAddress"
                                checked={formData.hideAddress}
                                onChange={(e) => setFormData({ ...formData, hideAddress: e.target.checked })}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <label htmlFor="hideAddress" className="ml-2 text-sm text-gray-700">
                                Hide detailed address from public view
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              When enabled, only city and country will be shown to the public.
                              Full address remains visible to admins and is used for location-based search.
                            </p>
                          </div>
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
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-4">
                            📸 Images
                            <span className="text-gray-500 font-normal ml-2">Show off your location with beautiful photos</span>
                          </label>
                          <ListingImageUpload
                            key={editingListing?.id || 'new'}
                            onImagesChange={setImages}
                            initialImages={images}
                          />
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex items-start">
                            <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 mb-3">📷 Photo Guidelines</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                <div>
                                  <h5 className="font-medium mb-2">✅ Best Practices:</h5>
                                  <ul className="space-y-1">
                                    <li>• High-resolution images (1200x800px+)</li>
                                    <li>• Natural lighting when possible</li>
                                    <li>• Multiple angles and perspectives</li>
                                    <li>• Show people enjoying the space</li>
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-medium mb-2">💡 Pro Tips:</h5>
                                  <ul className="space-y-1">
                                    <li>• First image becomes the cover</li>
                                    <li>• Drag and drop to reorder</li>
                                    <li>• Include unique features</li>
                                    <li>• Avoid heavy filters</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
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

                      {/* Status Management Section */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-4">Listing Status</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              {
                                value: 'active',
                                label: 'Active',
                                description: 'Visible to all users in search results',
                                icon: (
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ),
                                color: 'green'
                              },
                              {
                                value: 'inactive',
                                label: 'Inactive',
                                description: 'Hidden from search but not deleted',
                                icon: (
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                ),
                                color: 'gray'
                              }
                            ].map((option) => (
                              <label
                                key={option.value}
                                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                  formData.status === option.value
                                    ? `border-${option.color}-500 bg-${option.color}-50`
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="status"
                                  value={option.value}
                                  checked={formData.status === option.value}
                                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'pending' | 'rejected' })}
                                  className="sr-only"
                                />
                                <div className="flex items-center justify-between mb-2">
                                  {option.icon}
                                  {formData.status === option.value && (
                                    <svg className={`w-5 h-5 text-${option.color}-600`} fill="currentColor" viewBox="0 0 20 20">
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

                        {/* Admin-only status options */}
                        {/* TODO: Show pending/rejected options only for admins */}
                      </div>

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
                <div className="border-t border-gray-200 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div className="flex space-x-3">
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
                          className="px-4 py-2 border border-gray-300 rounded-xl font-medium hover:bg-white hover:shadow-sm transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Previous</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Tab Progress Indicators */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Progress:</span>
                        <div className="flex space-x-2">
                          {['basic', 'location', 'contact', 'media', 'pricing'].map((tab, index) => {
                            const isActive = tab === activeTab;
                            const isCompleted = ['basic', 'location', 'contact', 'media', 'pricing'].indexOf(activeTab) > index;
                            return (
                              <div
                                key={tab}
                                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                  isActive ? 'bg-green-600 ring-2 ring-green-200' :
                                  isCompleted ? 'bg-green-400' : 'bg-gray-300'
                                }`}
                                title={tab.charAt(0).toUpperCase() + tab.slice(1)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {/* Save Changes button - available on all tabs except pricing when editing */}
                      {isEditing && activeTab !== 'pricing' && (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-8 py-3 border-2 border-green-600 bg-transparent hover:bg-green-600 disabled:border-gray-300 disabled:cursor-not-allowed text-green-600 hover:text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                          {isSubmitting ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                          )}
                          <span>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </span>
                        </button>
                      )}

                      {/* Next button for non-pricing tabs */}
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
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                          <span>Next</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        /* Final submit button for pricing tab or create new listing */
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                          {isSubmitting ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                          <span>
                            {isSubmitting
                              ? (isEditing ? 'Updating...' : 'Creating...')
                              : (isEditing ? 'Update Listing' : 'Create Listing')
                            }
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingListing(null);
                          setShowCreateForm(false);
                        }}
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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600">Manage your listings and track their performance</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading your listings...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600">Manage your listings and track their performance</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Listings</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshListings}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
            onClick={() => {
              setEditingListing(null);
              setShowCreateForm(true);
            }}
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
                        {/* Enhanced Location Display */}
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="flex items-center space-x-2">
                            {/* Country Flag */}
                            <span className="text-base">
                              {listing.location.country === 'Germany' || listing.location.country === 'DE' ? '🇩🇪' :
                               listing.location.country === 'Italy' || listing.location.country === 'IT' ? '🇮🇹' :
                               listing.location.country === 'Spain' || listing.location.country === 'ES' ? '🇪🇸' :
                               listing.location.country === 'France' || listing.location.country === 'FR' ? '🇫🇷' : '🌍'}
                            </span>

                            {/* Postal Code */}
                            {listing.location.postalCode && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {listing.location.postalCode}
                              </span>
                            )}

                            {/* City */}
                            <span>{listing.location.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditListing(listing.id)}
                        disabled={loadingEditData === listing.id}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                          loadingEditData === listing.id
                            ? 'bg-green-400 cursor-wait text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {loadingEditData === listing.id ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Opening...</span>
                          </>
                        ) : (
                          <span>Edit</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleViewListing(listing.id)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
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
            onClick={() => {
              setEditingListing(null);
              setEditingListingId(null);
              setLoadingEditData(null);
              setShowCreateForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First Listing
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && <CreateListingForm />}

      {/* Listing Detail Modal */}
      {selectedListingId && (
        <ListingDetail
          listingId={selectedListingId}
          onClose={() => setSelectedListingId(null)}
          onEdit={(listingId) => {
            setSelectedListingId(null);
            handleEditListing(listingId);
          }}
        />
      )}

      {/* Click outside to close dropdown */}
      {showDropdownId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdownId(null)}
        />
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Potential Duplicate Detected</h3>
                  <p className="text-sm text-gray-600 mt-1">{duplicateWarning.message}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  We found {duplicateWarning.duplicates.length} similar listing{duplicateWarning.duplicates.length > 1 ? 's' : ''} that might be duplicates:
                </p>

                {duplicateWarning.duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{duplicate.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{duplicate.address}</p>
                        <p className="text-sm text-yellow-700 mt-2">{duplicate.reason}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {duplicate.confidence}% match
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Force create by adding a bypass flag
                    setDuplicateWarning(null);
                    // You could implement a force create option here
                    alert('Please modify your listing to make it more unique, or contact support if you believe this is not a duplicate.');
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Review & Modify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
