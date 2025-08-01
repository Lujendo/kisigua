import React, { useState } from 'react';
import { PostalCodeLookupService, RegionLookupResult } from '../../services/postalCodeLookupService';

/**
 * Debug component to test region lookup functionality
 * This can be temporarily added to any page to test the region lookup
 */
export const RegionLookupTest: React.FC = () => {
  const [regionQuery, setRegionQuery] = useState('');
  const [results, setResults] = useState<RegionLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testRegionLookup = async () => {
    if (!regionQuery.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing region lookup for:', regionQuery);
      const lookupResults = await PostalCodeLookupService.lookupByRegion(regionQuery, 'DE');
      console.log('Region lookup results:', lookupResults);
      setResults(lookupResults);
      
      if (lookupResults.length === 0) {
        setError('No results found. Check browser console for debug info.');
      }
    } catch (err) {
      console.error('Region lookup test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    if (!regionQuery.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing direct API call for:', regionQuery);
      const response = await fetch(`/api/locations/region-lookup?region=${encodeURIComponent(regionQuery)}&country=DE&limit=10`);
      const data = await response.json();
      console.log('Direct API response:', data);
      
      if (!response.ok) {
        setError(`API Error: ${data.error || response.statusText}`);
      } else {
        setError(`API Success: Found ${data.total} results. Check console for details.`);
      }
    } catch (err) {
      console.error('Direct API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-4">🔧 Region Lookup Debug Tool</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Region Name
          </label>
          <input
            type="text"
            value={regionQuery}
            onChange={(e) => setRegionQuery(e.target.value)}
            placeholder="e.g., Baden-Württemberg, Bayern, Hessen"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={testRegionLookup}
            disabled={loading || !regionQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Service'}
          </button>
          
          <button
            onClick={testDirectAPI}
            disabled={loading || !regionQuery.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Direct'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Results ({results.length}):</h4>
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="font-medium text-gray-900">{result.region}</div>
                <div className="text-sm text-gray-600">{result.country}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Cities: {result.cities.slice(0, 5).join(', ')}
                  {result.cities.length > 5 && ` +${result.cities.length - 5} more`}
                </div>
                <div className="text-xs text-gray-500">
                  Postal codes: {result.postalCodeRanges.join(', ')}
                </div>
                <div className="text-xs text-gray-500">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500">
          💡 Open browser console to see detailed debug information
        </div>
      </div>
    </div>
  );
};

export default RegionLookupTest;
