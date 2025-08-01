import React, { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  results: number;
  location?: string;
  filters?: any;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  location?: string;
  filters?: any;
  createdAt: string;
  lastUsed: string;
}

interface SearchHistoryProps {
  onSearchSelect: (query: string, filters?: any) => void;
  className?: string;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  onSearchSelect,
  className = ""
}) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        const historyData = localStorage.getItem('kisigua_search_history');
        if (historyData) {
          setSearchHistory(JSON.parse(historyData));
        }

        const savedData = localStorage.getItem('kisigua_saved_searches');
        if (savedData) {
          setSavedSearches(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };

    loadData();
  }, []);

  // Add search to history
  const addToHistory = (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: SearchHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newItem, ...searchHistory.filter(h => h.query !== item.query)].slice(0, 20);
    setSearchHistory(updatedHistory);
    localStorage.setItem('kisigua_search_history', JSON.stringify(updatedHistory));
  };

  // Save search
  const saveSearch = (item: SearchHistoryItem, name: string) => {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: item.query,
      location: item.location,
      filters: item.filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    const updatedSaved = [savedSearch, ...savedSearches].slice(0, 10);
    setSavedSearches(updatedSaved);
    localStorage.setItem('kisigua_saved_searches', JSON.stringify(updatedSaved));
  };

  // Delete saved search
  const deleteSavedSearch = (id: string) => {
    const updatedSaved = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updatedSaved);
    localStorage.setItem('kisigua_saved_searches', JSON.stringify(updatedSaved));
  };

  // Clear history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('kisigua_search_history');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Expose methods for parent component
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    addToHistory,
    saveSearch
  }));

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Search History</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Saved
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'history' ? (
          <div className="space-y-3">
            {searchHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">No search history yet</p>
              </div>
            ) : (
              <>
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onSearchSelect(item.query, item.filters)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-medium text-gray-900">{item.query}</span>
                        {item.location && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            📍 {item.location}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.results} results • {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const name = prompt('Enter a name for this saved search:');
                          if (name) saveSearch(item, name);
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Save search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {searchHistory.length > 0 && (
                  <div className="text-center pt-3 border-t border-gray-200">
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <p className="text-gray-500 text-sm">No saved searches yet</p>
              </div>
            ) : (
              savedSearches.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onSearchSelect(item.query, item.filters)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{item.query}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Saved {formatTimestamp(item.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedSearch(item.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete saved search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
