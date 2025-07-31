import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RecommendedListing {
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

interface RecommendationsProps {
  limit?: number;
  onListingClick?: (listing: RecommendedListing) => void;
  className?: string;
  showTitle?: boolean;
}

const RecommendationsComponent: React.FC<RecommendationsProps> = ({
  limit = 10,
  onListingClick,
  className = '',
  showTitle = true
}) => {
  const { token, user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchRecommendations();
    }
  }, [user, token, limit]);

  const fetchRecommendations = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/recommendations?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.results || []);
    } catch (err) {
      console.error('Recommendations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      setRecommendations([]);
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

  const handleListingClick = (listing: RecommendedListing) => {
    if (onListingClick) {
      onListingClick(listing);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-medium text-blue-900 mb-2">Sign in for Personalized Recommendations</h3>
          <p className="text-blue-700 text-sm">
            Get AI-powered recommendations based on your interests and search history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-green-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading personalized recommendations...</span>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="text-red-600 text-sm mb-2">
          ❌ {error}
        </div>
        <button
          onClick={handleRefresh}
          className="text-green-600 hover:text-green-700 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 text-sm mb-4">
            Start searching and favoriting listings to get personalized AI recommendations!
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Recommendations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span>Recommended for You</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">AI-powered</span>
            <button
              onClick={handleRefresh}
              className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-50 transition-colors"
              title="Refresh recommendations"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((listing) => (
          <div
            key={listing.id}
            onClick={() => handleListingClick(listing)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                {listing.title}
              </h4>
              <div className="flex items-center space-x-1 ml-2">
                <span className={`text-xs font-medium ${getScoreColor(listing.score)}`}>
                  {formatScore(listing.score)}%
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {listing.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
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
            </div>

            {listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {listing.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    #{tag}
                  </span>
                ))}
                {listing.tags.length > 3 && (
                  <span className="text-gray-400 text-xs">+{listing.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Match indicator */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Relevance match</span>
                <div className="flex items-center space-x-1">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${listing.score * 100}%` }}
                    />
                  </div>
                  <span className="ml-1">{formatScore(listing.score)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Powered by indicator */}
      <div className="text-center pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          <span>Personalized recommendations powered by</span>
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

export default RecommendationsComponent;
