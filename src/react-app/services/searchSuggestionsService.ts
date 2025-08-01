export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'category' | 'popular' | 'recent' | 'location';
  iconType?: 'leaf' | 'droplet' | 'shopping-cart' | 'recycle' | 'building-storefront' | 'paint-brush' | 'beaker' | 'carrot' | 'sparkles' | 'sun' | 'clock' | 'bookmark' | 'location-marker' | 'package' | 'shield-check' | 'bread';
  count?: number;
  category?: string;
}

export class SearchSuggestionsService {
  /**
   * Get SVG icon for a given icon type
   */
  static getIcon(iconType: string, className: string = "w-4 h-4"): string {
    const icons: Record<string, string> = {
      'leaf': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 5.5 13.5 3M7 7l2.5 2.5L7 12.5 4.5 10M13 13l2.5 2.5L13 18.5 10.5 16M21 21l-2.5-2.5L21 15.5 23.5 18"/></svg>`,
      'droplet': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.5 14.25c0-1.5 1.5-3 3.75-3s3.75 1.5 3.75 3-1.5 3-3.75 3-3.75-1.5-3.75-3z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.25c-1.5 0-3 1.5-3 3.75 0 2.25 3 6.75 3 6.75s3-4.5 3-6.75c0-2.25-1.5-3.75-3-3.75z"/></svg>`,
      'shopping-cart': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-7.5 0h7.5"/></svg>`,
      'recycle': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
      'building-storefront': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
      'paint-brush': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 5H5v12a2 2 0 002 2 2 2 0 002-2V5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5l4-4 4 4-4 4-4-4z"/></svg>`,
      'beaker': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.934 1.934 0 004 17.5a2 2 0 002 2 2 2 0 002-2 2 2 0 012-2 2 2 0 012 2 2 2 0 002 2 2 2 0 002-2 2 2 0 012-2 2 2 0 012 2 2 2 0 002 2 2 2 0 002-2 1.934 1.934 0 00-.244-1.757z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8.5c0 .5-.5 1.5-1 2.5H9c-.5-1-1-2-1-2.5a4 4 0 118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v6.5"/></svg>`,
      'carrot': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/></svg>`,
      'sparkles': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 5.5 13.5 3M7 7l2.5 2.5L7 12.5 4.5 10M13 13l2.5 2.5L13 18.5 10.5 16M21 21l-2.5-2.5L21 15.5 23.5 18"/></svg>`,
      'sun': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
      'clock': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      'bookmark': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`,
      'location-marker': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      'package': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      'shield-check': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
      'bread': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.704 2.704 0 003 15.546V6.454c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0c.454.303.977.454 1.5.454v9.092z"/></svg>`
    };
    return icons[iconType] || icons['sparkles'];
  }
  private static popularSearches: SearchSuggestion[] = [
    { id: '1', text: 'organic farms', type: 'popular', iconType: 'leaf', count: 156 },
    { id: '2', text: 'water sources', type: 'popular', iconType: 'droplet', count: 89 },
    { id: '3', text: 'local markets', type: 'popular', iconType: 'shopping-cart', count: 134 },
    { id: '4', text: 'sustainable businesses', type: 'popular', iconType: 'recycle', count: 78 },
    { id: '5', text: 'vending machines', type: 'popular', iconType: 'building-storefront', count: 45 },
    { id: '6', text: 'craft workshops', type: 'popular', iconType: 'paint-brush', count: 67 },
    { id: '7', text: 'honey producers', type: 'popular', iconType: 'beaker', count: 34 },
    { id: '8', text: 'fresh produce', type: 'popular', iconType: 'carrot', count: 92 },
    { id: '9', text: 'eco-friendly shops', type: 'popular', iconType: 'sparkles', count: 56 },
    { id: '10', text: 'community gardens', type: 'popular', iconType: 'sun', count: 43 }
  ];

  private static categorySearches: SearchSuggestion[] = [
    { id: 'cat1', text: 'Organic Farms', type: 'category', iconType: 'leaf', category: 'organic_farm' },
    { id: 'cat2', text: 'Local Products', type: 'category', iconType: 'building-storefront', category: 'local_product' },
    { id: 'cat3', text: 'Water Sources', type: 'category', iconType: 'droplet', category: 'water_source' },
    { id: 'cat4', text: 'Vending Machines', type: 'category', iconType: 'building-storefront', category: 'vending_machine' },
    { id: 'cat5', text: 'Crafts & Arts', type: 'category', iconType: 'paint-brush', category: 'craft' }
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
      iconType: 'clock'
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
      { id: 'trend1', text: 'sustainable packaging', type: 'popular', iconType: 'package', count: 23 },
      { id: 'trend2', text: 'zero waste stores', type: 'popular', iconType: 'recycle', count: 18 },
      { id: 'trend3', text: 'local honey', type: 'popular', iconType: 'beaker', count: 31 },
      { id: 'trend4', text: 'organic vegetables', type: 'popular', iconType: 'leaf', count: 27 },
      { id: 'trend5', text: 'artisan bread', type: 'popular', iconType: 'bread', count: 15 }
    ];
  }
}
