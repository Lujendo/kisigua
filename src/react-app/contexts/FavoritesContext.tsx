import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (locationId: string) => void;
  removeFromFavorites: (locationId: string) => void;
  isFavorite: (locationId: string) => boolean;
  toggleFavorite: (locationId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('kisigua_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kisigua_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (locationId: string) => {
    setFavorites(prev => {
      if (!prev.includes(locationId)) {
        return [...prev, locationId];
      }
      return prev;
    });
  };

  const removeFromFavorites = (locationId: string) => {
    setFavorites(prev => prev.filter(id => id !== locationId));
  };

  const isFavorite = (locationId: string) => {
    return favorites.includes(locationId);
  };

  const toggleFavorite = (locationId: string) => {
    if (isFavorite(locationId)) {
      removeFromFavorites(locationId);
    } else {
      addToFavorites(locationId);
    }
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
