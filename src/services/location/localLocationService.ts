import {
  Province,
  City,
  District,
  PostalCodeResult,
  APIResponse,
  LocationAPIError
} from '../../types/location';
import { locationCache } from './locationCache';
import postalData from '../../../assets/kodepos.json';

interface LocalLocationData {
  code: number;
  village: string;
  district: string;
  regency: string;
  province: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
}

class LocalLocationService {
  private postalData: LocalLocationData[] = postalData as LocalLocationData[];

  constructor() {
    console.log(`LocalLocationService initialized with ${this.postalData.length} postal code entries`);

    // Log sample data structure for debugging
    if (this.postalData.length > 0) {
      console.log('Sample postal data entry:', this.postalData[0]);
    }
  }

  /**
   * Get all provinces from local data
   */
  async getProvinces(): Promise<APIResponse<Province[]>> {
    try {
      // Check cache first
      const cached = await locationCache.get('provinces');
      if (cached) {
        return { data: cached, loading: false };
      }

      console.log('Loading provinces from local data...');

      // Extract unique provinces
      const provinceNames = [...new Set(this.postalData.map(item => item.province))];
      const provinces: Province[] = provinceNames
        .sort()
        .map((name, index) => ({
          id: (index + 1).toString(),
          name
        }));

      // Cache the result
      await locationCache.set('provinces', provinces);

      console.log(`Loaded ${provinces.length} provinces from local data`);
      return { data: provinces, loading: false };
    } catch (error: any) {
      console.error('Failed to load provinces from local data:', error);
      return {
        data: [],
        loading: false,
        error: error.message || 'Failed to load provinces'
      };
    }
  }

