import {
  POI,
  POICategory,
  POISearchOptions,
  POISearchResult,
  OverpassResponse,
  OverpassElement,
  POIError,
  POINetworkError,
  POIParseError,
  POIRateLimitError,
  POICacheEntry
} from '../../types/poi';

// Indonesian POI Categories optimized for Indonesian locations
export const INDONESIAN_POI_CATEGORIES: POICategory[] = [
  {
    id: 'all',
    name: 'Semua',
    nameEn: 'All',
    icon: 'explore',
    overpassQuery: '',
    color: '#6C7B7F',
    priority: 0
  },
  {
    id: 'restaurant',
    name: 'Rumah Makan',
    nameEn: 'Restaurant',
    icon: 'restaurant-menu',
    overpassQuery: 'amenity~"^(restaurant|food_court|fast_food)$"',
    color: '#FF6B6B',
    priority: 1
  },
  {
    id: 'school',
    name: 'Sekolah',
    nameEn: 'School',
    icon: 'school',
    overpassQuery: 'amenity~"^(school|university|college)$"',
    color: '#4ECDC4',
    priority: 2
  },
  {
    id: 'hospital',
    name: 'Rumah Sakit',
    nameEn: 'Hospital',
    icon: 'local-hospital',
    overpassQuery: 'amenity~"^(hospital|clinic|pharmacy)$"',
    color: '#FF4757',
    priority: 3
  },
  {
    id: 'mosque',
    name: 'Masjid',
    nameEn: 'Mosque',
    icon: 'place',
    overpassQuery: 'amenity="place_of_worship"][religion="muslim"',
    color: '#2ECC71',
    priority: 4
  },
  {
    id: 'atm',
    name: 'ATM',
    nameEn: 'ATM',
    icon: 'payment',
    overpassQuery: 'amenity="atm"',
    color: '#3498DB',
    priority: 5
  },
  {
    id: 'gas_station',
    name: 'SPBU',
    nameEn: 'Gas Station',
    icon: 'local-gas-station',
    overpassQuery: 'amenity="fuel"',
    color: '#E74C3C',
    priority: 6
  },
  {
    id: 'shopping',
    name: 'Belanja',
    nameEn: 'Shopping',
    icon: 'shopping-bag',
    overpassQuery: 'shop~"^(supermarket|mall|convenience|department_store)$"',
    color: '#9B59B6',
    priority: 7
  },
  {
    id: 'bank',
    name: 'Bank',
    nameEn: 'Bank',
    icon: 'account-balance',
    overpassQuery: 'amenity="bank"',
    color: '#F39C12',
    priority: 8
  }
];

