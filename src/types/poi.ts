// TypeScript interfaces for POI (Points of Interest) system

export interface POICategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  overpassQuery: string;
  color: string;
  priority: number;
}

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: string;
  distanceValue?: number; // in meters
  tags?: { [key: string]: string };
  source: 'overpass' | 'cached' | 'manual';
  lastUpdated: Date;
}

export interface POISearchOptions {
  radius?: number; // in meters, default 1000
  categories?: string[]; // category IDs to filter
  limit?: number; // max results, default 20
  includeDistance?: boolean; // calculate distance, default true
}

export interface POISearchResult {
  pois: POI[];
  totalFound: number;
  searchRadius: number;
  searchCenter: {
    latitude: number;
    longitude: number;
  };
  categories: string[];
  source: 'overpass' | 'cached';
  timestamp: Date;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: { [key: string]: string };
}

export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OverpassElement[];
}

export interface POICacheEntry {
  gridId: string;
  pois: POI[];
  categories: string[];
  timestamp: Date;
  expiresAt: Date;
}

// Error types for POI operations
export class POIError extends Error {
  constructor(
    message: string,
    public code: string,
    public category?: string
  ) {
    super(message);
    this.name = 'POIError';
  }
}

export class POINetworkError extends POIError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
  }
}

export class POIParseError extends POIError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
  }
}

export class POIRateLimitError extends POIError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT');
  }
}