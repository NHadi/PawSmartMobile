import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth/authService';
import config from '../config/environment';

// Address interface matching backend model
export interface Address {
  id: string | number;
  user_id?: string | number;
  label: string;
  name: string;
  phone: string;
  full_address: string;
  detail?: string;
  postal_code: string;
  is_default: boolean;
  latitude?: number;
  longitude?: number;
  province?: string;
  city?: string;
  district?: string;
  sub_district?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddressResponse {
  success: boolean;
  data?: Address | Address[];
  message?: string;
  error?: string;
}

class AddressServiceAPI {
  private baseURL: string;
  private cacheKey = 'cached_addresses';
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    // Use configured API URL
    this.baseURL = config.API.BASE_URL;
  }

  // Helper to get auth headers
  private async getHeaders() {
    const token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Cache management
  private async getCachedAddresses(): Promise<Address[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheExpiry) {
          return data;
        }
      }
    } catch (error) {
      }
    return null;
  }

  private async setCachedAddresses(addresses: Address[]) {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify({
        data: addresses,
        timestamp: Date.now(),
      }));
    } catch (error) {
      }
  }

  private async clearCache() {
    await AsyncStorage.removeItem(this.cacheKey);
  }

  // Get all addresses for current user
  async getAllAddresses(forceRefresh = false): Promise<Address[]> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedAddresses();
        if (cached) return cached;
      }

      const headers = await this.getHeaders();
      const response = await axios.get<AddressResponse>(
        `${this.baseURL}/api/v1/addresses`,
        { headers }
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const addresses = response.data.data;
        await this.setCachedAddresses(addresses);
        return addresses;
      }

      return [];
    } catch (error) {
      // Fallback to cache if API fails
      const cached = await this.getCachedAddresses();
      if (cached) return cached;
      
      throw error;
    }
  }

  // Get single address by ID
  async getAddressById(id: string | number): Promise<Address | null> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get<AddressResponse>(
        `${this.baseURL}/api/v1/addresses/${id}`,
        { headers }
      );

      if (response.data.success && response.data.data) {
        return response.data.data as Address;
      }

      return null;
    } catch (error) {
      // Try to find in cache
      const cached = await this.getCachedAddresses();
      if (cached) {
        return cached.find(addr => addr.id === id) || null;
      }
      
      return null;
    }
  }

  // Create new address
  async addAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post<AddressResponse>(
        `${this.baseURL}/api/v1/addresses`,
        address,
        { headers }
      );

      if (response.data.success && response.data.data) {
        // Clear cache to force refresh
        await this.clearCache();
        return response.data.data as Address;
      }

      throw new Error(response.data.message || 'Failed to create address');
    } catch (error) {
      throw error;
    }
  }

  // Update existing address
  async updateAddress(id: string | number, updates: Partial<Address>): Promise<Address | null> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.put<AddressResponse>(
        `${this.baseURL}/api/v1/addresses/${id}`,
        updates,
        { headers }
      );

      if (response.data.success && response.data.data) {
        // Clear cache to force refresh
        await this.clearCache();
        return response.data.data as Address;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Delete address
  async deleteAddress(id: string | number): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.delete<AddressResponse>(
        `${this.baseURL}/api/v1/addresses/${id}`,
        { headers }
      );

      if (response.data.success) {
        // Clear cache to force refresh
        await this.clearCache();
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  // Set address as default
  async setDefaultAddress(id: string | number): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post<AddressResponse>(
        `${this.baseURL}/api/v1/addresses/${id}/set-default`,
        {},
        { headers }
      );

      if (response.data.success) {
        // Clear cache to force refresh
        await this.clearCache();
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  // Get default address
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.getAllAddresses();
      return addresses.find(addr => addr.is_default) || null;
    } catch (error) {
      return null;
    }
  }

  // Validate address with external service
  async validateAddress(address: Partial<Address>): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post<{ valid: boolean; suggestions?: any[] }>(
        `${this.baseURL}/api/v1/addresses/validate`,
        address,
        { headers }
      );

      return response.data.valid;
    } catch (error) {
      return true; // Allow to proceed even if validation fails
    }
  }

  // Get shipping cost estimate for address
  async getShippingEstimate(addressId: string | number, items: any[]): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post<{ cost: number }>(
        `${this.baseURL}/api/v1/addresses/${addressId}/shipping-estimate`,
        { items },
        { headers }
      );

      return response.data.cost;
    } catch (error) {
      return 0;
    }
  }
}

export default new AddressServiceAPI();