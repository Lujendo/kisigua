import React, { useState, useEffect, useRef } from 'react';
import { SearchSuggestionsService, SearchSuggestion } from '../../services/searchSuggestionsService';

// Icon component for rendering SVG icons
const Icon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  const getIconPath = (iconType: string) => {
    const icons: Record<string, React.ReactElement> = {
      'leaf': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 5.5 13.5 3M7 7l2.5 2.5L7 12.5 4.5 10M13 13l2.5 2.5L13 18.5 10.5 16M21 21l-2.5-2.5L21 15.5 23.5 18" />
      ),
      'droplet': (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25c0-1.5 1.5-3 3.75-3s3.75 1.5 3.75 3-1.5 3-3.75 3-3.75-1.5-3.75-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.25c-1.5 0-3 1.5-3 3.75 0 2.25 3 6.75 3 6.75s3-4.5 3-6.75c0-2.25-1.5-3.75-3-3.75z" />
        </>
      ),
      'shopping-cart': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-7.5 0h7.5" />
      ),
      'recycle': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      ),
      'building-storefront': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ),
      'paint-brush': (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 5H5v12a2 2 0 002 2 2 2 0 002-2V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l4-4 4 4-4 4-4-4z" />
        </>
      ),
      'beaker': (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.934 1.934 0 004 17.5a2 2 0 002 2 2 2 0 002-2 2 2 0 012-2 2 2 0 012 2 2 2 0 002 2 2 2 0 002-2 2 2 0 012-2 2 2 0 012 2 2 2 0 002 2 2 2 0 002-2 1.934 1.934 0 00-.244-1.757z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8.5c0 .5-.5 1.5-1 2.5H9c-.5-1-1-2-1-2.5a4 4 0 118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v6.5" />
        </>
      ),
      'carrot': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      ),
      'sparkles': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 5.5 13.5 3M7 7l2.5 2.5L7 12.5 4.5 10M13 13l2.5 2.5L13 18.5 10.5 16M21 21l-2.5-2.5L21 15.5 23.5 18" />
      ),
      'sun': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      'clock': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      'bookmark': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      )
    };
    return icons[iconType] || icons['sparkles'];
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {getIconPath(type)}
    </svg>
  );
};

interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  showAIBadge?: boolean;
  disabled?: boolean;
}

const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for organic farms, water sources, sustainable businesses...",
  className = "",
  showAIBadge = false,
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions when value changes
  useEffect(() => {
    const updateSuggestions = () => {
      if (value.length === 0) {
        // Show popular searches and categories when empty
        const popularSuggestions = SearchSuggestionsService.getSuggestions('', 6);
        setSuggestions(popularSuggestions);
        setShowSuggestions(false); // Don't show by default when empty
      } else {
        setIsLoading(true);
        // Debounce suggestions
        const timer = setTimeout(() => {
          const newSuggestions = SearchSuggestionsService.getSuggestions(value, 8);
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
          setSelectedIndex(-1);
          setIsLoading(false);
        }, 150);
        
        return () => clearTimeout(timer);
      }
    };

    updateSuggestions();
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value.length === 0) {
      const popularSuggestions = SearchSuggestionsService.getSuggestions('', 6);
      setSuggestions(popularSuggestions);
    }
    setShowSuggestions(suggestions.length > 0);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Add to recent searches
    SearchSuggestionsService.addRecentSearch(suggestion.text);
    
    // Trigger search
    onSearch(suggestion.text);
  };

  // Handle search
  const handleSearch = () => {
    if (value.trim()) {
      SearchSuggestionsService.addRecentSearch(value.trim());
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  // Get suggestion type label
  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'category': return 'Category';
      case 'popular': return 'Popular';
      case 'recent': return 'Recent';
      case 'location': return 'Location';
      default: return '';
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-6 py-3 text-gray-900 bg-transparent rounded-full focus:outline-none text-lg"
      />
      
      {/* AI Badge */}
      {showAIBadge && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          AI
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto"
        >
          {/* Header for empty search */}
          {value.length === 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-700">Popular searches</div>
            </div>
          )}
          
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-green-50 border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-500">
                  {suggestion.iconType && <Icon type={suggestion.iconType} className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-gray-900 font-medium">{suggestion.text}</div>
                  {suggestion.type !== 'category' && (
                    <div className="text-xs text-gray-500">
                      {getSuggestionTypeLabel(suggestion.type)}
                      {suggestion.count && ` • ${suggestion.count} results`}
                    </div>
                  )}
                </div>
              </div>
              
              {suggestion.type === 'recent' && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          ))}
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Press ↑↓ to navigate, Enter to select, Esc to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;
