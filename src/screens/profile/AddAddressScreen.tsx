import React from 'react';
import AddAddressScreen from '../shop/AddAddressScreen';

/**
 * Profile Add/Edit Address Screen
 * Wrapper around the shop AddAddressScreen for profile navigation context
 * This ensures we reuse the same address management logic across the app
 */
export default function ProfileAddAddressScreen() {
  // Simply render the shop's AddAddressScreen
  // Navigation will work correctly because we're in the Profile stack context
  return <AddAddressScreen />;
}