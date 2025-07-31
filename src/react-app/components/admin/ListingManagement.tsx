import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  location: {
    address: string;
    city: string;
    country: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
  };
  images: string[];
  userId: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  priceRange?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

const ListingManagement: React.FC = () => {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch all listings and users
  useEffect(() => {
    fetchListings();
    fetchUsers();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/admin/listings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        setError('Failed to fetch listings');
      }
    } catch (err) {
      setError('Error fetching listings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userMap: { [key: string]: User } = {};
        data.users?.forEach((user: User) => {
          userMap[user.id] = user;
        });
        setUsers(userMap);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Update listing status
  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setListings(prev => prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: newStatus as any }
            : listing
        ));
      } else {
        alert('Failed to update listing status');
      }
    } catch (err) {
      console.error('Error updating listing:', err);
      alert('Error updating listing status');
    }
  };

  // Delete listing
  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setListings(prev => prev.filter(listing => listing.id !== listingId));
        setSelectedListings(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
      } else {
        alert('Failed to delete listing');
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Error deleting listing');
    }
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (newStatus: string) => {
    const listingIds = Array.from(selectedListings);
    
    try {
      const promises = listingIds.map(id => 
        fetch(`/api/listings/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(promises);
      
      setListings(prev => prev.map(listing => 
        selectedListings.has(listing.id)
          ? { ...listing, status: newStatus as any }
          : listing
      ));
      
      setSelectedListings(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error updating listings:', err);
      alert('Error updating listings');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedListings.size} listings? This action cannot be undone.`)) {
      return;
    }

    const listingIds = Array.from(selectedListings);
    
    try {
      const promises = listingIds.map(id => 
        fetch(`/api/listings/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(promises);
      
      setListings(prev => prev.filter(listing => !selectedListings.has(listing.id)));
      setSelectedListings(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error deleting listings:', err);
      alert('Error deleting listings');
    }
  };

  // Filter and sort listings
  const filteredAndSortedListings = listings
    .filter(listing => {
      const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || listing.category === filterCategory;
      const matchesSearch = searchTerm === '' || 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique categories
  const categories = [...new Set(listings.map(l => l.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchListings}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listing Management</h1>
          <p className="text-gray-600">Manage all listings across the platform</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedListings.length} of {listings.length} listings
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search listings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedListings.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedListings.size} listing{selectedListings.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Bulk Actions
              </button>
              <button
                onClick={() => setSelectedListings(new Set())}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
          
          {showBulkActions && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Mark Active
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('inactive')}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Mark Inactive
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('pending')}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Mark Pending
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Mark Rejected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-800 text-white rounded text-sm hover:bg-red-900"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedListings.size === filteredAndSortedListings.length && filteredAndSortedListings.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedListings(new Set(filteredAndSortedListings.map(l => l.id)));
                      } else {
                        setSelectedListings(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedListings);
                        if (e.target.checked) {
                          newSet.add(listing.id);
                        } else {
                          newSet.delete(listing.id);
                        }
                        setSelectedListings(newSet);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'}
                          alt={listing.title}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                        <div className="text-sm text-gray-500">{listing.location.city}, {listing.location.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {listing.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {users[listing.userId]?.email || listing.userId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Status Actions */}
                      {listing.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateListingStatus(listing.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateListingStatus(listing.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {listing.status === 'active' && (
                        <button
                          onClick={() => updateListingStatus(listing.id, 'inactive')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Deactivate
                        </button>
                      )}
                      
                      {listing.status === 'inactive' && (
                        <button
                          onClick={() => updateListingStatus(listing.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                      
                      {listing.status === 'rejected' && (
                        <button
                          onClick={() => updateListingStatus(listing.id, 'pending')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                      )}
                      
                      {/* Delete Action */}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedListings.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No listings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'No listings have been created yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingManagement;
