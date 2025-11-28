/**
 * Payment Usage Examples
 * Examples of how to use the new server payment service
 */

import paymentGatewayService from '../services/payment/paymentGatewayService';
import serverPaymentService from '../services/payment/serverPaymentService';
import { PaymentMethod } from '../services/payment/paymentGatewayConfig';

/**
 * Example: Create payment using your server API
 * This replaces the hardcoded localhost:3001 call
 */
export async function createPaymentWithServerAPI() {
  try {
    // Your server will handle the payment creation
    const paymentResult = await paymentGatewayService.createPayment({
      orderId: '15', // Order ID from your curl example
      amount: 82000, // Amount from your curl example
      paymentMethod: 'EWALLET', // or 'VIRTUAL_ACCOUNT', 'QRIS'
      customerName: 'Test User',
      customerEmail: '14@test.com', // User ID 14 from your curl example
      customerPhone: '+628123456789',
      description: 'Test payment 15',
    }, 'SERVER', {
      provider: 'Xendit', // Your server will use Xendit
      channel: 'ewallet', // Payment channel from your curl example
    });

    console.log('Payment created successfully:', paymentResult);

    return {
      success: true,
      paymentData: paymentResult,
      message: 'Payment created via server API'
    };
  } catch (error: any) {
    console.error('Payment creation failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create payment via server API'
    };
  }
}

/**
 * Example: Direct server payment service call
 * This is equivalent to your curl command
 */
export async function directServerPaymentCall() {
  try {
    // This matches your curl example exactly
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

    const response = await serverPaymentService.createPayment(paymentData);

    console.log('Direct server payment response:', response);

    return response;
  } catch (error: any) {
    console.error('Direct server payment failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Check payment status via your server
 */
export async function checkPaymentStatus(paymentId: string) {
  try {
    const status = await serverPaymentService.getPaymentStatus(paymentId);

    console.log('Payment status:', status);

    return status;
  } catch (error: any) {
    console.error('Failed to check payment status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Get payment history for a user
 */
export async function getUserPaymentHistory(userId: number = 14) {
  try {
    const history = await serverPaymentService.getUserPayments(userId, 20);

    console.log('User payment history:', history);

    return history;
  } catch (error: any) {
    console.error('Failed to get payment history:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Show current server configuration
 */
export function showServerConfiguration() {
  const serverURL = serverPaymentService.getServerURL();

  console.log('Server Configuration:');
  console.log('Server URL:', serverURL);
  console.log('Expected API endpoint:', `${serverURL}/api/v1/payments`);

  return {
    serverURL,
    apiEndpoint: `${serverURL}/api/v1/payments`,
    message: `Your payments will be routed to ${serverURL}/api/v1/payments instead of localhost:3001`
  };
}

// Export all examples for easy testing
export const paymentExamples = {
  createWithServer: createPaymentWithServerAPI,
  directCall: directServerPaymentCall,
  checkStatus: checkPaymentStatus,
  getHistory: getUserPaymentHistory,
  showConfig: showServerConfiguration,
};

export default paymentExamples;