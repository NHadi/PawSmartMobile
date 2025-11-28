/**
 * Server Payment Service
 * Handles payment API calls to your server (http://43.157.209.126:3001/api/v1/payments)
 */

import standaloneClient from '../api/standaloneClient';
import config from '../../config/environment';

export interface ServerPaymentRequest {
  order_id: number;
  user_id: number;
  payment_method: string;
  payment_provider: string;
  payment_channel: string;
  amount: number;
  external_id: string;
  notes?: string;
}

export interface ServerPaymentResponse {
  success: boolean;
  data?: {
    payment_id: string;
    status: string;
    payment_url?: string;
    qr_string?: string;
    account_number?: string;
    bank_code?: string;
    expires_at?: string;
    amount: number;
    fees?: number;
  };
  message?: string;
  error?: string;
}

class ServerPaymentService {
  /**
   * Create payment via your server API
   */
  async createPayment(paymentData: ServerPaymentRequest): Promise<ServerPaymentResponse> {
    try {
      console.log('[ServerPaymentService] Creating payment with data:', paymentData);

      const response = await standaloneClient.post('/payments', paymentData);

      console.log('[ServerPaymentService] Payment created successfully:', response);

      // Handle different response formats
      if (response.success || response.data) {
        return {
          success: true,
          data: response.data || response,
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('[ServerPaymentService] Payment creation failed:', error);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Check payment status via your server API
   */
  async getPaymentStatus(paymentId: string): Promise<{
    success: boolean;
    status: string;
    isPaid: boolean;
    paymentData?: any;
    message?: string;
  }> {
    try {
      console.log('[ServerPaymentService] Checking payment status for:', paymentId);

      const response = await standaloneClient.get(`/payments/${paymentId}/status`);

      console.log('[ServerPaymentService] Payment status response:', response);

      const isPaid = response.status === 'PAID' ||
                    response.status === 'COMPLETED' ||
                    response.status === 'SUCCEEDED';

      return {
        success: true,
        status: response.status,
        isPaid,
        paymentData: response,
      };
    } catch (error: any) {
      console.error('[ServerPaymentService] Failed to check payment status:', error);

      return {
        success: false,
        status: 'ERROR',
        isPaid: false,
        message: error.response?.data?.message || error.message || 'Failed to check payment status',
      };
    }
  }

  /**
   * Cancel payment via your server API
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('[ServerPaymentService] Cancelling payment:', paymentId);

      const response = await standaloneClient.post(`/payments/${paymentId}/cancel`, {
        reason: reason || 'User requested cancellation'
      });

      console.log('[ServerPaymentService] Payment cancelled successfully:', response);

      return {
        success: true,
        message: response.message || 'Payment cancelled successfully',
      };
    } catch (error: any) {
      console.error('[ServerPaymentService] Failed to cancel payment:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to cancel payment',
      };
    }
  }

  /**
   * Get payment history for a user
   */
  async getUserPayments(userId: number, limit: number = 20): Promise<{
    success: boolean;
    payments: any[];
    message?: string;
  }> {
    try {
      console.log('[ServerPaymentService] Getting payment history for user:', userId);

      const response = await standaloneClient.get(`/payments/user/${userId}`, {
        params: { limit }
      });

      console.log('[ServerPaymentService] Retrieved user payments:', response);

      return {
        success: true,
        payments: Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []),
      };
    } catch (error: any) {
      console.error('[ServerPaymentService] Failed to get user payments:', error);

      return {
        success: false,
        payments: [],
        message: error.response?.data?.message || error.message || 'Failed to get payment history',
      };
    }
  }

  /**
   * Get server base URL for reference
   */
  getServerURL(): string {
    return config.STANDALONE_API.BASE_URL;
  }

  /**
   * Helper method to create payment data from order data
   */
  createPaymentDataFromOrder(
    orderId: number,
    userId: number,
    amount: number,
    paymentMethod: string,
    paymentProvider: string = 'Xendit',
    paymentChannel: string = 'ewallet'
  ): ServerPaymentRequest {
    return {
      order_id: orderId,
      user_id: userId,
      payment_method: paymentMethod,
      payment_provider: paymentProvider,
      payment_channel: paymentChannel,
      amount,
      external_id: `pay_test_${orderId}_${Date.now()}`,
      notes: `Payment for order ${orderId}`,
    };
  }
}

export default new ServerPaymentService();