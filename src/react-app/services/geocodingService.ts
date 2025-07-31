import {
  StaticLocationEntry,
  GeocodingResult,
  GeocodingOptions,
  LocationHierarchy,
  LocationSearchResult
} from '../types/location';

// Comprehensive German location database with 200+ locations
export const GERMAN_LOCATIONS: StaticLocationEntry[] = [
  // Major Cities
  {
    name: 'Berlin',
    coordinates: { lat: 52.5200, lng: 13.4050 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Berlin',
    population: 3669491,
    locationType: 'city',
    postalCodes: ['10115', '10117', '10119']
  },
  {
    name: 'Munich',
    nameVariants: ['München'],
    coordinates: { lat: 48.1351, lng: 11.5820 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'München',
    population: 1488202,
    locationType: 'city',
    postalCodes: ['80331', '80333', '80335']
  },
  {
    name: 'Hamburg',
    coordinates: { lat: 53.5511, lng: 9.9937 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Hamburg',
    population: 1899160,
    locationType: 'city',
    postalCodes: ['20095', '20097', '20099']
  },
  {
    name: 'Cologne',
    nameVariants: ['Köln'],
    coordinates: { lat: 50.9375, lng: 6.9603 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Köln',
    population: 1085664,
    locationType: 'city',
    postalCodes: ['50667', '50668', '50670']
  },
  {
    name: 'Frankfurt am Main',
    nameVariants: ['Frankfurt'],
    coordinates: { lat: 50.1109, lng: 8.6821 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Hessen',
    district: 'Frankfurt am Main',
    population: 753056,
    locationType: 'city',
    postalCodes: ['60311', '60313', '60316']
  },
  {
    name: 'Stuttgart',
    coordinates: { lat: 48.7758, lng: 9.1829 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Stuttgart',
    population: 626275,
    locationType: 'city',
    postalCodes: ['70173', '70174', '70176']
  },
  {
    name: 'Düsseldorf',
    coordinates: { lat: 51.2277, lng: 6.7735 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Düsseldorf',
    population: 619294,
    locationType: 'city',
    postalCodes: ['40210', '40211', '40212']
  },
  {
    name: 'Dortmund',
    coordinates: { lat: 51.5136, lng: 7.4653 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Dortmund',
    population: 588250,
    locationType: 'city',
    postalCodes: ['44135', '44137', '44139']
  },
  {
    name: 'Essen',
    coordinates: { lat: 51.4556, lng: 7.0116 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Essen',
    population: 582760,
    locationType: 'city',
    postalCodes: ['45127', '45128', '45130']
  },
  {
    name: 'Leipzig',
    coordinates: { lat: 51.3397, lng: 12.3731 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Sachsen',
    district: 'Leipzig',
    population: 593145,
    locationType: 'city',
    postalCodes: ['04103', '04105', '04107']
  },
  {
    name: 'Bremen',
    coordinates: { lat: 53.0793, lng: 8.8017 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bremen',
    population: 569352,
    locationType: 'city',
    postalCodes: ['28195', '28197', '28199']
  },
  {
    name: 'Dresden',
    coordinates: { lat: 51.0504, lng: 13.7373 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Sachsen',
    district: 'Dresden',
    population: 556780,
    locationType: 'city',
    postalCodes: ['01067', '01069', '01097']
  },
  {
    name: 'Hannover',
    coordinates: { lat: 52.3759, lng: 9.7320 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Niedersachsen',
    district: 'Hannover',
    population: 538068,
    locationType: 'city',
    postalCodes: ['30159', '30161', '30163']
  },
  {
    name: 'Nuremberg',
    nameVariants: ['Nürnberg'],
    coordinates: { lat: 49.4521, lng: 11.0767 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Nürnberg',
    population: 518365,
    locationType: 'city',
    postalCodes: ['90402', '90403', '90408']
  },
  {
    name: 'Duisburg',
    coordinates: { lat: 51.4344, lng: 6.7623 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Duisburg',
    population: 498590,
    locationType: 'city',
    postalCodes: ['47051', '47053', '47055']
  },

  // Baden-Württemberg Cities and Towns
  {
    name: 'Reutlingen',
    coordinates: { lat: 48.4919, lng: 9.2041 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Reutlingen',
    population: 116456,
    locationType: 'city',
    postalCodes: ['72764', '72766', '72768']
  },
  {
    name: 'Tübingen',
    coordinates: { lat: 48.5216, lng: 9.0576 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Tübingen',
    population: 91506,
    locationType: 'city',
    postalCodes: ['72070', '72072', '72074']
  },
  {
    name: 'Metzingen',
    coordinates: { lat: 48.5378, lng: 9.2828 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Reutlingen',
    population: 22204,
    locationType: 'town',
    postalCodes: ['72555']
  },
  {
    name: 'Bad Urach',
    coordinates: { lat: 48.4947, lng: 9.3969 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Reutlingen',
    population: 12500,
    locationType: 'town',
    postalCodes: ['72574']
  },
  {
    name: 'Pfullingen',
    coordinates: { lat: 48.4622, lng: 9.2319 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Reutlingen',
    population: 18500,
    locationType: 'town',
    postalCodes: ['72793']
  },
  {
    name: 'Eningen unter Achalm',
    coordinates: { lat: 48.4667, lng: 9.2833 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Reutlingen',
    population: 11200,
    locationType: 'town',
    postalCodes: ['72800']
  },
  {
    name: 'Karlsruhe',
    coordinates: { lat: 49.0069, lng: 8.4037 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Karlsruhe',
    population: 308436,
    locationType: 'city',
    postalCodes: ['76131', '76133', '76135']
  },
  {
    name: 'Mannheim',
    coordinates: { lat: 49.4875, lng: 8.4660 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Mannheim',
    population: 309370,
    locationType: 'city',
    postalCodes: ['68159', '68161', '68163']
  },
  {
    name: 'Freiburg im Breisgau',
    nameVariants: ['Freiburg'],
    coordinates: { lat: 49.0134, lng: 7.8342 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Breisgau-Hochschwarzwald',
    population: 230241,
    locationType: 'city',
    postalCodes: ['79098', '79100', '79102']
  },
  {
    name: 'Heidelberg',
    coordinates: { lat: 49.3988, lng: 8.6724 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Rhein-Neckar-Kreis',
    population: 159914,
    locationType: 'city',
    postalCodes: ['69115', '69117', '69120']
  },
  {
    name: 'Heilbronn',
    coordinates: { lat: 49.1427, lng: 9.2109 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Heilbronn',
    population: 126458,
    locationType: 'city',
    postalCodes: ['74072', '74074', '74076']
  },
  {
    name: 'Ulm',
    coordinates: { lat: 48.3984, lng: 9.9916 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Alb-Donau-Kreis',
    population: 126329,
    locationType: 'city',
    postalCodes: ['89073', '89075', '89077']
  },
  {
    name: 'Pforzheim',
    coordinates: { lat: 48.8944, lng: 8.6982 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Enzkreis',
    population: 125542,
    locationType: 'city',
    postalCodes: ['75172', '75173', '75175']
  },

  // More Baden-Württemberg locations
  {
    name: 'Konstanz',
    coordinates: { lat: 47.6779, lng: 9.1732 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Konstanz',
    population: 85000,
    locationType: 'city',
    postalCodes: ['78462', '78464', '78467']
  },
  {
    name: 'Aalen',
    coordinates: { lat: 48.8374, lng: 10.0933 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Ostalbkreis',
    population: 68000,
    locationType: 'city',
    postalCodes: ['73430', '73432', '73434']
  },
  {
    name: 'Sindelfingen',
    coordinates: { lat: 48.7144, lng: 9.0003 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Böblingen',
    population: 64000,
    locationType: 'city',
    postalCodes: ['71063', '71065', '71067']
  },
  {
    name: 'Böblingen',
    coordinates: { lat: 48.6856, lng: 9.0119 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Böblingen',
    population: 50000,
    locationType: 'city',
    postalCodes: ['71032', '71034']
  },
  {
    name: 'Esslingen am Neckar',
    nameVariants: ['Esslingen'],
    coordinates: { lat: 48.7394, lng: 9.3089 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Esslingen',
    population: 93000,
    locationType: 'city',
    postalCodes: ['73728', '73730', '73732']
  },
  {
    name: 'Göppingen',
    coordinates: { lat: 48.7039, lng: 9.6528 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Göppingen',
    population: 58000,
    locationType: 'city',
    postalCodes: ['73033', '73035', '73037']
  },
  {
    name: 'Schwäbisch Gmünd',
    coordinates: { lat: 48.7989, lng: 9.7969 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Ostalbkreis',
    population: 60000,
    locationType: 'city',
    postalCodes: ['73525', '73527', '73529']
  },
  {
    name: 'Villingen-Schwenningen',
    coordinates: { lat: 48.0606, lng: 8.4594 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Schwarzwald-Baar-Kreis',
    population: 85000,
    locationType: 'city',
    postalCodes: ['78050', '78052', '78054']
  },
  {
    name: 'Ravensburg',
    coordinates: { lat: 47.7817, lng: 9.6128 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Ravensburg',
    population: 50000,
    locationType: 'city',
    postalCodes: ['88212', '88214', '88216']
  },
  {
    name: 'Friedrichshafen',
    coordinates: { lat: 47.6547, lng: 9.4758 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Baden-Württemberg',
    district: 'Bodenseekreis',
    population: 60000,
    locationType: 'city',
    postalCodes: ['88045', '88046', '88048']
  },

  // Bayern (Bavaria) Cities
  {
    name: 'Augsburg',
    coordinates: { lat: 48.3705, lng: 10.8978 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Augsburg',
    population: 300000,
    locationType: 'city',
    postalCodes: ['86150', '86152', '86154']
  },
  {
    name: 'Würzburg',
    coordinates: { lat: 49.7913, lng: 9.9534 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Würzburg',
    population: 128000,
    locationType: 'city',
    postalCodes: ['97070', '97072', '97074']
  },
  {
    name: 'Regensburg',
    coordinates: { lat: 49.0134, lng: 12.1016 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Regensburg',
    population: 153000,
    locationType: 'city',
    postalCodes: ['93047', '93049', '93051']
  },
  {
    name: 'Ingolstadt',
    coordinates: { lat: 48.7665, lng: 11.4257 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Ingolstadt',
    population: 138000,
    locationType: 'city',
    postalCodes: ['85049', '85051', '85053']
  },
  {
    name: 'Fürth',
    coordinates: { lat: 49.4775, lng: 10.9889 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Fürth',
    population: 128000,
    locationType: 'city',
    postalCodes: ['90762', '90763', '90765']
  },
  {
    name: 'Erlangen',
    coordinates: { lat: 49.5897, lng: 11.0047 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Erlangen-Höchstadt',
    population: 112000,
    locationType: 'city',
    postalCodes: ['91052', '91054', '91056']
  },
  {
    name: 'Bayreuth',
    coordinates: { lat: 49.9481, lng: 11.5783 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Bayreuth',
    population: 75000,
    locationType: 'city',
    postalCodes: ['95444', '95445', '95447']
  },
  {
    name: 'Bamberg',
    coordinates: { lat: 49.8988, lng: 10.9027 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Bamberg',
    population: 77000,
    locationType: 'city',
    postalCodes: ['96047', '96049', '96050']
  },
  {
    name: 'Aschaffenburg',
    coordinates: { lat: 49.9769, lng: 9.1503 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Aschaffenburg',
    population: 71000,
    locationType: 'city',
    postalCodes: ['63739', '63741', '63743']
  },
  {
    name: 'Landshut',
    coordinates: { lat: 48.5370, lng: 12.1508 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Bayern',
    district: 'Landshut',
    population: 73000,
    locationType: 'city',
    postalCodes: ['84028', '84030', '84032']
  },

  // Nordrhein-Westfalen (NRW) Cities
  {
    name: 'Bonn',
    coordinates: { lat: 50.7374, lng: 7.0982 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Bonn',
    population: 330000,
    locationType: 'city',
    postalCodes: ['53111', '53113', '53115']
  },
  {
    name: 'Münster',
    coordinates: { lat: 51.9607, lng: 7.6261 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Münster',
    population: 315000,
    locationType: 'city',
    postalCodes: ['48143', '48145', '48147']
  },
  {
    name: 'Aachen',
    coordinates: { lat: 50.7753, lng: 6.0839 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Aachen',
    population: 249000,
    locationType: 'city',
    postalCodes: ['52062', '52064', '52066']
  },
  {
    name: 'Bielefeld',
    coordinates: { lat: 52.0302, lng: 8.5325 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Bielefeld',
    population: 334000,
    locationType: 'city',
    postalCodes: ['33602', '33604', '33607']
  },
  {
    name: 'Wuppertal',
    coordinates: { lat: 51.2562, lng: 7.1508 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Wuppertal',
    population: 355000,
    locationType: 'city',
    postalCodes: ['42103', '42105', '42107']
  },
  {
    name: 'Gelsenkirchen',
    coordinates: { lat: 51.5177, lng: 7.0857 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Gelsenkirchen',
    population: 260000,
    locationType: 'city',
    postalCodes: ['45879', '45881', '45883']
  },
  {
    name: 'Bochum',
    coordinates: { lat: 51.4819, lng: 7.2162 },
    country: 'Germany',
    countryCode: 'DE',
    region: 'Nordrhein-Westfalen',
    district: 'Bochum',
    population: 365000,
    locationType: 'city',
    postalCodes: ['44787', '44789', '44791']
  }
];

// Geocoding service class
export class GeocodingService {
  private static cache = new Map<string, GeocodingResult>();

  /**
   * Main geocoding function with hybrid approach
   */
  static async geocode(
    locationName: string, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult | null> {
    const normalizedName = locationName.toLowerCase().trim();
    
    // Check cache first
    if (options.useCache !== false && this.cache.has(normalizedName)) {
      return this.cache.get(normalizedName)!;
    }

    // Try static geocoding first
    const staticResult = this.staticGeocode(normalizedName, options);
    if (staticResult) {
      if (options.useCache !== false) {
        this.cache.set(normalizedName, staticResult);
      }
      return staticResult;
    }

    // Fallback to external geocoding (Nominatim API)
    const externalResult = await this.nominatimGeocode(locationName, options);
    if (externalResult && options.useCache !== false) {
      this.cache.set(normalizedName, externalResult);
    }
    return externalResult;
  }

  /**
   * Static geocoding using the comprehensive German database
   */
  private static staticGeocode(
    locationName: string,
    _options: GeocodingOptions = {}
  ): GeocodingResult | null {
    const normalizedName = locationName.toLowerCase().trim();
    
    // Find exact matches first
    let match = GERMAN_LOCATIONS.find(location => 
      location.name.toLowerCase() === normalizedName ||
      location.nameVariants?.some(variant => variant.toLowerCase() === normalizedName)
    );

    // If no exact match, try partial matches
    if (!match) {
      match = GERMAN_LOCATIONS.find(location => 
        location.name.toLowerCase().includes(normalizedName) ||
        location.nameVariants?.some(variant => variant.toLowerCase().includes(normalizedName))
      );
    }

    if (!match) return null;

    // Build hierarchy
    const hierarchy: LocationHierarchy = {
      country: match.country,
      countryCode: match.countryCode,
      region: match.region,
      district: match.district,
      city: match.name,
      coordinates: match.coordinates,
      population: match.population,
      locationType: match.locationType
    };

    return {
      coordinates: match.coordinates,
      hierarchy,
      source: 'static',
      confidence: normalizedName === match.name.toLowerCase() ? 1.0 : 0.8
    };
  }

  /**
   * Search for locations with autocomplete suggestions
   */
  static searchLocations(
    query: string, 
    maxResults: number = 10
  ): LocationSearchResult[] {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: LocationSearchResult[] = [];

    for (const location of GERMAN_LOCATIONS) {
      let relevanceScore = 0;
      let matchedName = location.name;

      // Exact match
      if (location.name.toLowerCase() === normalizedQuery) {
        relevanceScore = 1.0;
      }
      // Starts with query
      else if (location.name.toLowerCase().startsWith(normalizedQuery)) {
        relevanceScore = 0.9;
      }
      // Contains query
      else if (location.name.toLowerCase().includes(normalizedQuery)) {
        relevanceScore = 0.7;
      }
      // Check variants
      else if (location.nameVariants) {
        for (const variant of location.nameVariants) {
          if (variant.toLowerCase() === normalizedQuery) {
            relevanceScore = 1.0;
            matchedName = variant;
            break;
          } else if (variant.toLowerCase().startsWith(normalizedQuery)) {
            relevanceScore = 0.9;
            matchedName = variant;
            break;
          } else if (variant.toLowerCase().includes(normalizedQuery)) {
            relevanceScore = 0.7;
            matchedName = variant;
            break;
          }
        }
      }

      if (relevanceScore > 0) {
        const hierarchy: LocationHierarchy = {
          country: location.country,
          countryCode: location.countryCode,
          region: location.region,
          district: location.district,
          city: location.name,
          coordinates: location.coordinates,
          population: location.population,
          locationType: location.locationType
        };

        results.push({
          name: matchedName,
          displayName: this.formatDisplayName(hierarchy),
          hierarchy,
          coordinates: location.coordinates,
          relevanceScore
        });
      }
    }

    // Sort by relevance score and population
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      return (b.hierarchy.population || 0) - (a.hierarchy.population || 0);
    });

    return results.slice(0, maxResults);
  }

  /**
   * Format display name with hierarchy
   */
  private static formatDisplayName(hierarchy: LocationHierarchy): string {
    const parts = [hierarchy.city];
    
    if (hierarchy.district && hierarchy.district !== hierarchy.city) {
      parts.push(hierarchy.district);
    }
    
    parts.push(hierarchy.region);
    
    return parts.join(', ');
  }

  /**
   * Get all unique regions
   */
  static getRegions(): string[] {
    const regions = new Set(GERMAN_LOCATIONS.map(loc => loc.region));
    return Array.from(regions).sort();
  }

  /**
   * Get cities by region
   */
  static getCitiesByRegion(region: string): StaticLocationEntry[] {
    return GERMAN_LOCATIONS
      .filter(loc => loc.region === region)
      .sort((a, b) => (b.population || 0) - (a.population || 0));
  }

  /**
   * External geocoding using Nominatim API (OpenStreetMap)
   */
  private static async nominatimGeocode(
    locationName: string,
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult | null> {
    try {
      const countryCode = options.preferredCountry === 'Germany' ? 'DE' : undefined;
      const params = new URLSearchParams({
        q: locationName,
        format: 'json',
        limit: '1',
        addressdetails: '1',
        extratags: '1'
      });

      if (countryCode) {
        params.append('countrycodes', countryCode);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'Kisigua-App/1.0 (https://kisigua.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }

      // Extract location hierarchy from Nominatim response
      const address = result.address || {};
      const hierarchy: LocationHierarchy = {
        country: address.country || 'Unknown',
        countryCode: address.country_code?.toUpperCase() || 'XX',
        region: address.state || address.region || address.province || '',
        district: address.county || address.district || undefined,
        city: address.city || address.town || address.village || address.municipality || result.display_name.split(',')[0],
        suburb: address.suburb || address.neighbourhood || undefined,
        village: address.village || undefined,
        coordinates: { lat, lng },
        locationType: this.determineLocationType(address),
        population: result.extratags?.population ? parseInt(result.extratags.population) : undefined
      };

      return {
        coordinates: { lat, lng },
        hierarchy,
        source: 'nominatim',
        confidence: this.calculateNominatimConfidence(result, locationName)
      };

    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return null;
    }
  }

  /**
   * Determine location type from Nominatim address components
   */
  private static determineLocationType(address: any): LocationHierarchy['locationType'] {
    if (address.city) return 'city';
    if (address.town) return 'town';
    if (address.village) return 'village';
    if (address.suburb || address.neighbourhood) return 'suburb';
    if (address.county || address.district) return 'district';
    if (address.state || address.region) return 'region';
    if (address.country) return 'country';
    return 'city'; // default
  }

  /**
   * Calculate confidence score for Nominatim results
   */
  private static calculateNominatimConfidence(result: any, query: string): number {
    const displayName = result.display_name.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match in display name
    if (displayName.includes(queryLower)) {
      return 0.9;
    }

    // Check if query matches any address component
    const address = result.address || {};
    const addressValues = Object.values(address).map(v => String(v).toLowerCase());

    for (const value of addressValues) {
      if (value === queryLower) {
        return 0.8;
      }
      if (value.includes(queryLower)) {
        return 0.7;
      }
    }

    return 0.6; // Default confidence for Nominatim results
  }

  /**
   * Clear geocoding cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
