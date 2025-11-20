/**
 * Test script to verify Flip e-wallet code mapping
 * This can be run in development to verify the fix works correctly
 */

import { mapToFlipEwalletCode, validateFlipEwalletCode, VALID_FLIP_EWALLET_CODES } from '../services/payment/flipPaymentGateway';

// Test cases for mapping Xendit codes to Flip codes (based on Flip API docs)
const testCases = [
  { input: 'ID_GOJEK', expected: 'gopay', description: 'Xendit GoPay code' },
  { input: 'ID_DANA', expected: 'dana', description: 'Xendit DANA code' },
  { input: 'ID_OVO', expected: 'ovo', description: 'Xendit OVO code' },
  { input: 'ID_SHOPEEPAY', expected: 'shopeepay_app', description: 'Xendit ShopeePay code' },
  { input: 'ID_LINKAJA', expected: 'linkaja', description: 'Xendit LinkAja code' },
  { input: 'gopay', expected: 'gopay', description: 'Already correct Flip code' },
  { input: 'dana', expected: 'dana', description: 'Simple name conversion' },
  { input: 'ovo', expected: 'ovo', description: 'Simple name conversion' },
  { input: 'shopeepay', expected: 'shopeepay_app', description: 'ShopeePay special case' },
  { input: 'linkaja', expected: 'linkaja', description: 'Simple name conversion' },
  { input: 'qris', expected: 'qris', description: 'QRIS code' },
  { input: 'unknown', expected: 'ovo', description: 'Unknown code fallback' },
];

export function runEwalletMappingTests() {
  console.log('🧪 Testing Flip E-Wallet Code Mapping\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    try {
      const result = mapToFlipEwalletCode(testCase.input);
      if (result === testCase.expected) {
        console.log(`✅ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" → Output: "${result}" ✓`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" → Expected: "${testCase.expected}" → Got: "${result}"`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 Test ${index + 1}: ${testCase.description} - Error: ${error}`);
      failed++;
    }
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  // Test validation
  console.log('🔒 Testing Validation\n');
  VALID_FLIP_EWALLET_CODES.forEach(code => {
    try {
      validateFlipEwalletCode(code);
      console.log(`✅ Valid code: ${code}`);
    } catch (error) {
      console.log(`❌ Should be valid but failed: ${code} - ${error}`);
      failed++;
    }
  });

  // Test invalid codes
  const invalidCodes = ['gopay', 'ID_GOJEK', 'invalid_wallet', ''];
  invalidCodes.forEach(code => {
    try {
      validateFlipEwalletCode(code);
      console.log(`❌ Should be invalid but passed: ${code}`);
      failed++;
    } catch (error) {
      console.log(`✅ Correctly rejected invalid code: ${code}`);
    }
  });

  console.log(`\n🎯 Final Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Test the specific error case that was reported
 */
export function testOriginalErrorCase() {
  console.log('\n🐛 Testing Original Error Case\n');

  const originalInput = 'gopay'; // This was causing the validation error
  const expectedOutput = 'gopay'; // This is what it should become (no _app suffix)

  try {
    const result = mapToFlipEwalletCode(originalInput);
    console.log(`Original error case: "${originalInput}" → "${result}"`);

    if (result === expectedOutput) {
      console.log('✅ Original error case is now FIXED!');
      validateFlipEwalletCode(result);
      console.log('✅ Mapped code passes validation');
      return true;
    } else {
      console.log(`❌ Expected "${expectedOutput}" but got "${result}"`);
      return false;
    }
  } catch (error) {
    console.log(`💥 Original error case still fails: ${error}`);
    return false;
  }
}

/**
 * Test the OVO case that was failing
 */
export function testOVOCase() {
  console.log('\n🎯 Testing OVO Case (Recent Error)\n');

  const originalInput = 'ID_OVO'; // This was causing the validation error
  const expectedOutput = 'ovo'; // This is what it should become

  try {
    const result = mapToFlipEwalletCode(originalInput);
    console.log(`OVO error case: "${originalInput}" → "${result}"`);

    if (result === expectedOutput) {
      console.log('✅ OVO error case is now FIXED!');
      validateFlipEwalletCode(result);
      console.log('✅ Mapped code passes validation');
      return true;
    } else {
      console.log(`❌ Expected "${expectedOutput}" but got "${result}"`);
      return false;
    }
  } catch (error) {
    console.log(`💥 OVO error case still fails: ${error}`);
    return false;
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && module.hot === undefined) {
  runEwalletMappingTests();
  testOriginalErrorCase();
}