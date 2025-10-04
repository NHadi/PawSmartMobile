/**
 * Manual District ID Mapping for KiriminAja
 * Maps Indonesian districts to KiriminAja district IDs
 * This is a fallback when the API search-location endpoint is unavailable
 */

export interface DistrictMapping {
  district: string;
  city: string;
  province: string;
  district_id: number;
  city_id?: number;
  province_id?: number;
}

// Common districts in Greater Jakarta area
// These IDs need to be verified with actual KiriminAja API responses
export const DISTRICT_MAPPINGS: DistrictMapping[] = [
  // Depok, Jawa Barat
  { district: 'Cilodong', city: 'Depok', province: 'Jawa Barat', district_id: 0, city_id: 0, province_id: 9 },
  { district: 'Beji', city: 'Depok', province: 'Jawa Barat', district_id: 0, city_id: 0, province_id: 9 },
  { district: 'Pancoran Mas', city: 'Depok', province: 'Jawa Barat', district_id: 0, city_id: 0, province_id: 9 },
  { district: 'Sukmajaya', city: 'Depok', province: 'Jawa Barat', district_id: 0, city_id: 0, province_id: 9 },

  // Jakarta Selatan
  { district: 'Kebayoran Baru', city: 'Jakarta Selatan', province: 'DKI Jakarta', district_id: 0, city_id: 0, province_id: 6 },
  { district: 'Cilandak', city: 'Jakarta Selatan', province: 'DKI Jakarta', district_id: 0, city_id: 0, province_id: 6 },
  { district: 'Jagakarsa', city: 'Jakarta Selatan', province: 'DKI Jakarta', district_id: 0, city_id: 0, province_id: 6 },
];

/**
 * Find district ID by district and city names
 */
export function findDistrictId(district: string, city: string, province?: string): DistrictMapping | null {
  const normalizeString = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, ' ');

  const normalizedDistrict = normalizeString(district);
  const normalizedCity = normalizeString(city);
  const normalizedProvince = province ? normalizeString(province) : null;

  // Try exact match first
  let match = DISTRICT_MAPPINGS.find(m =>
    normalizeString(m.district) === normalizedDistrict &&
    normalizeString(m.city) === normalizedCity
  );

  // If province provided, try matching with province too
  if (!match && normalizedProvince) {
    match = DISTRICT_MAPPINGS.find(m =>
      normalizeString(m.district) === normalizedDistrict &&
      normalizeString(m.city) === normalizedCity &&
      normalizeString(m.province) === normalizedProvince
    );
  }

  // Try partial match on district name
  if (!match) {
    match = DISTRICT_MAPPINGS.find(m =>
      normalizeString(m.district).includes(normalizedDistrict) ||
      normalizedDistrict.includes(normalizeString(m.district))
    );
  }

  return match || null;
}

/**
 * Add a new district mapping (can be called after successful API lookups)
 */
export function addDistrictMapping(mapping: DistrictMapping): void {
  const existing = findDistrictId(mapping.district, mapping.city, mapping.province);
  if (!existing) {
    DISTRICT_MAPPINGS.push(mapping);
    console.log('✅ Added new district mapping:', mapping);
  }
}
