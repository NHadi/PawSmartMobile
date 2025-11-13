/**
 * KiriminAja Debug Utilities
 * Helper functions to debug and test KiriminAja API integration
 */

import kiriminAjaService from '../services/shipping/kiriminAjaService';

/**
 * Test KiriminAja API connection and fetch active couriers
 */
export async function testKiriminAjaConnection() {
  console.log('\n=== TESTING KIRIMINAJA API CONNECTION ===');

  try {
    const result = await kiriminAjaService.testConnection();

    console.log('Connection Status:', result.connected ? '✅ Connected' : '❌ Failed');
    console.log('Message:', result.message);

    if (result.courierCount) {
      console.log(`Active Couriers Available: ${result.courierCount}`);

      // Get detailed courier list
      const couriers = await kiriminAjaService.getActiveCouriers();
      if (couriers.status) {
        console.log('\nActive Couriers:');
        couriers.datas.forEach((courier, index) => {
          console.log(`  ${index + 1}. ${courier.name} (${courier.code}) - ${courier.type}`);
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { connected: false, message: 'Test failed' };
  }
}

/**
 * Test shipping rates with sample data
 */
export async function testShippingRates() {
  console.log('\n=== TESTING SHIPPING RATES ===');

  // Sample test data (Menteng to Cilodong like in your logs)
  const testRequest = {
    origin: 151, // Menteng district ID
    destination: 456, // Cilodong district ID
    weight: 1000, // 1kg
    insurance: 0 as 0 | 1,
  };

  console.log('Test Request:', testRequest);

  try {
    const result = await kiriminAjaService.getShippingRates(testRequest);

    console.log('\nAPI Response:');
    console.log('Status:', result.status);
    console.log('Method:', result.method);
    console.log('Message:', result.text);
    console.log('Results Count:', result.results?.length || 0);

    if (result.results && result.results.length > 0) {
      console.log('\nAvailable Services:');
      result.results.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.service_name} - Rp${service.cost} (${service.etd} days)`);
      });
    }

    return result;
  } catch (error) {
    console.error('Shipping rates test failed:', error);
    return null;
  }
}

/**
 * Test instant rates with sample coordinates
 */
export async function testInstantRates() {
  console.log('\n=== TESTING INSTANT RATES ===');

  // Sample test coordinates (Jakarta area)
  const testRequest = {
    origin: {
      lat: -6.2088,
      long: 106.8456,
    },
    destination: {
      lat: -6.4297039,
      long: 106.820653,
    },
    weight: 1000,
    timezone: 'Asia/Jakarta',
  };

  console.log('Test Request:', testRequest);

  try {
    const result = await kiriminAjaService.getInstantRates(testRequest);

    console.log('\nAPI Response:');
    console.log('Status:', result.status);
    console.log('Method:', result.method);
    console.log('Message:', result.text);
    console.log('Results Count:', result.results?.length || 0);

    if (result.results && result.results.length > 0) {
      console.log('\nAvailable Instant Services:');
      result.results.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.service_name} - Rp${service.cost} (${service.etd} days)`);
      });
    }

    return result;
  } catch (error) {
    console.error('Instant rates test failed:', error);
    return null;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🔍 Starting KiriminAja API Debug Tests...\n');

  // Test 1: Connection
  const connectionResult = await testKiriminAjaConnection();

  if (!connectionResult.connected) {
    console.log('\n❌ Connection failed. Skipping shipping rate tests.');
    return;
  }

  // Test 2: Shipping Price API test
  console.log('\n=== TESTING SHIPPING PRICE API ===');
  const priceTest = await kiriminAjaService.testShippingPriceAPI();
  console.log('Price Test Result:', priceTest);

  // Test 3: Shipping rates
  await testShippingRates();

  // Test 4: Instant rates
  await testInstantRates();

  console.log('\n✅ All tests completed!');
}

/**
 * Debug specific route
 */
export async function debugRoute(originId: number, destinationId: number, weight: number = 1000) {
  console.log(`\n=== DEBUGGING ROUTE: ${originId} → ${destinationId} (${weight}g) ===`);

  const request = {
    origin: originId,
    destination: destinationId,
    weight,
    insurance: 0 as 0 | 1,
  };

  try {
    const result = await kiriminAjaService.getShippingRates(request);

    console.log('\nDebug Results:');
    console.log('- API Status:', result.status);
    console.log('- API Message:', result.text);
    console.log('- Results Count:', result.results?.length || 0);

    if (result.details) {
      console.log('- Origin District:', result.details.origin_district_id);
      console.log('- Destination District:', result.details.destination_district_id);
      console.log('- Weight Used:', result.details.weight);
      console.log('- Available Expeditions:', result.details.expeditions?.join(', ') || 'None');
    }

    return result;
  } catch (error) {
    console.error('Debug route failed:', error);
    return null;
  }
}

// Export for use in components or debug screens
export default {
  testKiriminAjaConnection,
  testShippingRates,
  testInstantRates,
  runAllTests,
  debugRoute,
};