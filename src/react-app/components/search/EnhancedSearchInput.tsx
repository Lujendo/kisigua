import React, { useState, useEffect, useRef } from 'react';
import { SearchSuggestionsService, SearchSuggestion } from '../../services/searchSuggestionsService';

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
                <span className="text-lg">{suggestion.icon}</span>
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
