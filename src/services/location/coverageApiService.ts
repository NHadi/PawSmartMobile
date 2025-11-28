/**
 * Coverage API Service
 * Fetches location data from Kirimin-Aja Coverage API endpoints
 * Replaces static kodepos.json with dynamic API calls
 */

import { config } from '../../config/environment';
import { APIResponse } from '../../types/location';

// Normalized types for app usage
export interface CoverageProvince {
  id: number;
  name: string;
}

export interface CoverageCity {
  id: number;
  name: string;
  provinsi_id: number;
  type?: string;
  postal_code?: string;
}

export interface CoverageDistrict {
  id: number;
  name: string;
  kabupaten_id: number;
  postal_code?: string;
}

export interface CoverageSubDistrict {
  id: number;
  name: string;
  kecamatan_id: number;
}

// Raw API response types
interface RawProvince {
  id: number;
  provinsi_name: string;
}

interface RawCity {
  id: number;
  provinsi_id: number;
  kabupaten_name: string;
  type?: string;
  postal_code?: string;
}

interface RawDistrict {
  id: number;
  kabupaten_id: number;
  kecamatan_name: string;
  postal_code?: string;
}

interface RawSubDistrict {
  id: number;
  kecamatan_id: number;
  kelurahan_name: string;
}

// API response structure (Kirimin-Aja uses 'status', 'datas' or 'results')
interface KiriminAjaAPIResponse {
  status: boolean;
  method?: string;
  text?: string;
  datas?: any[];
  results?: any[];
}

const API_BASE_URL = config.STANDALONE_API.BASE_URL;
const COVERAGE_ENDPOINT = '/api/v1/kirimin-aja/coverage';

class CoverageApiService {
  private async fetchRaw(
    endpoint: string,
    body?: Record<string, number>
  ): Promise<KiriminAjaAPIResponse> {
    try {
      const url = `${API_BASE_URL}${COVERAGE_ENDPOINT}${endpoint}`;
      console.log(`[CoverageAPI] Fetching: ${url}`, body || '');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CoverageAPI] HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const dataCount = result.datas?.length || result.results?.length || 0;
      console.log(`[CoverageAPI] Response from ${endpoint}:`, dataCount, 'items');

      return result;
    } catch (error: any) {
      console.error(`[CoverageAPI] Error fetching ${endpoint}:`, error);
      return {
        status: false,
      };
    }
  }

  /**
   * Get all provinces from Coverage API
   * API returns: { status, datas: [{ id, provinsi_name }] }
   */
  async getProvinces(): Promise<APIResponse<CoverageProvince[]>> {
    const result = await this.fetchRaw('/provinces');

    if (result.status && result.datas) {
      const provinces: CoverageProvince[] = result.datas.map((item: RawProvince) => ({
        id: item.id,
        name: item.provinsi_name,
      }));
      return { data: provinces, loading: false };
    }

    return { data: [], loading: false, error: 'Failed to fetch provinces' };
  }

  /**
   * Get cities by province ID
   * API returns: { status, datas: [{ id, provinsi_id, kabupaten_name, type, postal_code }] }
   */
  async getCities(provinsiId: number): Promise<APIResponse<CoverageCity[]>> {
    const result = await this.fetchRaw('/cities', { provinsi_id: provinsiId });

    if (result.status && result.datas) {
      const cities: CoverageCity[] = result.datas.map((item: RawCity) => ({
        id: item.id,
        name: item.type ? `${item.type} ${item.kabupaten_name}` : item.kabupaten_name,
        provinsi_id: item.provinsi_id,
        type: item.type,
        postal_code: item.postal_code,
      }));
      return { data: cities, loading: false };
    }

    return { data: [], loading: false, error: 'Failed to fetch cities' };
  }

  /**
   * Get districts by city ID (kabupaten_id)
   * API returns: { status, datas: [{ id, kabupaten_id, kecamatan_name, postal_code }] }
   */
  async getDistricts(kabupatenId: number): Promise<APIResponse<CoverageDistrict[]>> {
    const result = await this.fetchRaw('/districts', { kabupaten_id: kabupatenId });

    if (result.status && result.datas) {
      const districts: CoverageDistrict[] = result.datas.map((item: RawDistrict) => ({
        id: item.id,
        name: item.kecamatan_name,
        kabupaten_id: item.kabupaten_id,
        postal_code: item.postal_code,
      }));
      return { data: districts, loading: false };
    }

    return { data: [], loading: false, error: 'Failed to fetch districts' };
  }

  /**
   * Get sub-districts by district ID (kecamatan_id)
   * API returns: { status, results: [{ id, kecamatan_id, kelurahan_name }] }
   */
  async getSubDistricts(kecamatanId: number): Promise<APIResponse<CoverageSubDistrict[]>> {
    const result = await this.fetchRaw('/sub-districts', { kecamatan_id: kecamatanId });

    if (result.status && result.results) {
      const subDistricts: CoverageSubDistrict[] = result.results.map((item: RawSubDistrict) => ({
        id: item.id,
        name: item.kelurahan_name,
        kecamatan_id: item.kecamatan_id,
      }));
      return { data: subDistricts, loading: false };
    }

    return { data: [], loading: false, error: 'Failed to fetch sub-districts' };
  }
}

export const coverageApiService = new CoverageApiService();
export default coverageApiService;
