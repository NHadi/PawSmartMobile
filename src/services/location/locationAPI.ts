import {
  Province,
  City,
  District,
  Village,
  PostalCodeResponse,
  PostalCodeResult,
  LocationAPIError,
  APIResponse
} from '../../types/location';
import { locationCache } from './locationCache';
import { indonesiaData } from '../../data/indonesiaData';

class LocationAPIService {
  private readonly BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia';
  private readonly POSTAL_CODE_URL = 'https://kodepos.vercel.app';
  private readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Generic fetch with timeout and error handling
   */
  private async fetchWithTimeout(url: string, timeout = this.TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(LocationAPIError.TIMEOUT_ERROR);
      }

      if (!navigator.onLine) {
        throw new Error(LocationAPIError.NETWORK_ERROR);
      }

      throw error;
    }
  }

  /**
   * Get all provinces
   */
  async getProvinces(): Promise<APIResponse<Province[]>> {
    try {
      // Check cache first
      const cached = await locationCache.get('provinces');
      if (cached) {
        return { data: cached, loading: false };
      }

      const response = await this.fetchWithTimeout(`${this.BASE_URL}/api/provinces.json`);
      const provinces: Province[] = await response.json();

      // Cache the result
      await locationCache.set('provinces', provinces);

      return { data: provinces, loading: false };
    } catch (error: any) {
      console.warn('Failed to fetch provinces from API, using fallback:', error.message);

      // Fallback to static data
      const fallbackProvinces: Province[] = indonesiaData.provinces.map((name, index) => ({
        id: (index + 1).toString(),
        name
      }));

      return {
        data: fallbackProvinces,
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Get cities by province ID
   */
  async getCities(provinceId: string): Promise<APIResponse<City[]>> {
    try {
      // Check cache first
      const cached = await locationCache.get('cities', provinceId);
      if (cached) {
        return { data: cached, loading: false };
      }

      const response = await this.fetchWithTimeout(`${this.BASE_URL}/api/regencies/${provinceId}.json`);
      const cities: City[] = await response.json();

      // Cache the result
      await locationCache.set('cities', cities, provinceId);

      return { data: cities, loading: false };
    } catch (error: any) {
      console.warn(`Failed to fetch cities for province ${provinceId}:`, error.message);

      // Try fallback to static data
      const provinces = await this.getProvinces();
      const province = provinces.data.find(p => p.id === provinceId);

      if (province) {
        const fallbackCities = indonesiaData.getCities(province.name).map((name, index) => ({
          id: `${provinceId}${(index + 1).toString().padStart(2, '0')}`,
          province_id: provinceId,
          name
        }));

        return {
          data: fallbackCities,
          loading: false,
          error: error.message
        };
      }

      return {
        data: [],
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Get districts by city ID
   */
  async getDistricts(cityId: string): Promise<APIResponse<District[]>> {
    try {
      // Check cache first
      const cached = await locationCache.get('districts', cityId);
      if (cached) {
        return { data: cached, loading: false };
      }

      const response = await this.fetchWithTimeout(`${this.BASE_URL}/api/districts/${cityId}.json`);
      const districts: District[] = await response.json();

      // Cache the result
      await locationCache.set('districts', districts, cityId);

      return { data: districts, loading: false };
    } catch (error: any) {
      console.warn(`Failed to fetch districts for city ${cityId}:`, error.message);

      // Try fallback to static data - this will often be empty due to incomplete data
      const fallbackDistricts: District[] = []; // Most cities don't have district data in static

      return {
        data: fallbackDistricts,
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Get villages by district ID (optional - for future use)
   */
  async getVillages(districtId: string): Promise<APIResponse<Village[]>> {
    try {
      const cached = await locationCache.get('villages', districtId);
      if (cached) {
        return { data: cached, loading: false };
      }

      const response = await this.fetchWithTimeout(`${this.BASE_URL}/api/villages/${districtId}.json`);
      const villages: Village[] = await response.json();

      await locationCache.set('villages', villages, districtId);

      return { data: villages, loading: false };
    } catch (error: any) {
      console.warn(`Failed to fetch villages for district ${districtId}:`, error.message);
      return {
        data: [],
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Search postal codes by location name
   */
  async searchPostalCodes(query: string): Promise<APIResponse<PostalCodeResult[]>> {
    try {
      if (!query || query.length < 2) {
        return { data: [], loading: false };
      }

      // Check cache first
      const cacheKey = query.toLowerCase().trim();
      const cached = await locationCache.get('postal_codes', cacheKey);
      if (cached) {
        return { data: cached, loading: false };
      }

      // Clean and encode the query
      const cleanQuery = query.trim();
      const encodedQuery = encodeURIComponent(cleanQuery);

      console.log(`Searching postal codes for: "${cleanQuery}"`);

      const response = await this.fetchWithTimeout(`${this.POSTAL_CODE_URL}/search?q=${encodedQuery}`);
      const result: PostalCodeResponse = await response.json();

      console.log(`Postal code API response for "${cleanQuery}":`, result);

      // Cache the result (shorter expiry for postal codes)
      if (result.data && result.data.length > 0) {
        await locationCache.set('postal_codes', result.data, cacheKey);
      }

      return { data: result.data || [], loading: false };
    } catch (error: any) {
      console.warn(`Failed to search postal codes for "${query}":`, error.message);

      // Return empty result instead of mock data to let the caller handle fallbacks
      return {
        data: [],
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Get postal codes for a specific district
   */
  async getPostalCodesForDistrict(districtName: string, cityName?: string): Promise<APIResponse<string[]>> {
    try {
      // Clean and normalize the names for better API matching
      const cleanDistrictName = districtName.trim();
      const cleanCityName = cityName?.trim();

      // Try different search variations for better results
      const searchQueries = [
        cleanDistrictName, // Just district name
        cleanCityName ? `${cleanDistrictName} ${cleanCityName}` : cleanDistrictName, // District + City
        cleanCityName ? `${cleanCityName} ${cleanDistrictName}` : cleanDistrictName, // City + District
      ];

      // Add variations without "KOTA" prefix if present
      if (cleanCityName?.startsWith('KOTA ')) {
        const cityWithoutKota = cleanCityName.replace('KOTA ', '');
        searchQueries.push(
          `${cleanDistrictName} ${cityWithoutKota}`,
          `${cityWithoutKota} ${cleanDistrictName}`,
          cityWithoutKota
        );
      }

      console.log('Trying postal code searches for:', searchQueries);

      for (const query of searchQueries) {
        const postalResult = await this.searchPostalCodes(query);

        if (!postalResult.error && postalResult.data.length > 0) {
          console.log(`Found postal codes with query "${query}":`, postalResult.data);

          // Extract unique postal codes
          const postalCodes = [...new Set(postalResult.data.map(item => item.postal_code))];
          return { data: postalCodes, loading: false };
        }
      }

      // If all searches fail, return fallback codes based on city
      console.warn(`No postal codes found for ${cleanDistrictName} in ${cleanCityName}, using fallback`);
      const mockCodes = this.generateFallbackPostalCodes(cleanCityName, cleanDistrictName);
      return {
        data: mockCodes,
        loading: false,
        error: 'No postal codes found via API'
      };
    } catch (error: any) {
      console.warn(`Failed to get postal codes for district ${districtName}:`, error.message);

      // Fallback to realistic postal codes based on city
      const mockCodes = this.generateFallbackPostalCodes(cityName, districtName);
      return {
        data: mockCodes,
        loading: false,
        error: error.message
      };
    }
  }

  /**
   * Validate a postal code against location
   */
  async validatePostalCode(postalCode: string, cityName?: string): Promise<boolean> {
    try {
      const searchQuery = cityName || postalCode;
      const result = await this.searchPostalCodes(searchQuery);

      return result.data.some(item => item.postal_code === postalCode);
    } catch (error) {
      console.warn('Failed to validate postal code:', error);
      return true; // Allow if validation fails
    }
  }

  /**
   * Generate realistic fallback postal codes based on Indonesian patterns
   */
  private generateFallbackPostalCodes(cityName?: string, districtName?: string): string[] {
    // Indonesian postal code patterns by major cities
    const cityPostalPatterns: { [key: string]: string[] } = {
      // Jakarta
      'JAKARTA': ['10110', '10220', '10330', '11140', '12560'],
      'KOTA JAKARTA PUSAT': ['10110', '10120', '10130', '10140', '10150'],
      'KOTA JAKARTA BARAT': ['11220', '11240', '11350', '11470', '11530'],
      'KOTA JAKARTA UTARA': ['14110', '14210', '14240', '14340', '14450'],
      'KOTA JAKARTA SELATAN': ['12110', '12210', '12310', '12430', '12560'],
      'KOTA JAKARTA TIMUR': ['13110', '13220', '13330', '13410', '13560'],
      'KOTA JAKARTA': ['10110', '11140', '12210', '13220', '14240'],

      // Surabaya
      'SURABAYA': ['60111', '60211', '60311', '60411', '60511'],
      'KOTA SURABAYA': ['60111', '60211', '60311', '60411', '60511'],

      // Bandung
      'BANDUNG': ['40111', '40211', '40311', '40411', '40511'],
      'KOTA BANDUNG': ['40111', '40211', '40311', '40411', '40511'],

      // Medan
      'MEDAN': ['20111', '20211', '20311', '20411', '20511'],
      'KOTA MEDAN': ['20111', '20211', '20311', '20411', '20511'],

      // Semarang
      'SEMARANG': ['50111', '50211', '50311', '50411', '50511'],
      'KOTA SEMARANG': ['50111', '50211', '50311', '50411', '50511'],

      // Makassar
      'MAKASSAR': ['90111', '90211', '90311', '90411', '90511'],
      'KOTA MAKASSAR': ['90111', '90211', '90311', '90411', '90511'],
    };

    if (cityName) {
      const cityUpper = cityName.toUpperCase();

      // Direct match
      if (cityPostalPatterns[cityUpper]) {
        return cityPostalPatterns[cityUpper];
      }

      // Partial match for cities containing keywords
      for (const [pattern, codes] of Object.entries(cityPostalPatterns)) {
        if (cityUpper.includes(pattern.replace('KOTA ', '')) || pattern.replace('KOTA ', '').includes(cityUpper)) {
          return codes;
        }
      }

      // Generate based on first letter patterns
      if (cityUpper.startsWith('JAKARTA') || cityUpper.includes('JAKARTA')) {
        return ['10110', '11140', '12210', '13220', '14240'];
      }
    }

    // Default Indonesian postal codes
    return ['10110', '20211', '30312', '40413', '50514'];
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await locationCache.clearAll();
  }

  /**
   * Get cache information
   */
  async getCacheInfo() {
    return await locationCache.getCacheInfo();
  }
}

export const locationAPI = new LocationAPIService();