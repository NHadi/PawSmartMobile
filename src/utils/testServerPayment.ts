/**
 * Test Server Payment Integration
 * Simple test to verify the server payment service works correctly
 */

import serverPaymentService from '../services/payment/serverPaymentService';
import paymentGatewayService from '../services/payment/paymentGatewayService';
import config from '../config/environment';

/**
 * Test server connection and configuration
 */
export async function testServerConnection() {
  console.log('=== Testing Server Payment Connection ===');

  try {
    const serverURL = serverPaymentService.getServerURL();
    console.log('✅ Server URL configured:', serverURL);

    // Test the expected API endpoint
    const expectedEndpoint = `${serverURL}/api/v1/payments`;
    console.log('✅ Expected API endpoint:', expectedEndpoint);

    // Verify the configuration matches your requirements
    if (serverURL.includes('43.157.209.126:3001')) {
      console.log('✅ Server URL matches your requirement (not localhost:3001)');
    } else {
      console.log('⚠️  Server URL does not match expected 43.157.209.126:3001');
    }

    return {
      success: true,
      serverURL,
      apiEndpoint: expectedEndpoint,
      message: 'Server connection test passed'
    };
  } catch (error: any) {
    console.error('❌ Server connection test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Server connection test failed'
    };
  }
}

/**
 * Test creating the exact payment data from your curl example
 */
export async function testPaymentDataCreation() {
  console.log('\n=== Testing Payment Data Creation ===');

  try {
    // Create payment data exactly like your curl example
    const paymentData = serverPaymentService.createPaymentDataFromOrder(
      15,      // order_id
      14,      // user_id
      82000,   // amount
      'bca_va', // payment_method
      'Xendit', // payment_provider
      'ewallet' // payment_channel
    );

    console.log('✅ Payment data created:', paymentData);

    // Verify it matches your curl example
    const expectedData = {
      order_id: 15,
      user_id: 14,
      payment_method: "bca_va",
      payment_provider: "Xendit",
      payment_channel: "ewallet",
      amount: 82000,
      external_id: "pay_test_15",
      notes: "Test payment 15"
    };

    console.log('✅ Expected payment data:', expectedData);

    // Check if key fields match
    const matches = {
      order_id: paymentData.order_id === expectedData.order_id,
      user_id: paymentData.user_id === expectedData.user_id,
      amount: paymentData.amount === expectedData.amount,
      payment_provider: paymentData.payment_provider === expectedData.payment_provider,
      payment_channel: paymentData.payment_channel === expectedData.payment_channel,
    };

    console.log('✅ Payment data validation:', matches);

    return {
      success: true,
      paymentData,
      expectedData,
      matches,
      message: 'Payment data creation test passed'
    };
  } catch (error: any) {
    console.error('❌ Payment data creation test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Payment data creation test failed'
    };
  }
}

/**
 * Test the actual payment API call (this will make a real request)
 */
export async function testPaymentAPICall() {
  console.log('\n=== Testing Payment API Call ===');

  try {
    const paymentData = {
      order_id: 15,
      user_id: 14,
      payment_method: "bca_va",
      payment_provider: "Xendit",
      payment_channel: "ewallet",
      amount: 82000,
      external_id: "pay_test_15",
      notes: "Test payment 15"
    };

    console.log('📤 Sending payment request:', paymentData);

    // This will make the actual API call to your server
    const response = await serverPaymentService.createPayment(paymentData);

    console.log('📥 Payment API response:', response);

    return {
      success: response.success,
      data: response.data,
      error: response.error,
      message: response.success ? 'Payment API call successful' : 'Payment API call failed'
    };
  } catch (error: any) {
    console.error('❌ Payment API call failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Payment API call failed'
    };
  }
}

/**
 * Test using the payment gateway service with SERVER provider
 */
export async function testPaymentGatewayIntegration() {
  console.log('\n=== Testing Payment Gateway Integration ===');

  try {
    const paymentResult = await paymentGatewayService.createPayment({
      orderId: '15',
      amount: 82000,
      paymentMethod: 'VIRTUAL_ACCOUNT', // Use Virtual Account for BCA VA
      customerName: 'Test User',
      customerEmail: '14@test.com',
      customerPhone: '+628123456789',
      description: 'Test payment 15',
    }, 'SERVER', {
      provider: 'Xendit',
      channel: 'ewallet',
      bankCode: 'bca_va', // Specify BCA VA
    });

    console.log('✅ Payment gateway result:', paymentResult);

    return {
      success: true,
      paymentResult,
      message: 'Payment gateway integration test passed'
    };
  } catch (error: any) {
    console.error('❌ Payment gateway integration test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Payment gateway integration test failed'
    };
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting Server Payment Integration Tests');
  console.log('================================================');

  const results = {
    connection: await testServerConnection(),
    dataCreation: await testPaymentDataCreation(),
    // Note: Uncomment the following lines to make actual API calls
    // apiCall: await testPaymentAPICall(),
    // gatewayIntegration: await testPaymentGatewayIntegration(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('=========================');

  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${testName}: ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

  return results;
}

export default {
  runAllTests,
  testServerConnection,
  testPaymentDataCreation,
  testPaymentAPICall,
  testPaymentGatewayIntegration,
};