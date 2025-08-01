/**
 * Enhanced Location Display Component
 * Shows comprehensive location information including postal codes
 */

import React from 'react';
import { MapService } from '../../services/mapService';

interface LocationData {
  address?: string;
  street?: string;
  houseNumber?: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number };
}

interface EnhancedLocationDisplayProps {
  location: LocationData;
  showMap?: boolean;
  showPostalCode?: boolean;
  showCoordinates?: boolean;
  compact?: boolean;
  className?: string;
}

const EnhancedLocationDisplay: React.FC<EnhancedLocationDisplayProps> = ({
  location,
  showMap: _showMap, // Currently unused but kept for future features
  showPostalCode = true,
  showCoordinates = false,
  compact = false,
  className = ""
}) => {
  // Get country flag
  const getCountryFlag = (country: string): string => {
    const countryToCode: Record<string, string> = {
      'Germany': 'DE',
      'Deutschland': 'DE',
      'Italy': 'IT',
      'Italia': 'IT',
      'Spain': 'ES',
      'España': 'ES',
      'France': 'FR',
      'DE': 'DE',
      'IT': 'IT',
      'ES': 'ES',
      'FR': 'FR'
    };
    
    const countryCode = countryToCode[country] || country;
    return MapService.getCountryFlag(countryCode);
  };

  // Format address
  const formatAddress = (): string => {
    const parts = [];
    
    if (location.address) {
      parts.push(location.address);
    } else {
      const streetAddress = [location.street, location.houseNumber].filter(Boolean).join(' ');
      if (streetAddress) parts.push(streetAddress);
    }
    
    return parts.join(', ');
  };

  // Format city line
  const formatCityLine = (): string => {
    const parts = [];
    
    if (location.postalCode && showPostalCode) {
      parts.push(location.postalCode);
    }
    
    parts.push(location.city);
    
    if (location.region) {
      parts.push(location.region);
    }
    
    return parts.join(' ');
  };

  // Get coordinates
  const getCoordinates = () => {
    if (location.coordinates) {
      return location.coordinates;
    }
    if (location.latitude && location.longitude) {
      return { lat: location.latitude, lng: location.longitude };
    }
    return null;
  };

  const coordinates = getCoordinates();

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <span className="text-lg">{getCountryFlag(location.country)}</span>
        <div className="flex items-center space-x-1 text-gray-600">
          {location.postalCode && showPostalCode && (
            <>
              <span className="font-medium text-blue-600">{location.postalCode}</span>
              <span>•</span>
            </>
          )}
          <span>{location.city}</span>
          {location.region && (
            <>
              <span>•</span>
              <span className="text-gray-500">{location.region}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Address Header */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Street Address */}
          {formatAddress() && (
            <div className="text-gray-900 font-medium mb-1">
              {formatAddress()}
            </div>
          )}
          
          {/* City, Postal Code, Region */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getCountryFlag(location.country)}</span>
            <div className="text-gray-700">
              {formatCityLine()}
            </div>
          </div>
          
          {/* Country */}
          <div className="text-sm text-gray-500">
            {location.country}
          </div>
          
          {/* Postal Code Badge (if not shown in city line) */}
          {location.postalCode && showPostalCode && !formatCityLine().includes(location.postalCode) && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📮 {location.postalCode}
              </span>
            </div>
          )}
          
          {/* Coordinates (if enabled) */}
          {coordinates && showCoordinates && (
            <div className="mt-2 text-xs text-gray-400 font-mono">
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Location Info */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {location.region && (
            <div>
              <span className="text-gray-500">Region:</span>
              <span className="ml-2 font-medium text-gray-900">{location.region}</span>
            </div>
          )}
          
          {location.postalCode && (
            <div>
              <span className="text-gray-500">Postal Code:</span>
              <span className="ml-2 font-medium text-blue-600">{location.postalCode}</span>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
          {coordinates && (
            <>
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                  window.open(url, '_blank');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open in Maps</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${coordinates.lat}, ${coordinates.lng}`);
                }}
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Coordinates</span>
              </button>
            </>
          )}
          
          {location.postalCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(location.postalCode!);
              }}
              className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Postal Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationDisplay;
