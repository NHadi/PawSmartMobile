import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/environment';
import { safeApiCall, isAuthError } from '../../utils/authErrorHandler';

const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;

// Address interfaces matching API specification
export interface Address {
  id: number | string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  district: string;
  subdistrict: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressRequest {
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  district: string;
  subdistrict: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  notes?: string;
}

class StandaloneAddressService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.STANDALONE_API.BASE_URL;
  }

  /**
   * Get authorization header with bearer token
   */
  private async getAuthHeader(): Promise<string | null> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      console.log('Address service: No authentication token found');
    }
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Retrieve all addresses from api/v1/addresses endpoint using GET method
   * Similar to getCurrentUser() in standaloneAuthService
   */
  async getAddresses(): Promise<Address[]> {
    return safeApiCall(async () => {
      const authHeader = await this.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const url = `${this.baseURL}/api/v1/addresses`;
      console.log('getAddresses - Calling URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      console.log('getAddresses - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          const error = new Error('Unauthorized - Please login again');
          // Add response data for auth error handler
          (error as any).response = { status: 401 };
          (error as any).message = 'Unauthorized - Please login again';
          throw error;
        }
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }

      const data = await response.json();
      console.log('getAddresses - Response data:', data);

      // Handle different response formats
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Unexpected response format:', data);
        return [];
      }
    }, {
      // Custom auth error handling options
      showAlert: false, // Don't show alert for seamless UX
    }) || Promise.resolve([]); // Fallback to empty array if auth error
  }

  /**
   * Save address to api/v1/addresses endpoint using POST method
   * Similar to getCurrentUser() pattern for bearer token usage
   */
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    return safeApiCall(async () => {
      const authHeader = await this.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const url = `${this.baseURL}/api/v1/addresses`;
      console.log('createAddress - Calling URL:', url);
      console.log('createAddress - Request data:', addressData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      console.log('createAddress - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          const error = new Error('Unauthorized - Please login again');
          (error as any).response = { status: 401 };
          (error as any).message = 'Unauthorized - Please login again';
          throw error;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create address: ${response.status}`);
      }

      const data = await response.json();
      console.log('createAddress - Response data:', data);

      // Handle different response formats
      if (data.success && data.data) {
        return data.data;
      } else if (data) {
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    }, {
      showAlert: false,
    }) as Promise<Address>;
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: number | string, addressData: Partial<CreateAddressRequest>): Promise<Address> {
    try {
      const authHeader = await this.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const url = `${this.baseURL}/api/v1/addresses/${addressId}`;
      console.log('updateAddress - Calling URL:', url);
      console.log('updateAddress - Request data:', addressData);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      console.log('updateAddress - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update address: ${response.status}`);
      }

      const data = await response.json();
      console.log('updateAddress - Response data:', data);

      if (data.success && data.data) {
        return data.data;
      } else if (data) {
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('updateAddress - Error:', error.message);

      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      }

      throw error;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: number | string): Promise<boolean> {
    try {
      const authHeader = await this.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const url = `${this.baseURL}/api/v1/addresses/${addressId}`;
      console.log('deleteAddress - Calling URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      console.log('deleteAddress - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete address: ${response.status}`);
      }

      const data = await response.json();
      console.log('deleteAddress - Response data:', data);

      return data.success !== false;
    } catch (error: any) {
      console.error('deleteAddress - Error:', error.message);

      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      }

      throw error;
    }
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(addressId: number | string): Promise<boolean> {
    try {
      const authHeader = await this.getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const url = `${this.baseURL}/api/v1/addresses/${addressId}/set-default`;
      console.log('setDefaultAddress - Calling URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      console.log('setDefaultAddress - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to set default address: ${response.status}`);
      }

      const data = await response.json();
      console.log('setDefaultAddress - Response data:', data);

      return data.success !== false;
    } catch (error: any) {
      console.error('setDefaultAddress - Error:', error.message);

      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      }

      throw error;
    }
  }
}

export default new StandaloneAddressService();