/**
 * KiriminAja Shipping Service
 * Integration with KiriminAja API for shipping rate calculation and tracking
 * Documentation: https://developer.kiriminaja.com/docs
 */

import axios from 'axios';
import config from '../../config/environment';

// KiriminAja API Configuration
const KIRIMINAJA_CONFIG = {
  BASE_URL: config.SHIPPING.KIRIMINAJA.BASE_URL,
  API_TOKEN: config.SHIPPING.KIRIMINAJA.API_TOKEN,
  API_VERSION: config.SHIPPING.KIRIMINAJA.API_VERSION,
};

// Create axios client with authentication
const kiriminAjaClient = axios.create({
  baseURL: KIRIMINAJA_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${KIRIMINAJA_CONFIG.API_TOKEN}`,
  },
  timeout: 30000,
});

// Request Interfaces
export interface ShippingPriceRequest {
  origin: number; // District ID of sender
  subdistrict_origin?: number; // Village ID of sender (for RPX, POS, Paxel)
  destination: number; // District ID of recipient
  subdistrict_destination?: number; // Village ID of recipient (for RPX, POS, Paxel)
  weight: number; // Total weight in grams
  length?: number; // Package length in cm (for volumetric calculation)
  width?: number; // Package width in cm (for volumetric calculation)
  height?: number; // Package height in cm (for volumetric calculation)
  insurance?: 0 | 1; // Insurance required (0 = false, 1 = true)
  item_value?: string; // Item value for insurance/COD calculation
  courier?: string | string[]; // Specific courier(s) to check (optional)
}

// Instant Pricing Request (different format)
export interface InstantPricingRequest {
  origin: {
    lat: number;
    long: number;
  };
  destination: {
    lat: number;
    long: number;
  };
  weight: number; // Total weight in grams
  timezone?: string; // e.g., "Asia/Jakarta" - Optional due to API validation issues
  item_value?: string; // Item value for insurance calculation
}

export interface DiscountCampaign {
  discount: number;
  discount_percentage: number;
  discount_campaign_id: number;
  discount_type: string;
}

export interface ServiceSetting {
  cod_fee: string; // COD fee percentage (already divided by 100)
  minimum_cod_fee: string; // Minimum COD fee amount
  insurance_fee: string; // Insurance fee percentage (already divided by 100)
  insurance_add_cost: number;
  cod_fee_amount: number; // Calculated COD fee
}

export interface ShippingService {
  service: string; // Service code (e.g., "jne")
  service_name: string; // Service name (e.g., "JNE Express Reguler")
  service_type: string; // Service type code (e.g., "REG23")
  cost: string; // Shipping cost
  etd: string; // Estimated delivery time (e.g., "2-3")
  cod: boolean; // COD support
  group: 'regular' | 'instant' | 'trucking'; // Service grouping
  drop: boolean; // Dropoff support
  cut_off_time: string | null;
  force_insurance: boolean;
  use_geolocation: boolean;
  discount_campaign: DiscountCampaign;
  discount_amount: number;
  discount_percentage: number;
  discount_type: string | null;
  setting: ServiceSetting;
  insurance: number; // Insurance fee
  is_mock_data?: boolean; // Flag to identify mock/test data
}

export interface ShippingPriceResponse {
  status: boolean;
  method: string;
  text: string;
  details: {
    origin_district_id: number;
    origin_subdistrict_id?: number;
    destination_district_id: number;
    destination_subdistrict_id?: number;
    origin_latitude: number;
    origin_longitude: number;
    weight: number;
    item_value?: string;
    width?: number;
    length?: number;
    height?: number;
    insurance: number;
    expeditions: string[];
    cod: number;
    origin: number;
    destination: number;
    origin_kelurahan?: number;
    destination_kelurahan?: number;
    courier: string[];
  };
  results: ShippingService[];
}

// Tracking Interfaces
export interface TrackingRequest {
  awb: string; // Airway bill number
  courier?: string; // Courier code
}

export interface TrackingHistory {
  date: string;
  description: string;
  location: string;
}

export interface TrackingResponse {
  status: boolean;
  method: string;
  text: string;
  awb: string;
  courier: string;
  service: string;
  status_code: string;
  status_name: string;
  receiver_name?: string;
  history: TrackingHistory[];
}

// Location Search Interfaces
export interface LocationResult {
  district_id: number;
  district_name: string;
  city_id: number;
  city_name: string;
  province_id: number;
  province_name: string;
  postal_code: string;
  subdistrict_id?: number;
  subdistrict_name?: string;
}

export interface LocationSearchResponse {
  status: boolean;
  method: string;
  text: string;
  results: LocationResult[];
}

class KiriminAjaService {
  /**
   * Calculate volumetric weight based on package dimensions
   * Regular/Same Day: width * length * height / 6000
   * Trucking: width * length * height / 4000
   */
  calculateVolumetricWeight(
    width: number,
    length: number,
    height: number,
    category: 'regular' | 'trucking' = 'regular'
  ): number {
    const divisor = category === 'trucking' ? 4000 : 6000;
    return Math.ceil((width * length * height) / divisor);
  }

  /**
   * Get final weight (max of actual weight and volumetric weight)
   */
  getFinalWeight(
    actualWeight: number,
    width?: number,
    length?: number,
    height?: number,
    category: 'regular' | 'trucking' = 'regular'
  ): number {
    if (!width || !length || !height) {
      return actualWeight;
    }

    const volumetricWeight = this.calculateVolumetricWeight(width, length, height, category);
    return Math.max(actualWeight, volumetricWeight);
  }

  /**
   * Get shipping rates from available couriers
   * Endpoint: POST /api/mitra/v6.1/shipping_price
   */
  async getShippingRates(request: ShippingPriceRequest): Promise<ShippingPriceResponse> {
    try {
      console.log('Fetching KiriminAja shipping rates:', request);

      // Calculate final weight if dimensions provided
      const finalWeight = this.getFinalWeight(
        request.weight,
        request.width,
        request.length,
        request.height
      );

      const payload = {
        origin: request.origin,
        destination: request.destination,
        weight: finalWeight,
        ...(request.subdistrict_origin && { subdistrict_origin: request.subdistrict_origin }),
        ...(request.subdistrict_destination && { subdistrict_destination: request.subdistrict_destination }),
        ...(request.length && { length: request.length }),
        ...(request.width && { width: request.width }),
        ...(request.height && { height: request.height }),
        ...(request.insurance !== undefined && { insurance: request.insurance }),
        ...(request.item_value && { item_value: request.item_value }),
        ...(request.courier && { courier: request.courier }),
      };

      console.log('KiriminAja API payload:', JSON.stringify(payload, null, 2));

      const response = await kiriminAjaClient.post<ShippingPriceResponse>(
        `/api/mitra/${KIRIMINAJA_CONFIG.API_VERSION}/shipping_price`,
        payload
      );

      console.log('KiriminAja shipping rates response:', response.data);

      if (!response.data.status) {
        throw new Error(response.data.text || 'Failed to fetch shipping rates');
      }

      return response.data;
    } catch (error: any) {
      console.error('KiriminAja shipping rates error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.text || 'Failed to fetch shipping rates from KiriminAja');
    }
  }

  /**
   * Get instant shipping rates
   * Endpoint: POST /api/mitra/v4/instant/pricing
   * Requires latitude/longitude coordinates
   */
  async getInstantRates(request: InstantPricingRequest): Promise<ShippingPriceResponse> {
    try {
      console.log('Fetching KiriminAja instant rates:', request);

      const payload = {
        origin: {
          lat: request.origin.lat,
          long: request.origin.long,
        },
        destination: {
          lat: request.destination.lat,
          long: request.destination.long,
        },
        weight: request.weight,
        timezone: request.timezone,
        ...(request.item_value && { item_value: request.item_value }),
      };

      console.log('KiriminAja Instant API payload:', JSON.stringify(payload, null, 2));

      const response = await kiriminAjaClient.post<ShippingPriceResponse>(
        '/api/mitra/v4/instant/pricing',
        payload
      );

      console.log('=== INSTANT API RESPONSE ===');
      console.log('Status:', response.data.status);
      console.log('Text:', response.data.text);
      console.log('Results count:', response.data.results?.length || 0);
      console.log('Full response:', JSON.stringify(response.data, null, 2));

      if (!response.data.status) {
        console.warn('Instant API returned status false:', response.data.text);
      }

      return response.data;
    } catch (error: any) {
      // Silently handle instant API errors - don't spam console
      console.log('⚠️ Instant delivery unavailable, using express shipping only');

      // Don't throw error, just return empty result to allow app to continue with express only
      return {
        status: false,
        method: 'instant',
        text: error.response?.data?.text || 'Instant services not available',
        details: {} as any,
        results: []
      };
    }
  }

  /**
   * Search location to get district_id for shipping calculations
   * Endpoint: POST /api/mitra/v2/get_address_by_name
   * Note: Uses v2 API (not v6.1) as per KiriminAja documentation
   */
  async searchLocation(keyword: string): Promise<LocationSearchResponse> {
    try {
      console.log('Searching KiriminAja location:', keyword);

      // Use v2 endpoint as per documentation
      const response = await kiriminAjaClient.post<any>(
        '/api/mitra/v2/get_address_by_name',
        {
          search: keyword
        }
      );

      console.log('Location search response:', JSON.stringify(response.data, null, 2));

      if (!response.data.status) {
        throw new Error(response.data.text || 'Failed to search location');
      }

      // Transform v2 response format to our expected format
      // v2 returns: { id: number, text: "District, City, Province" }
      // We need: { district_id, district_name, city_id, city_name, province_id, province_name }
      const transformedResults = response.data.data?.map((item: any) => {
        // Parse the location string: "District, City, Province"
        const parts = item.text.split(',').map((s: string) => s.trim());
        const transformed = {
          district_id: item.id,
          district_name: parts[0] || '',
          city_name: parts[1] || '',
          province_name: parts[2] || '',
          // v2 doesn't provide these IDs, will be undefined
          city_id: undefined,
          province_id: undefined,
          postal_code: '',
        };
        console.log('Transformed result:', transformed);
        return transformed;
      }) || [];

      console.log(`Found ${transformedResults.length} location(s)`);

      return {
        status: response.data.status,
        method: response.data.method || 'get_address_by_name',
        text: response.data.text,
        results: transformedResults
      };
    } catch (error: any) {
      console.error('KiriminAja location search error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.text || 'Failed to search location');
    }
  }

  /**
   * Get cheapest shipping option from results
   */
  getCheapestShipping(services: ShippingService[]): ShippingService | null {
    if (!services || services.length === 0) {
      return null;
    }

    return services.reduce((cheapest, current) => {
      const cheapestCost = parseInt(cheapest.cost);
      const currentCost = parseInt(current.cost);
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  /**
   * Get fastest shipping option from results
   */
  getFastestShipping(services: ShippingService[]): ShippingService | null {
    if (!services || services.length === 0) {
      return null;
    }

    return services.reduce((fastest, current) => {
      // Extract minimum ETD days (e.g., "2-3" -> 2)
      const fastestDays = parseInt(fastest.etd.split('-')[0]);
      const currentDays = parseInt(current.etd.split('-')[0]);
      return currentDays < fastestDays ? current : fastest;
    });
  }

  /**
   * Filter services by group (regular, instant, trucking)
   */
  filterByGroup(services: ShippingService[], group: 'regular' | 'instant' | 'trucking'): ShippingService[] {
    return services.filter(service => service.group === group);
  }

  /**
   * Filter services with COD support
   */
  filterCODServices(services: ShippingService[]): ShippingService[] {
    return services.filter(service => service.cod === true);
  }

  /**
   * Filter out mock/test data, only return real services
   */
  filterRealServices(services: ShippingService[]): ShippingService[] {
    return services.filter(service => service.is_mock_data !== true);
  }

  /**
   * Track shipment by AWB number
   * Endpoint: POST /api/mitra/v6.1/tracking
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      console.log('Tracking KiriminAja shipment:', request);

      const payload = {
        awb: request.awb,
        ...(request.courier && { courier: request.courier }),
      };

      const response = await kiriminAjaClient.post<TrackingResponse>(
        `/api/mitra/${KIRIMINAJA_CONFIG.API_VERSION}/tracking`,
        payload
      );

      console.log('KiriminAja tracking response:', response.data);

      if (!response.data.status) {
        throw new Error(response.data.text || 'Failed to track shipment');
      }

      return response.data;
    } catch (error: any) {
      console.error('KiriminAja tracking error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.text || 'Failed to track shipment');
    }
  }

  /**
   * Format shipping cost for display
   */
  formatCost(cost: string | number): string {
    const numericCost = typeof cost === 'string' ? parseInt(cost) : cost;
    return `Rp ${numericCost.toLocaleString('id-ID')}`;
  }

  /**
   * Format ETD for display
   */
  formatETD(etd: string): string {
    return `${etd} hari`;
  }

  /**
   * Get service display name with ETD
   */
  getServiceDisplayName(service: ShippingService): string {
    return `${service.service_name} (${this.formatETD(service.etd)}) - ${this.formatCost(service.cost)}`;
  }

  /**
   * Helper to create instant request from address with lat/long
   */
  createInstantRequestFromAddress(
    originLat: number,
    originLong: number,
    destLat: number,
    destLong: number,
    weight: number,
    timezone: string = 'Asia/Jakarta'
  ): InstantPricingRequest {
    return {
      origin: { lat: originLat, long: originLong },
      destination: { lat: destLat, long: destLong },
      weight,
      timezone,
    };
  }
}

export default new KiriminAjaService();
