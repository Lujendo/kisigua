import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SemanticSearchResult {
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

interface SemanticSearchProps {
  onResultsChange?: (results: SemanticSearchResult[]) => void;
  initialQuery?: string;
  showAdvancedOptions?: boolean;
}

const SemanticSearchComponent: React.FC<SemanticSearchProps> = ({
  onResultsChange,
  initialQuery = '',
  showAdvancedOptions = true
}) => {
  const { token } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'semantic' | 'hybrid'>('semantic');
  const [minScore, setMinScore] = useState(0.7);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(10);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'organic_farm', label: 'Organic Farm' },
    { value: 'local_product', label: 'Local Product' },
    { value: 'sustainable_service', label: 'Sustainable Service' },
    { value: 'eco_friendly', label: 'Eco-Friendly' },
    { value: 'renewable_energy', label: 'Renewable Energy' },
    { value: 'zero_waste', label: 'Zero Waste' },
    { value: 'community_garden', label: 'Community Garden' },
    { value: 'farmers_market', label: 'Farmers Market' }
  ];

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchPayload = {
        query: query.trim(),
        limit,
        minScore,
        ...(category && { category })
      };

      const endpoint = searchType === 'semantic' 
        ? '/api/listings/semantic-search'
        : '/api/listings/hybrid-search';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (searchType === 'semantic') {
        setResults(data.results || []);
        setSearchTime(null);
      } else {
        // Hybrid search response
        setResults(data.combinedResults || []);
        setSearchTime(data.searchTime || null);
      }

      if (onResultsChange) {
        onResultsChange(data.results || data.combinedResults || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  // Auto-search when query changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchType, minScore, category, limit]);

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for sustainable businesses, products, or services..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'semantic' | 'hybrid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="semantic">Semantic (AI)</option>
                <option value="hybrid">Hybrid (AI + Keywords)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Similarity ({formatScore(minScore)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Results Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Search Info */}
      {(results.length > 0 || error) && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {error ? (
              <span className="text-red-600">❌ {error}</span>
            ) : (
              <span>
                ✅ Found {results.length} results
                {searchTime && ` in ${searchTime}ms`}
                {searchType === 'semantic' && ' (AI-powered)'}
              </span>
            )}
          </div>
          {results.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs">Powered by</span>
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-xs font-medium text-green-600">Vectorize AI</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 cursor-pointer">
                  {result.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                    {formatScore(result.score)}% match
                  </span>
                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3 line-clamp-2">
                {result.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {result.category.replace('_', ' ')}
                </span>
                {result.location?.city && (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {result.location.city}
                  </span>
                )}
                {result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                    {result.tags.length > 3 && (
                      <span className="text-gray-400 text-xs">+{result.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && query.trim() && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or reducing the similarity threshold.
          </p>
        </div>
      )}
    </div>
  );
};

export default SemanticSearchComponent;
