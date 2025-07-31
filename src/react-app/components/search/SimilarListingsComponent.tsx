import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SimilarListing {
  id: string;
  title: string;
  description: string;
  category: string;
  location: any;
  tags: string[];
  images: string[];
  score: number;
  relevanceScore: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
}

interface SimilarListingsProps {
  listingId: string;
  limit?: number;
  onListingClick?: (listing: SimilarListing) => void;
  className?: string;
}

const SimilarListingsComponent: React.FC<SimilarListingsProps> = ({
  listingId,
  limit = 5,
  onListingClick,
  className = ''
}) => {
  const { token } = useAuth();
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listingId) {
      fetchSimilarListings();
    }
  }, [listingId, limit]);

  const fetchSimilarListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/similar?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch similar listings: ${response.status}`);
      }

      const data = await response.json();
      setSimilarListings(data.results || []);
    } catch (err) {
      console.error('Similar listings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load similar listings');
      setSimilarListings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleListingClick = (listing: SimilarListing) => {
    if (onListingClick) {
      onListingClick(listing);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-green-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-600">Finding similar listings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="text-red-600 text-sm">
          ❌ {error}
        </div>
        <button
          onClick={fetchSimilarListings}
          className="mt-2 text-green-600 hover:text-green-700 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (similarListings.length === 0) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-gray-500 text-sm">No similar listings found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>Similar Listings</span>
        </h3>
        <span className="text-sm text-gray-500">
          AI-powered recommendations
        </span>
      </div>

      <div className="space-y-3">
        {similarListings.map((listing) => (
          <div
            key={listing.id}
            onClick={() => handleListingClick(listing)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                {listing.title}
              </h4>
              <div className="flex items-center space-x-1 ml-2">
                <span className={`text-xs font-medium ${getScoreColor(listing.score)}`}>
                  {formatScore(listing.score)}%
                </span>
                <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${listing.score * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {listing.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {listing.category.replace('_', ' ')}
              </span>
              
              {listing.location?.city && (
                <span className="flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location.city}
                </span>
              )}
              
              {listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {listing.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                  {listing.tags.length > 2 && (
                    <span className="text-gray-400 text-xs">+{listing.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Similarity indicator */}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Similarity match</span>
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          i < Math.round(listing.score * 5) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1">{formatScore(listing.score)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Powered by indicator */}
      <div className="text-center pt-2 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          <span>Powered by</span>
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="font-medium text-green-600">Vectorize AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarListingsComponent;
