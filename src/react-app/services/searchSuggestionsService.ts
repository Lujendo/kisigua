export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'category' | 'popular' | 'recent' | 'location';
  icon?: string;
  count?: number;
  category?: string;
}

export class SearchSuggestionsService {
  private static popularSearches: SearchSuggestion[] = [
    { id: '1', text: 'organic farms', type: 'popular', icon: '🌱', count: 156 },
    { id: '2', text: 'water sources', type: 'popular', icon: '💧', count: 89 },
    { id: '3', text: 'local markets', type: 'popular', icon: '🛒', count: 134 },
    { id: '4', text: 'sustainable businesses', type: 'popular', icon: '♻️', count: 78 },
    { id: '5', text: 'vending machines', type: 'popular', icon: '🏪', count: 45 },
    { id: '6', text: 'craft workshops', type: 'popular', icon: '🎨', count: 67 },
    { id: '7', text: 'honey producers', type: 'popular', icon: '🍯', count: 34 },
    { id: '8', text: 'fresh produce', type: 'popular', icon: '🥕', count: 92 },
    { id: '9', text: 'eco-friendly shops', type: 'popular', icon: '🌿', count: 56 },
    { id: '10', text: 'community gardens', type: 'popular', icon: '🌻', count: 43 }
  ];

  private static categorySearches: SearchSuggestion[] = [
    { id: 'cat1', text: 'Organic Farms', type: 'category', icon: '🚜', category: 'organic_farm' },
    { id: 'cat2', text: 'Local Products', type: 'category', icon: '🏪', category: 'local_product' },
    { id: 'cat3', text: 'Water Sources', type: 'category', icon: '💧', category: 'water_source' },
    { id: 'cat4', text: 'Vending Machines', type: 'category', icon: '🏪', category: 'vending_machine' },
    { id: 'cat5', text: 'Crafts & Arts', type: 'category', icon: '🎨', category: 'craft' }
  ];

  private static recentSearches: SearchSuggestion[] = [];

  /**
   * Get search suggestions based on query
   */
  static getSuggestions(query: string, maxResults: number = 8): SearchSuggestion[] {
    if (!query || query.length < 2) {
      // Return popular searches and categories when no query
      return [
        ...this.categorySearches.slice(0, 3),
        ...this.popularSearches.slice(0, 5)
      ].slice(0, maxResults);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Add matching categories first
    const matchingCategories = this.categorySearches.filter(cat =>
      cat.text.toLowerCase().includes(normalizedQuery)
    );
    suggestions.push(...matchingCategories);

    // Add matching popular searches
    const matchingPopular = this.popularSearches.filter(search =>
      search.text.toLowerCase().includes(normalizedQuery)
    );
    suggestions.push(...matchingPopular);

    // Add matching recent searches
    const matchingRecent = this.recentSearches.filter(search =>
      search.text.toLowerCase().includes(normalizedQuery)
    );
    suggestions.push(...matchingRecent);

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
    );

    return uniqueSuggestions.slice(0, maxResults);
  }

  /**
   * Add a search to recent searches
   */
  static addRecentSearch(query: string): void {
    if (!query || query.trim().length < 2) return;

    const normalizedQuery = query.trim();
    
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(
      search => search.text.toLowerCase() !== normalizedQuery.toLowerCase()
    );

    // Add to beginning
    this.recentSearches.unshift({
      id: `recent_${Date.now()}`,
      text: normalizedQuery,
      type: 'recent',
      icon: '🕒'
    });

    // Keep only last 10 recent searches
    this.recentSearches = this.recentSearches.slice(0, 10);
  }

  /**
   * Get popular searches
   */
  static getPopularSearches(limit: number = 5): SearchSuggestion[] {
    return this.popularSearches.slice(0, limit);
  }

  /**
   * Get category suggestions
   */
  static getCategorySearches(): SearchSuggestion[] {
    return this.categorySearches;
  }

  /**
   * Get recent searches
   */
  static getRecentSearches(limit: number = 5): SearchSuggestion[] {
    return this.recentSearches.slice(0, limit);
  }

  /**
   * Clear recent searches
   */
  static clearRecentSearches(): void {
    this.recentSearches = [];
  }

  /**
   * Get trending searches (mock implementation)
   */
  static getTrendingSearches(): SearchSuggestion[] {
    return [
      { id: 'trend1', text: 'sustainable packaging', type: 'popular', icon: '📦', count: 23 },
      { id: 'trend2', text: 'zero waste stores', type: 'popular', icon: '♻️', count: 18 },
      { id: 'trend3', text: 'local honey', type: 'popular', icon: '🍯', count: 31 },
      { id: 'trend4', text: 'organic vegetables', type: 'popular', icon: '🥬', count: 27 },
      { id: 'trend5', text: 'artisan bread', type: 'popular', icon: '🍞', count: 15 }
    ];
  }
}
