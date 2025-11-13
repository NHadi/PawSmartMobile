/**
 * KiriminAja Courier Groups Example
 * Demonstrates how to use the courier groups functionality
 */

import kiriminAjaService, { CourierGroup } from '../services/shipping/kiriminAjaService';

// Example 1: Get all courier groups
function getAllCourierGroups() {
  const groups = kiriminAjaService.getCourierGroups();

  console.log('=== KiriminAja Courier Groups ===');
  console.log('Status:', groups.status);
  console.log('Method:', groups.method);
  console.log('Message:', groups.text);
  console.log('Total groups:', groups.datas.length);

  groups.datas.forEach((group: CourierGroup, index: number) => {
    console.log(`${index + 1}. ${group.name} (${group.code})`);
  });

  return groups;
}

// Example 2: Get specific courier group
function getCourierGroup(code: string) {
  const group = kiriminAjaService.getCourierGroupByCode(code);

  if (group) {
    console.log(`Found group: ${group.name} with code: ${group.code}`);
  } else {
    console.log(`Group with code "${code}" not found`);
  }

  return group;
}

// Example 3: Validate courier group code
function validateCourierGroup(code: string) {
  const isValid = kiriminAjaService.isValidCourierGroup(code);

  console.log(`Is "${code}" a valid courier group? ${isValid ? 'Yes' : 'No'}`);

  return isValid;
}

// Example 4: Get all available codes
function getAvailableCodes() {
  const codes = kiriminAjaService.getCourierGroupCodes();

  console.log('Available courier group codes:', codes.join(', '));

  return codes;
}

// Example 5: Group shipping services by courier group
function groupShippingServices(services: any[]) {
  const grouped = kiriminAjaService.groupServicesByGroup(services);

  console.log('=== Grouped Shipping Services ===');

  Object.entries(grouped).forEach(([groupCode, groupServices]) => {
    const group = kiriminAjaService.getCourierGroupByCode(groupCode);
    const groupName = group ? group.name : groupCode;

    console.log(`\n${groupName} (${groupServices.length} services):`);

    groupServices.forEach((service: any, index: number) => {
      console.log(`  ${index + 1}. ${service.service_name} - Rp${service.cost}`);
    });
  });

  return grouped;
}

// Export examples for use in components
export {
  getAllCourierGroups,
  getCourierGroup,
  validateCourierGroup,
  getAvailableCodes,
  groupShippingServices
};

// Example usage:
/*
// Get all groups
const allGroups = getAllCourierGroups();

// Check if "same_day" is valid
const isSameDayValid = validateCourierGroup('same_day');

// Get the "regular" group details
const regularGroup = getCourierGroup('regular');

// Group some shipping services
const mockServices = [
  { service_name: 'JNE Regular', cost: '15000', group: 'regular' },
  { service_name: 'SiCepat Same Day', cost: '25000', group: 'same_day' },
  { service_name: 'J&T Cargo', cost: '50000', group: 'cargo' }
];
const groupedServices = groupShippingServices(mockServices);
*/