  /**
   * Get cities by province name
   */
  async getCities(provinceId: string): Promise<APIResponse<City[]>> {
    try {
      // Check cache first
      const cached = await locationCache.get('cities', provinceId);
      if (cached) {
        return { data: cached, loading: false };
      }

      // Get province name by ID
      const provinces = await this.getProvinces();
      const province = provinces.data.find(p => p.id === provinceId);
      if (!province) {
        return { data: [], loading: false, error: 'Province not found' };
      }

      console.log(`Loading cities for province: ${province.name}`);

      // Extract unique cities/regencies for this province
      const provinceCities = this.postalData.filter(item => item.province === province.name);
      const cityNames = [...new Set(provinceCities.map(item => item.regency))];

      const cities: City[] = cityNames
        .sort()
        .map((name, index) => ({
          id: `${provinceId}_${(index + 1).toString().padStart(3, '0')}`,
          province_id: provinceId,
          name
        }));

      // Cache the result
      await locationCache.set('cities', cities, provinceId);

      console.log(`Loaded ${cities.length} cities for ${province.name}`);
      return { data: cities, loading: false };
    } catch (error: any) {
      console.error('Failed to load cities from local data:', error);
      return {
        data: [],
        loading: false,
        error: error.message || 'Failed to load cities'
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

      // Get city info
      const [provinceId] = cityId.split('_');
      const cities = await this.getCities(provinceId);
      const city = cities.data.find(c => c.id === cityId);

      if (!city) {
        return { data: [], loading: false, error: 'City not found' };
      }

      console.log(`Loading districts for city: ${city.name}`);

      // Extract unique districts for this city
      const cityDistricts = this.postalData.filter(item => item.regency === city.name);
      const districtNames = [...new Set(cityDistricts.map(item => item.district))];

      const districts: District[] = districtNames
        .sort()
        .map((name, index) => ({
          id: `${cityId}_${(index + 1).toString().padStart(3, '0')}`,
          regency_id: cityId,
          name
        }));

      // Cache the result
      await locationCache.set('districts', districts, cityId);

      console.log(`Loaded ${districts.length} districts for ${city.name}`);
      return { data: districts, loading: false };
    } catch (error: any) {
      console.error('Failed to load districts from local data:', error);
      return {
        data: [],
        loading: false,
        error: error.message || 'Failed to load districts'
      };
    }
  }

  /**
   * Get postal codes for a specific district
   */
  async getPostalCodesForDistrict(districtName: string, cityName?: string): Promise<APIResponse<{code: string, area: string}[]>> {
    try {
      console.log(`Loading postal codes for district: ${districtName} in city: ${cityName}`);

      // Normalize search terms
      const normalizeText = (text: string) => {
        return text.toLowerCase()
          .replace(/\s+/g, '') // Remove all spaces
          .replace(/[^a-z0-9]/g, ''); // Remove special characters
      };

      const searchDistrict = normalizeText(districtName);
      const searchCity = cityName ? normalizeText(cityName) : '';

      console.log(`Normalized search: district="${searchDistrict}", city="${searchCity}"`);

      // Find postal codes with normalized matching
      let postalEntries = this.postalData.filter(item => {
        const itemDistrict = normalizeText(item.district);
        const itemRegency = normalizeText(item.regency);
        const itemVillage = normalizeText(item.village);

        // District matching (check district, village names)
        const districtMatch = itemDistrict.includes(searchDistrict) ||
                             searchDistrict.includes(itemDistrict) ||
                             itemVillage.includes(searchDistrict) ||
                             searchDistrict.includes(itemVillage);

        // City matching (handle Jakarta naming variations)
        let cityMatch = true;
        if (searchCity) {
          // Handle Jakarta specific patterns
          if (searchCity.includes('jakarta')) {
            cityMatch = itemRegency.includes('jakarta') ||
                       itemRegency.includes('administrasi') ||
                       itemRegency.includes('kota');
          } else {
            cityMatch = itemRegency.includes(searchCity) ||
                       searchCity.includes(itemRegency);
          }
        }

        const match = districtMatch && cityMatch;
        if (match) {
          console.log(`Found match: ${item.village}, ${item.district}, ${item.regency} (${item.code})`);
        }
        return match;
      });

      console.log(`Found ${postalEntries.length} entries after normalized matching`);

      // If still no results, try even more flexible matching
      if (postalEntries.length === 0) {
        console.log('Trying flexible matching...');
        postalEntries = this.postalData.filter(item => {
          const itemDistrict = item.district.toLowerCase();
          const itemRegency = item.regency.toLowerCase();
          const itemVillage = item.village.toLowerCase();
          const searchDistrictLower = districtName.toLowerCase();

          // Very flexible matching
          const flexibleDistrictMatch =
            itemDistrict.includes(searchDistrictLower) ||
            searchDistrictLower.includes(itemDistrict) ||
            itemVillage.includes(searchDistrictLower) ||
            searchDistrictLower.includes(itemVillage) ||
            // Handle "Pal Merah" vs "Palmerah"
            itemDistrict.replace(/\s/g, '').includes(searchDistrictLower.replace(/\s/g, '')) ||
            searchDistrictLower.replace(/\s/g, '').includes(itemDistrict.replace(/\s/g, ''));

          const flexibleCityMatch = !cityName ||
            itemRegency.includes('jakarta') ||
            itemRegency.includes('administrasi');

          return flexibleDistrictMatch && flexibleCityMatch;
        });

        console.log(`Found ${postalEntries.length} entries after flexible matching`);
      }

      if (postalEntries.length === 0) {
        console.warn(`No postal codes found for ${districtName} in ${cityName}`);

        // Return fallback postal codes based on common Indonesian patterns
        const fallbackCodes = this.generateFallbackPostalCodes(cityName, districtName);
        const fallbackData = fallbackCodes.map(code => ({
          code,
          area: districtName || 'Area'
        }));
        return {
          data: fallbackData,
          loading: false,
          error: 'No postal codes found in local data'
        };
      }

      // Create postal code objects with area names
      const postalCodeMap = new Map<string, string>();
      postalEntries.forEach(item => {
        const code = item.code.toString();
        if (!postalCodeMap.has(code)) {
          postalCodeMap.set(code, item.village || item.district);
        }
      });

      const postalCodeData = Array.from(postalCodeMap.entries()).map(([code, area]) => ({
        code,
        area
      }));

      console.log(`Found ${postalCodeData.length} postal codes for ${districtName} in ${cityName}:`,
        postalCodeData.map(item => `${item.area} ${item.code}`));
      return { data: postalCodeData, loading: false };
    } catch (error: any) {
      console.error(`Failed to get postal codes for district ${districtName}:`, error);

      // Fallback to realistic postal codes
      const fallbackCodes = this.generateFallbackPostalCodes(cityName, districtName);
      const fallbackData = fallbackCodes.map(code => ({
        code,
        area: districtName || 'Area'
      }));
      return {
        data: fallbackData,
        loading: false,
        error: error.message || 'Failed to load postal codes'
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

      console.log(`Searching postal codes for: "${query}"`);

      const queryLower = query.toLowerCase();

      // Search in all fields
      const matchingEntries = this.postalData.filter(item => {
        return item.village.toLowerCase().includes(queryLower) ||
               item.district.toLowerCase().includes(queryLower) ||
               item.regency.toLowerCase().includes(queryLower) ||
               item.province.toLowerCase().includes(queryLower);
      });

      // Convert to PostalCodeResult format
      const results: PostalCodeResult[] = matchingEntries
        .slice(0, 20) // Limit results
        .map(item => ({
          village: item.village,
          district: item.district,
          regency: item.regency,
          province: item.province,
          postal_code: item.code.toString()
        }));

      console.log(`Found ${results.length} postal code results for "${query}"`);
      return { data: results, loading: false };
    } catch (error: any) {
      console.error(`Failed to search postal codes for "${query}":`, error);
      return {
        data: [],
        loading: false,
        error: error.message || 'Failed to search postal codes'
      };
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
      'JAKARTA PUSAT': ['10110', '10120', '10130', '10140', '10150'],
      'JAKARTA BARAT': ['11220', '11240', '11350', '11470', '11530'],
      'JAKARTA UTARA': ['14110', '14210', '14240', '14340', '14450'],
      'JAKARTA SELATAN': ['12110', '12210', '12310', '12430', '12560'],
      'JAKARTA TIMUR': ['13110', '13220', '13330', '13410', '13560'],

      // Surabaya
      'SURABAYA': ['60111', '60211', '60311', '60411', '60511'],

      // Bandung
      'BANDUNG': ['40111', '40211', '40311', '40411', '40511'],

      // Medan
      'MEDAN': ['20111', '20211', '20311', '20411', '20511'],

      // Semarang
      'SEMARANG': ['50111', '50211', '50311', '50411', '50511'],

      // Makassar
      'MAKASSAR': ['90111', '90211', '90311', '90411', '90511'],
    };

    if (cityName) {
      const cityUpper = cityName.toUpperCase();

      // Direct match
      for (const [pattern, codes] of Object.entries(cityPostalPatterns)) {
        if (cityUpper.includes(pattern) || pattern.includes(cityUpper)) {
          return codes;
        }
      }

      // Generate based on patterns
      if (cityUpper.includes('JAKARTA')) {
        return ['10110', '11140', '12210', '13220', '14240'];
      }
    }

    // Default Indonesian postal codes
    return ['10110', '20211', '30312', '40413', '50514'];
  }

  /**
   * Search for location data by coordinates (find nearest location)
   */
  async searchByCoordinates(latitude: number, longitude: number, radiusKm: number = 5): Promise<LocalLocationData[]> {
    try {
      console.log(`Searching by coordinates: ${latitude}, ${longitude} within ${radiusKm}km`);

      // Calculate distance between two coordinates using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Find locations within radius
      const nearbyLocations = this.postalData
        .map(location => ({
          ...location,
          distance: calculateDistance(latitude, longitude, location.latitude, location.longitude)
        }))
        .filter(location => location.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${nearbyLocations.length} locations within ${radiusKm}km`);

      if (nearbyLocations.length > 0) {
        console.log(`Nearest location: ${nearbyLocations[0].village}, ${nearbyLocations[0].district}, ${nearbyLocations[0].regency} (${nearbyLocations[0].distance.toFixed(2)}km)`);
      }

      return nearbyLocations.slice(0, 5); // Return top 5 nearest locations
    } catch (error: any) {
      console.error('Failed to search by coordinates:', error);
      return [];
    }
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

export const localLocationAPI = new LocalLocationService();