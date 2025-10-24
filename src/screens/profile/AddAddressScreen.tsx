import React from 'react';
import AddAddressScreen from '../shop/AddAddressScreen';
import standaloneAddressService, { CreateAddressRequest, Address } from '../../services/address/standaloneAddressService';

/**
 * Profile Add/Edit Address Screen
 * Wrapper around the shop AddAddressScreen for profile navigation context
 * This ensures we reuse the same address management logic across the app
 *
 * This component provides access to the standalone API address functions
 * for direct use in the profile context if needed.
 */
export default function ProfileAddAddressScreen() {
  // Expose the standalone address service functions if needed in profile context
  // The shop AddAddressScreen already contains all the address management logic
  // including GET and POST functions for api/v1/addresses endpoint

  /**
   * Retrieve addresses from api/v1/addresses endpoint using GET method
   * Similar to auth/me endpoint for bearer token usage
   * Available for use in profile context
   */
  const retrieveAddresses = async (): Promise<Address[]> => {
    try {
      console.log('Retrieving addresses from standalone API in profile context...');
      const addresses = await standaloneAddressService.getAddresses();
      console.log('Successfully retrieved addresses:', addresses.length);
      return addresses;
    } catch (error) {
      console.error('Failed to retrieve addresses from standalone API:', error);
      throw error;
    }
  };

  /**
   * Save address to api/v1/addresses endpoint using POST method
   * Uses bearer token similar to auth/me endpoint pattern
   * Available for use in profile context
   */
  const saveAddress = async (addressData: CreateAddressRequest): Promise<Address> => {
    try {
      console.log('Saving address to standalone API in profile context...', addressData);
      const savedAddress = await standaloneAddressService.createAddress(addressData);
      console.log('Successfully saved address:', savedAddress);
      return savedAddress;
    } catch (error) {
      console.error('Failed to save address to standalone API:', error);
      throw error;
    }
  };

  // Simply render the shop's AddAddressScreen
  // Navigation will work correctly because we're in the Profile stack context
  // The functions above are available for potential direct use in profile screens
  return <AddAddressScreen />;
}