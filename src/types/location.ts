// TypeScript interfaces for Indonesian location API responses

export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
}

export interface District {
  id: string;
  regency_id: string;
  name: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
}

// Postal Code API response structure
export interface PostalCodeResult {
  village: string;
  district: string;
  regency: string;
  province: string;
  postal_code: string;
}

export interface PostalCodeResponse {
  data: PostalCodeResult[];
  total: number;
}

// Internal app location selection state
export interface LocationSelection {
  province?: {
    id: string;
    name: string;
  };
  city?: {
    id: string;
    name: string;
  };
  district?: {
    id: string;
    name: string;
  };
  postalCode?: string;
}

// API response wrappers
export interface APIResponse<T> {
  data: T;
  loading: boolean;
  error?: string;
}

// Cache structure
export interface CachedLocationData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface LocationCacheKeys {
  provinces: 'provinces';
  cities: (provinceId: string) => string;
  districts: (cityId: string) => string;
  villages: (districtId: string) => string;
  postalCodes: (searchQuery: string) => string;
}

// Error types
export enum LocationAPIError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  API_UNAVAILABLE = 'API_UNAVAILABLE'
}