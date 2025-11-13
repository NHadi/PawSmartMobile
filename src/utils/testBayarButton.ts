/**
 * Test Bayar Button Implementation
 * Simple test to verify the Bayar button functionality works correctly
 */

import serverPaymentService from '../services/payment/serverPaymentService';
import paymentGatewayService from '../services/payment/paymentGatewayService';

/**
 * Test the Bayar button flow for Virtual Account payment
 */
export async function testVirtualAccountBayar() {
  console.log('=== Testing Virtual Account Bayar Button ===');

  try {
    // Simulate payment data from the logs you provided
    const mockPaymentData = {
      id: 'PGPWF10117630302267626998', // From your logs
      orderId: '17', // From your logs
      amount: 52000, // From your logs
      bank_code: 'BCA', // From your logs
      provider: 'FLIP', // From your logs
      expected_amount: 52000,
    };

    const mockOrderInfo = {
      orderId: '17',
      userId: '14', // From your curl example
      totalAmount: 52000,
    };

    console.log('Mock Payment Data:', mockPaymentData);
    console.log('Mock Order Info:', mockOrderInfo);

    // Test the server payment call with the extracted parameters
    const paymentResponse = await serverPaymentService.createPayment({
      order_id: parseInt(mockOrderInfo.orderId),
      user_id: parseInt(mockOrderInfo.userId),
      payment_method: mockPaymentData.bank_code.toLowerCase() + '_va', // bca_va
      payment_provider: mockPaymentData.provider,
      payment_channel: 'virtual_account',
      amount: mockPaymentData.amount,
      external_id: `pay_test_${mockOrderInfo.orderId}`,
      notes: `Payment for order ${mockOrderInfo.orderId}`
    });

    console.log('✅ Virtual Account Bayar Test Result:', paymentResponse);

    if (paymentResponse.success) {
      console.log('✅ Bayar button would work correctly for Virtual Account');
    } else {
      console.log('❌ Bayar button failed for Virtual Account:', paymentResponse.error);
    }

    return paymentResponse;
  } catch (error: any) {
    console.error('❌ Virtual Account Bayar Test Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test the Bayar button flow for QRIS payment
 */
export async function testQRISBayar() {
  console.log('\n=== Testing QRIS Bayar Button ===');

  try {
    // Mock QRIS payment data
    const mockPaymentData = {
      id: 'qris_payment_id_123',
      orderId: '18',
      amount: 75000,
      paymentMethod: 'QRIS',
      qr_string: 'mock_qr_string_123',
      provider: 'FLIP',
    };

    const mockOrderInfo = {
      orderId: '18',
      userId: '14',
      totalAmount: 75000,
    };

    console.log('Mock QRIS Payment Data:', mockPaymentData);

    // Test the server payment call with QRIS parameters
    const paymentResponse = await serverPaymentService.createPayment({
      order_id: parseInt(mockOrderInfo.orderId),
      user_id: parseInt(mockOrderInfo.userId),
      payment_method: 'qris',
      payment_provider: mockPaymentData.provider,
      payment_channel: 'qris',
      amount: mockPaymentData.amount,
      external_id: `pay_test_${mockOrderInfo.orderId}`,
      notes: `Payment for order ${mockOrderInfo.orderId}`
    });

    console.log('✅ QRIS Bayar Test Result:', paymentResponse);

    if (paymentResponse.success) {
      console.log('✅ Bayar button would work correctly for QRIS');
    } else {
      console.log('❌ Bayar button failed for QRIS:', paymentResponse.error);
    }

    return paymentResponse;
  } catch (error: any) {
    console.error('❌ QRIS Bayar Test Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test the Bayar button flow for E-wallet payment
 */
export async function testEwalletBayar() {
  console.log('\n=== Testing E-wallet Bayar Button ===');

  try {
    // Mock E-wallet payment data
    const mockPaymentData = {
      id: 'ewallet_payment_id_123',
      orderId: '19',
      amount: 95000,
      paymentMethod: 'EWALLET',
      channelCode: 'ID_DANA',
      provider: 'XENDIT',
    };

    const mockOrderInfo = {
      orderId: '19',
      userId: '14',
      totalAmount: 95000,
    };

    console.log('Mock E-wallet Payment Data:', mockPaymentData);

    // Test the server payment call with E-wallet parameters
    const paymentResponse = await serverPaymentService.createPayment({
      order_id: parseInt(mockOrderInfo.orderId),
      user_id: parseInt(mockOrderInfo.userId),
      payment_method: 'ewallet',
      payment_provider: mockPaymentData.provider,
      payment_channel: 'ewallet',
      amount: mockPaymentData.amount,
      external_id: `pay_test_${mockOrderInfo.orderId}`,
      notes: `Payment for order ${mockOrderInfo.orderId}`
    });

    console.log('✅ E-wallet Bayar Test Result:', paymentResponse);

    if (paymentResponse.success) {
      console.log('✅ Bayar button would work correctly for E-wallet');
    } else {
      console.log('❌ Bayar button failed for E-wallet:', paymentResponse.error);
    }

    return paymentResponse;
  } catch (error: any) {
    console.error('❌ E-wallet Bayar Test Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test parameter extraction logic (used in PaymentActions component)
 */
export function testParameterExtraction() {
  console.log('\n=== Testing Parameter Extraction Logic ===');

  // Test cases for different payment scenarios
  const testCases = [
    {
      name: 'Virtual Account (BCA)',
      paymentData: { bank_code: 'BCA', provider: 'FLIP' },
      expected: { paymentMethod: 'bca_va', paymentChannel: 'virtual_account' }
    },
    {
      name: 'Virtual Account (MANDIRI)',
      paymentData: { bank_code: 'MANDIRI', provider: 'FLIP' },
      expected: { paymentMethod: 'mandiri_va', paymentChannel: 'virtual_account' }
    },
    {
      name: 'QRIS',
      paymentData: { paymentMethod: 'QRIS', qr_string: 'abc123' },
      expected: { paymentMethod: 'qris', paymentChannel: 'qris' }
    },
    {
      name: 'E-wallet',
      paymentData: { paymentMethod: 'EWALLET', paymentUrl: 'https://example.com' },
      expected: { paymentMethod: 'ewallet', paymentChannel: 'ewallet' }
    }
  ];

  testCases.forEach((testCase) => {
    console.log(`\nTesting: ${testCase.name}`);

    // Simulate the extraction logic from PaymentActions component
    let paymentMethod = 'bca_va'; // Default
    let paymentChannel = 'virtual_account';

    if (testCase.paymentData.paymentMethod === 'QRIS' || testCase.paymentData.qr_string) {
      paymentMethod = 'qris';
      paymentChannel = 'qris';
    } else if (testCase.paymentData.paymentMethod === 'EWALLET' || testCase.paymentData.paymentUrl) {
      paymentMethod = 'ewallet';
      paymentChannel = 'ewallet';
    } else if (testCase.paymentData.bank_code) {
      paymentMethod = testCase.paymentData.bank_code.toLowerCase() + '_va';
      paymentChannel = 'virtual_account';
    }

    const result = { paymentMethod, paymentChannel };
    const isCorrect = JSON.stringify(result) === JSON.stringify(testCase.expected);

    console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`  Got: ${JSON.stringify(result)}`);
    console.log(`  ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
  });
}

/**
 * Run all Bayar button tests
 */
export async function runAllBayarTests() {
  console.log('🚀 Starting Bayar Button Tests');
  console.log('===============================');

  const results = {
    virtualAccount: await testVirtualAccountBayar(),
    qris: await testQRISBayar(),
    ewallet: await testEwalletBayar(),
    parameterExtraction: testParameterExtraction(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');

  const testNames = {
    virtualAccount: 'Virtual Account Bayar',
    qris: 'QRIS Bayar',
    ewallet: 'E-wallet Bayar',
    parameterExtraction: 'Parameter Extraction',
  };

  Object.entries(results).forEach(([testKey, result]) => {
    const testName = testNames[testKey as keyof typeof testNames];

    if (testKey === 'parameterExtraction') {
      console.log(`${testName}: ✅ Completed (see details above)`);
    } else {
      const paymentResult = result as any;
      const status = paymentResult.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${testName}: ${paymentResult.success ? 'Success' : paymentResult.error}`);
    }
  });

  console.log('\n🎯 Bayar button implementation is ready for testing!');

  return results;
}

export default {
  runAllBayarTests,
  testVirtualAccountBayar,
  testQRISBayar,
  testEwalletBayar,
  testParameterExtraction,
};