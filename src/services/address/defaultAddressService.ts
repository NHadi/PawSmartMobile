import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service to manage default address locally
 * Since Odoo doesn't have is_default_shipping field by default,
 * we manage this locally
 */
class DefaultAddressService {
  private readonly DEFAULT_ADDRESS_KEY = '@PawSmart:defaultAddressId';

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string | number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.DEFAULT_ADDRESS_KEY, String(addressId));
    } catch (error) {
      }
  }

  /**
   * Get the default address ID
   */
  async getDefaultAddressId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.DEFAULT_ADDRESS_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear the default address
   */
  async clearDefaultAddress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.DEFAULT_ADDRESS_KEY);
    } catch (error) {
      }
  }

  /**
   * Check if an address is the default one
   */
  async isDefaultAddress(addressId: string | number): Promise<boolean> {
    try {
      const defaultId = await this.getDefaultAddressId();
      return defaultId === String(addressId);
    } catch (error) {
      return false;
    }
  }
}

export default new DefaultAddressService();