class POIService {
  private readonly OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly GRID_SIZE = 500; // 500 meters per grid cell
  private readonly DEFAULT_RADIUS = 1000; // 1km
  private readonly DEFAULT_LIMIT = 20;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  private cache = new Map<string, POICacheEntry>();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  /**
   * Get nearby POIs using Overpass API with Indonesian location optimization
   */
  async getNearbyPOIs(
    latitude: number,
    longitude: number,
    options: POISearchOptions = {}
  ): Promise<POISearchResult> {
    const {
      radius = this.DEFAULT_RADIUS,
      categories = ['all'],
      limit = this.DEFAULT_LIMIT,
      includeDistance = true
    } = options;

    try {
      // Check cache first
      const gridId = this.getGridId(latitude, longitude, radius);
      const cacheKey = `${gridId}-${categories.sort().join(',')}-${radius}`;
      const cached = this.getCachedPOIs(cacheKey);

      if (cached) {
        return this.formatSearchResult(cached.pois, latitude, longitude, radius, categories, 'cached');
      }

      // Rate limiting
      await this.enforceRateLimit();

      // Build Overpass query for selected categories
      const query = this.buildOverpassQuery(latitude, longitude, radius, categories);

      // Fetch from Overpass API
      const response = await this.fetchFromOverpass(query);
      const pois = this.parseOverpassResponse(response, categories);

      // Calculate distances if requested
      if (includeDistance) {
        pois.forEach(poi => {
          const distance = this.calculateDistance(latitude, longitude, poi.latitude, poi.longitude);
          poi.distance = this.formatDistance(distance);
          poi.distanceValue = distance;
        });

        // Sort by distance
        pois.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
      }

      // Limit results
      const limitedPois = pois.slice(0, limit);

      // Cache the results
      this.cachePOIs(cacheKey, limitedPois, categories);

      return this.formatSearchResult(limitedPois, latitude, longitude, radius, categories, 'overpass');

    } catch (error) {
      // Fallback to cached data if available, even if expired
      const gridId = this.getGridId(latitude, longitude, radius);
      const cacheKey = `${gridId}-${categories.sort().join(',')}-${radius}`;
      const fallbackCached = this.cache.get(cacheKey);

      if (fallbackCached) {
        return this.formatSearchResult(fallbackCached.pois, latitude, longitude, radius, categories, 'cached');
      }

      // If no cache available, throw the error
      if (error instanceof POIError) {
        throw error;
      }

      throw new POIError(
        `Failed to fetch POIs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Search for specific POIs by name
   */
  async searchPOIs(
    query: string,
    latitude: number,
    longitude: number,
    radius: number = 2000
  ): Promise<POI[]> {
    try {
      await this.enforceRateLimit();

      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["name"~"${this.escapeOverpassString(query)}",i](around:${radius},${latitude},${longitude});
          way["name"~"${this.escapeOverpassString(query)}",i](around:${radius},${latitude},${longitude});
        );
        out center;
      `;

      const response = await this.fetchFromOverpass(overpassQuery);
      const pois = this.parseOverpassResponse(response, ['all']);

      // Calculate distances and sort
      pois.forEach(poi => {
        const distance = this.calculateDistance(latitude, longitude, poi.latitude, poi.longitude);
        poi.distance = this.formatDistance(distance);
        poi.distanceValue = distance;
      });

      return pois.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));

    } catch (error) {
      throw new POIError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_ERROR'
      );
    }
  }

  /**
   * Get POI categories
   */
  getCategories(): POICategory[] {
    return INDONESIAN_POI_CATEGORIES;
  }

  /**
   * Get category by ID
   */
  getCategoryById(categoryId: string): POICategory | undefined {
    return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === categoryId);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  // Private methods

  private buildOverpassQuery(latitude: number, longitude: number, radius: number, categories: string[]): string {
    const activeCategories = categories.includes('all')
      ? INDONESIAN_POI_CATEGORIES.filter(cat => cat.id !== 'all')
      : INDONESIAN_POI_CATEGORIES.filter(cat => categories.includes(cat.id));

    if (activeCategories.length === 0) {
      activeCategories.push(...INDONESIAN_POI_CATEGORIES.filter(cat => cat.id !== 'all'));
    }

    // Build query parts with proper syntax
    const queryParts: string[] = [];

    activeCategories.forEach(category => {
      switch (category.id) {
        case 'restaurant':
          queryParts.push(`  node["amenity"="restaurant"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="restaurant"](around:${radius},${latitude},${longitude});`);
          break;
        case 'school':
          queryParts.push(`  node["amenity"="school"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="school"](around:${radius},${latitude},${longitude});`);
          break;
        case 'hospital':
          queryParts.push(`  node["amenity"="hospital"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="hospital"](around:${radius},${latitude},${longitude});`);
          break;
        case 'mosque':
          queryParts.push(`  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});`);
          break;
        case 'atm':
          queryParts.push(`  node["amenity"="atm"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="atm"](around:${radius},${latitude},${longitude});`);
          break;
        case 'gas_station':
          queryParts.push(`  node["amenity"="fuel"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="fuel"](around:${radius},${latitude},${longitude});`);
          break;
        case 'shopping':
          queryParts.push(`  node["shop"="supermarket"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["shop"="supermarket"](around:${radius},${latitude},${longitude});`);
          break;
        case 'bank':
          queryParts.push(`  node["amenity"="bank"](around:${radius},${latitude},${longitude});`);
          queryParts.push(`  way["amenity"="bank"](around:${radius},${latitude},${longitude});`);
          break;
      }
    });

    const finalQuery = `[out:json][timeout:15];
(
${queryParts.join('\n')}
);
out center;`;

    console.log('Generated Overpass query:', finalQuery);
    return finalQuery;
  }

  private async fetchFromOverpass(query: string): Promise<OverpassResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(this.OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Overpass API error:', response.status, response.statusText, errorText);
        console.error('Query that failed:', query);

        if (response.status === 429) {
          throw new POIRateLimitError('Rate limit exceeded. Please try again later.');
        }
        throw new POINetworkError(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data as OverpassResponse;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof POIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new POINetworkError('Request timeout');
      }

      throw new POINetworkError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseOverpassResponse(response: OverpassResponse, requestedCategories: string[]): POI[] {
    if (!response.elements || !Array.isArray(response.elements)) {
      return [];
    }

    const pois: POI[] = [];

    response.elements.forEach((element: OverpassElement) => {
      try {
        const poi = this.elementToPOI(element, requestedCategories);
        if (poi) {
          pois.push(poi);
        }
      } catch (error) {
        // Skip invalid elements
      }
    });

    return pois;
  }

  private elementToPOI(element: OverpassElement, requestedCategories: string[]): POI | null {
    // Get coordinates
    let lat: number, lon: number;

    if (element.type === 'node' && element.lat && element.lon) {
      lat = element.lat;
      lon = element.lon;
    } else if (element.center) {
      lat = element.center.lat;
      lon = element.center.lon;
    } else {
      return null;
    }

    // Determine category
    const category = this.determineCategory(element.tags);
    if (!category) return null;

    // Check if category is in requested categories
    if (!requestedCategories.includes('all') && !requestedCategories.includes(category.id)) {
      return null;
    }

    // Get name (prefer Indonesian name)
    const name = element.tags.name ||
                 element.tags['name:id'] ||
                 element.tags['name:ms'] ||
                 element.tags.brand ||
                 element.tags.operator ||
                 `${category.name} di ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    // Build address from available tags
    const addressParts = [];
    if (element.tags['addr:street']) addressParts.push(element.tags['addr:street']);
    if (element.tags['addr:housenumber']) addressParts.push(`No. ${element.tags['addr:housenumber']}`);
    if (element.tags['addr:suburb']) addressParts.push(element.tags['addr:suburb']);
    if (element.tags['addr:city']) addressParts.push(element.tags['addr:city']);
    if (element.tags['addr:state']) addressParts.push(element.tags['addr:state']);

    const address = addressParts.length > 0
      ? addressParts.join(', ')
      : `${category.name}, ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    return {
      id: `${element.type}-${element.id}`,
      name,
      category,
      latitude: lat,
      longitude: lon,
      address,
      tags: element.tags,
      source: 'overpass',
      lastUpdated: new Date()
    };
  }

  private determineCategory(tags: { [key: string]: string }): POICategory | null {
    // Direct category matching based on tags
    const amenity = tags.amenity;
    const shop = tags.shop;
    const religion = tags.religion;

    // Restaurant/Food
    if (amenity && ['restaurant', 'food_court', 'fast_food', 'cafe'].includes(amenity)) {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'restaurant') || null;
    }

    // School/Education
    if (amenity && ['school', 'university', 'college', 'kindergarten'].includes(amenity)) {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'school') || null;
    }

    // Hospital/Healthcare
    if (amenity && ['hospital', 'clinic', 'pharmacy', 'doctors'].includes(amenity)) {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'hospital') || null;
    }

    // Mosque/Place of worship
    if (amenity === 'place_of_worship' && religion === 'muslim') {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'mosque') || null;
    }

    // ATM
    if (amenity === 'atm') {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'atm') || null;
    }

    // Gas Station
    if (amenity === 'fuel') {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'gas_station') || null;
    }

    // Shopping
    if (shop && ['supermarket', 'mall', 'convenience', 'department_store'].includes(shop)) {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'shopping') || null;
    }

    // Bank
    if (amenity === 'bank') {
      return INDONESIAN_POI_CATEGORIES.find(cat => cat.id === 'bank') || null;
    }

    return null;
  }


  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  private getGridId(latitude: number, longitude: number, radius: number): string {
    const gridLat = Math.floor(latitude * 1000 / this.GRID_SIZE);
    const gridLon = Math.floor(longitude * 1000 / this.GRID_SIZE);
    return `${gridLat}-${gridLon}-${Math.ceil(radius / this.GRID_SIZE)}`;
  }

  private getCachedPOIs(cacheKey: string): POICacheEntry | null {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    return null;
  }

  private cachePOIs(cacheKey: string, pois: POI[], categories: string[]): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);

    this.cache.set(cacheKey, {
      gridId: cacheKey,
      pois,
      categories,
      timestamp: now,
      expiresAt
    });
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private escapeOverpassString(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private formatSearchResult(
    pois: POI[],
    latitude: number,
    longitude: number,
    radius: number,
    categories: string[],
    source: 'overpass' | 'cached'
  ): POISearchResult {
    return {
      pois,
      totalFound: pois.length,
      searchRadius: radius,
      searchCenter: { latitude, longitude },
      categories,
      source,
      timestamp: new Date()
    };
  }
}

// Export singleton instance
export const poiService = new POIService();
export default poiService;