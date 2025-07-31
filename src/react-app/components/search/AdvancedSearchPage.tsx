import React, { useState } from 'react';
import SemanticSearchComponent from './SemanticSearchComponent';
import RecommendationsComponent from './RecommendationsComponent';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResult {
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

const AdvancedSearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations'>('search');

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
  };

  const handleListingClick = (listing: SearchResult) => {
    // Navigate to listing detail page
    console.log('Navigate to listing:', listing.id);
    // This would typically use router navigation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Powered Sustainable Search
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover sustainable businesses, products, and services using advanced semantic search 
            powered by artificial intelligence. Find exactly what you're looking for with natural language queries.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>AI Search</span>
              </div>
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'recommendations'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span>For You</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'search' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <SemanticSearchComponent
                onResultsChange={handleSearchResults}
                showAdvancedOptions={true}
              />
            </div>
          )}

          {activeTab === 'recommendations' && user && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <RecommendationsComponent
                limit={12}
                onListingClick={handleListingClick}
                showTitle={true}
              />
            </div>
          )}

          {/* Features Section */}
          {searchResults.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Semantic Understanding
                </h3>
                <p className="text-gray-600 text-sm">
                  Our AI understands the meaning behind your search, not just keywords. 
                  Search naturally and find exactly what you need.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Location-Aware
                </h3>
                <p className="text-gray-600 text-sm">
                  Find sustainable options near you with intelligent location-based filtering 
                  and distance calculations.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Personalized Results
                </h3>
                <p className="text-gray-600 text-sm">
                  Get recommendations tailored to your interests and search history 
                  for a more relevant experience.
                </p>
              </div>
            </div>
          )}

          {/* Search Examples */}
          {searchResults.length === 0 && activeTab === 'search' && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Try These Example Searches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "organic vegetables near me",
                  "zero waste stores in Berlin",
                  "sustainable fashion brands",
                  "local farmers markets",
                  "eco-friendly cleaning products",
                  "renewable energy consultants"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // This would set the search query
                      console.log('Search for:', example);
                    }}
                    className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm text-gray-700 group-hover:text-green-700">
                        "{example}"
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Technology Info */}
          <div className="bg-gray-900 rounded-lg p-8 text-white mt-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">
                Powered by Advanced AI Technology
              </h3>
              <p className="text-gray-300 mb-6 max-w-3xl mx-auto">
                Our search engine uses Cloudflare Vectorize and OpenAI embeddings to understand 
                the semantic meaning of your queries, delivering more relevant and accurate results 
                than traditional keyword-based search.
              </p>
              <div className="flex items-center justify-center space-x-8">
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-sm font-medium">Cloudflare Vectorize</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-sm font-medium">OpenAI Embeddings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium">Real-time Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;
