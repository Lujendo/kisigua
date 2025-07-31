import { DatabaseService } from './databaseService';
import { CreateListingRequest } from '../types/listings';

export interface DuplicateMatch {
  listingId: string;
  title: string;
  address: string;
  userId: string;
  matchType: 'exact_address' | 'proximity_title' | 'contact_info' | 'fuzzy_location';
  confidence: number; // 0-100
  reason: string;
}

export class DuplicateDetectionService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Check for potential duplicates before creating a new listing
   */
  async checkForDuplicates(
    newListing: CreateListingRequest,
    userId: string
  ): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];

    // Get all active listings for comparison
    const existingListings = await this.databaseService.searchListings({
      query: '',
      filters: {},
      page: 1,
      limit: 1000 // Get all listings for comparison
    });

    for (const existing of existingListings.listings) {
      // Skip listings from the same user (allow users to have multiple listings)
      if (existing.userId === userId) {
        continue;
      }

      // Check for exact address match
      const exactAddressMatch = this.checkExactAddressMatch(newListing, existing);
      if (exactAddressMatch) {
        duplicates.push(exactAddressMatch);
        continue; // If exact address match, no need to check other criteria
      }

      // Check for proximity + title similarity
      const proximityMatch = this.checkProximityTitleMatch(newListing, existing);
      if (proximityMatch) {
        duplicates.push(proximityMatch);
      }

      // Check for contact information match
      const contactMatch = this.checkContactInfoMatch(newListing, existing);
      if (contactMatch) {
        duplicates.push(contactMatch);
      }

      // Check for fuzzy location match
      const fuzzyMatch = this.checkFuzzyLocationMatch(newListing, existing);
      if (fuzzyMatch) {
        duplicates.push(fuzzyMatch);
      }
    }

    // Sort by confidence (highest first)
    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check for exact address match (same street address + city)
   */
  private checkExactAddressMatch(
    newListing: CreateListingRequest,
    existing: any
  ): DuplicateMatch | null {
    const newAddress = this.normalizeAddress(newListing.location.address);
    const newCity = this.normalizeText(newListing.location.city);
    
    const existingAddress = this.normalizeAddress(existing.location.address);
    const existingCity = this.normalizeText(existing.location.city);

    if (newAddress === existingAddress && newCity === existingCity) {
      return {
        listingId: existing.id,
        title: existing.title,
        address: existing.location.address,
        userId: existing.userId,
        matchType: 'exact_address',
        confidence: 95,
        reason: `Same address: ${existing.location.address}, ${existing.location.city}`
      };
    }

    return null;
  }

  /**
   * Check for proximity + title similarity
   */
  private checkProximityTitleMatch(
    newListing: CreateListingRequest,
    existing: any
  ): DuplicateMatch | null {
    const distance = this.calculateDistance(
      newListing.location.latitude,
      newListing.location.longitude,
      existing.location.latitude,
      existing.location.longitude
    );

    // If within 100 meters and similar titles
    if (distance <= 0.1) { // 0.1 km = 100 meters
      const titleSimilarity = this.calculateStringSimilarity(
        this.normalizeText(newListing.title),
        this.normalizeText(existing.title)
      );

      if (titleSimilarity >= 0.7) { // 70% similarity
        const confidence = Math.min(90, Math.round(titleSimilarity * 100));
        return {
          listingId: existing.id,
          title: existing.title,
          address: existing.location.address,
          userId: existing.userId,
          matchType: 'proximity_title',
          confidence,
          reason: `Similar title "${existing.title}" within ${Math.round(distance * 1000)}m`
        };
      }
    }

    return null;
  }

  /**
   * Check for contact information match
   */
  private checkContactInfoMatch(
    newListing: CreateListingRequest,
    existing: any
  ): DuplicateMatch | null {
    const newEmail = newListing.contactInfo?.email?.toLowerCase().trim();
    const newPhone = this.normalizePhone(newListing.contactInfo?.phone);

    const existingEmail = existing.contactInfo?.email?.toLowerCase().trim();
    const existingPhone = this.normalizePhone(existing.contactInfo?.phone);

    // Check email match
    if (newEmail && existingEmail && newEmail === existingEmail) {
      return {
        listingId: existing.id,
        title: existing.title,
        address: existing.location.address,
        userId: existing.userId,
        matchType: 'contact_info',
        confidence: 85,
        reason: `Same email address: ${existingEmail}`
      };
    }

    // Check phone match
    if (newPhone && existingPhone && newPhone === existingPhone) {
      return {
        listingId: existing.id,
        title: existing.title,
        address: existing.location.address,
        userId: existing.userId,
        matchType: 'contact_info',
        confidence: 80,
        reason: `Same phone number: ${existingPhone}`
      };
    }

    return null;
  }

  /**
   * Check for fuzzy location match (very close coordinates + similar names)
   */
  private checkFuzzyLocationMatch(
    newListing: CreateListingRequest,
    existing: any
  ): DuplicateMatch | null {
    const distance = this.calculateDistance(
      newListing.location.latitude,
      newListing.location.longitude,
      existing.location.latitude,
      existing.location.longitude
    );

    // If within 50 meters
    if (distance <= 0.05) { // 0.05 km = 50 meters
      const titleSimilarity = this.calculateStringSimilarity(
        this.normalizeText(newListing.title),
        this.normalizeText(existing.title)
      );

      // Lower threshold for very close locations
      if (titleSimilarity >= 0.5) { // 50% similarity
        const confidence = Math.min(75, Math.round(titleSimilarity * 80));
        return {
          listingId: existing.id,
          title: existing.title,
          address: existing.location.address,
          userId: existing.userId,
          matchType: 'fuzzy_location',
          confidence,
          reason: `Similar listing "${existing.title}" within ${Math.round(distance * 1000)}m`
        };
      }
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Normalize address for comparison
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .replace(/str\.|street|strasse|straße/g, 'str')
      .replace(/\d+[a-z]?/g, match => match.replace(/[a-z]/g, '')) // Remove letter suffixes from numbers
      .trim();
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone?: string): string | null {
    if (!phone) return null;
    
    return phone
      .replace(/\D/g, '') // Remove all non-digits
      .replace(/^49/, '') // Remove German country code
      .replace(/^0/, ''); // Remove leading zero
  }
}
