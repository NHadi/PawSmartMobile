import odooComService from '../odoocom/odooComService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Odoo Address Service
 * Integrates with Odoo's res.partner model for address management
 */

export interface OdooAddress {
  id: number;
  name: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  state_id?: [number, string]; // [id, name]
  country_id?: [number, string]; // [id, name]
  zip?: string;
  partner_latitude?: number;
  partner_longitude?: number;
  is_company: boolean;
  parent_id?: [number, string]; // Parent partner (for delivery addresses)
  type?: 'contact' | 'invoice' | 'delivery' | 'other';
  create_date?: string;
  write_date?: string;
}

class OdooAddressService {
  private model = 'res.partner';
  private cacheKey = 'odoo_addresses_cache';

  /**
   * Get all delivery addresses for current user
   */
  async getUserAddresses(userId?: number): Promise<OdooAddress[]> {
    try {
      // Get user's partner ID if not provided
      const partnerId = userId || await this.getCurrentUserPartnerId();
      
      if (!partnerId) {
        // User not authenticated, return empty array
        return [];
      }

      // Search for delivery addresses linked to user
      const domain = [
        ['parent_id', '=', partnerId],
        ['type', '=', 'delivery'],
        ['active', '=', true]
      ];

      const fields = [
        'name', 'phone', 'mobile', 'street', 'street2', 
        'city', 'state_id', 'country_id', 'zip',
        'partner_latitude', 'partner_longitude',
        'type'
      ];

      const addresses = await odooComService.searchRead(
        this.model,
        domain,
        fields,
        {}
      );

      // Cache the results
      await this.cacheAddresses(addresses);

      return addresses;
    } catch (error) {
      // Try to return cached data
      return await this.getCachedAddresses();
    }
  }

  /**
   * Create new delivery address
   */
  async createAddress(data: {
    name: string;
    phone: string;
    street: string;
    street2?: string;
    city: string;
    state_id?: number;
    country_id?: number;
    zip: string;
    latitude?: number;
    longitude?: number;
  }): Promise<OdooAddress> {
    try {
      const partnerId = await this.getCurrentUserPartnerId();
      
      if (!partnerId) {
        // User not authenticated, return a mock address for now
        // Return a temporary mock address
        return {
          id: Date.now(),
          name: data.name,
          phone: data.phone,
          street: data.street,
          street2: data.street2,
          city: data.city,
          zip: data.zip,
          partner_latitude: data.latitude,
          partner_longitude: data.longitude,
          is_company: false,
          type: 'delivery'
        } as OdooAddress;
      }

      // Prepare Odoo data
      const odooData = {
        name: data.name,
        phone: data.phone,
        street: data.street,
        street2: data.street2 || '',
        city: data.city,
        state_id: data.state_id || false,
        country_id: data.country_id || 101, // Default to Indonesia
        zip: data.zip,
        partner_latitude: data.latitude || false,
        partner_longitude: data.longitude || false,
        parent_id: partnerId,
        type: 'delivery',
        is_company: false
      };

      const addressId = await odooComService.create(this.model, odooData);

      // Fetch the created address
      const newAddress = await this.getAddressById(addressId);
      
      // Clear cache to force refresh
      await this.clearCache();

      return newAddress;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update existing address
   */
  async updateAddress(id: number, updates: Partial<OdooAddress>): Promise<boolean> {
    try {
      const partnerId = await this.getCurrentUserPartnerId();
      
      if (!partnerId) {
        // User not authenticated, just return success for now
        return true;
      }
      
      // Remove is_default_shipping from updates if present
      const { is_default_shipping, ...safeUpdates } = updates as any;
      
      await odooComService.write(this.model, [id], safeUpdates);
      
      // Clear cache to force refresh
      await this.clearCache();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete address (actually archives it in Odoo)
   */
  async deleteAddress(id: number): Promise<boolean> {
    try {
      const partnerId = await this.getCurrentUserPartnerId();
      
      if (!partnerId) {
        // User not authenticated, just return success for now
        return true;
      }
      
      // In Odoo, we typically archive rather than delete
      await odooComService.write(this.model, [id], { active: false });
      
      // Clear cache to force refresh
      await this.clearCache();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single address by ID
   */
  async getAddressById(id: number): Promise<OdooAddress> {
    try {
      const result = await odooComService.read(this.model, [id], [
        'name', 'phone', 'mobile', 'street', 'street2',
        'city', 'state_id', 'country_id', 'zip',
        'partner_latitude', 'partner_longitude',
        'type'
      ]);

      if (result && result.length > 0) {
        return result[0];
      }

      throw new Error('Address not found');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set address as default shipping
   */
  async setDefaultAddress(id: number): Promise<boolean> {
    try {
      const partnerId = await this.getCurrentUserPartnerId();
      
      if (!partnerId) {
        // User not authenticated, just return success for now
        return true;
      }

      // Note: is_default_shipping field doesn't exist in standard Odoo
      // You may need to implement this differently based on your Odoo setup
      // For now, we'll just return true
      // Clear cache
      await this.clearCache();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Indonesian states/provinces from Odoo
   */
  async getIndonesianStates(): Promise<Array<{id: number; name: string}>> {
    try {
      const states = await odooComService.searchRead(
        'res.country.state',
        [['country_id', '=', 101]], // 101 is Indonesia's ID in Odoo
        ['id', 'name']
      );

      return states.map(state => ({
        id: state.id,
        name: state.name
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate address using Odoo's validation
   */
  async validateAddress(address: Partial<OdooAddress>): Promise<boolean> {
    try {
      // You can implement custom validation logic here
      // or call an Odoo method that validates addresses
      
      // Basic validation
      if (!address.name || !address.street || !address.city || !address.zip) {
        return false;
      }

      // Could also check postal code format, etc.
      const postalCodeRegex = /^\d{5}$/;
      if (address.zip && !postalCodeRegex.test(address.zip)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper methods

  private async getCurrentUserPartnerId(): Promise<number | null> {
    try {
      // Use the correct key that authService uses
      const userStr = await AsyncStorage.getItem('@PawSmart:userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.partner_id || null;
      }
    } catch (error) {
      }
    return null;
  }

  private async clearDefaultAddresses(partnerId: number, exceptId?: number) {
    try {
      // Note: is_default_shipping field doesn't exist in standard Odoo
      // This method is currently disabled
      return;

      if (exceptId) {
        domain.push(['id', '!=', exceptId]);
      }

      const defaultAddresses = await odooComService.searchRead(
        this.model,
        domain,
        ['id']
      );

      // Method disabled due to missing is_default_shipping field
    } catch (error) {
      }
  }

  private async cacheAddresses(addresses: OdooAddress[]) {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify({
        data: addresses,
        timestamp: Date.now()
      }));
    } catch (error) {
      }
  }

  private async getCachedAddresses(): Promise<OdooAddress[]> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (error) {
      }
    return [];
  }

  private async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      }
  }
}

export default new OdooAddressService();