import axios from 'axios';
import base64 from 'base-64';
import {
  PAYMENT_GATEWAY_CONFIG,
  PaymentStatus,
  PaymentMethod,
  EwalletChannel,
  VirtualAccountBank
} from './paymentGatewayConfig';

// Base64 encode for Basic Auth
const getAuthHeader = () => {
  const auth = base64.encode(`${PAYMENT_GATEWAY_CONFIG.SECRET_KEY}:`);
  return `Basic ${auth}`;
};

// Payment Gateway API Client
const paymentClient = axios.create({
  baseURL: PAYMENT_GATEWAY_CONFIG.BASE_URL,
  headers: {
    'Authorization': getAuthHeader(),
    'Content-Type': 'application/json',
  },
});

// Interfaces
export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface QRISPaymentResponse {
  id: string;
  reference_id: string;
  business_id: string;
  currency: string;
  amount: number;
  channel_code: string;
  qr_string: string;
  expires_at: string;
  status: PaymentStatus;
  created: string;
  updated: string;
}

export interface EwalletPaymentResponse {
  id: string;
  business_id: string;
  reference_id: string;
  status: PaymentStatus;
  currency: string;
  charge_amount: number;
  capture_amount: number;
  checkout_method: string;
  channel_code: EwalletChannel;
  channel_properties: {
    mobile_number?: string;
    success_redirect_url: string;
  };
  actions: {
    desktop_web_checkout_url?: string;
    mobile_web_checkout_url?: string;
    mobile_deeplink_checkout_url?: string;
    qr_checkout_string?: string;
  };
  is_redirect_required: boolean;
  created: string;
  updated: string;
}

export interface VirtualAccountResponse {
  id: string;
  external_id: string;
  owner_id: string;
  bank_code: VirtualAccountBank;
  merchant_code: string;
  name: string;
  account_number: string;
  is_closed: boolean;
  expected_amount: number;
  expiration_date: string;
  is_single_use: boolean;
  status: string;
  currency: string;
  created: string;
  updated: string;
}

class PaymentGatewayService {
  /**
   * Create QRIS Payment
   */
  async createQRISPayment(request: CreatePaymentRequest): Promise<QRISPaymentResponse> {
    try {
      // Creating QRIS payment
      
      // Validate and ensure minimum amount for QRIS payments
      const amount = Math.round(Number(request.amount));
      const minimumAmount = 1000; // Xendit minimum for QRIS
      const finalAmount = Math.max(minimumAmount, amount);
      
      if (amount < minimumAmount) {
        }
      
      const payload = {
        external_id: `qris_${request.orderId}_${Date.now()}`,
        reference_id: request.orderId,
        type: 'DYNAMIC',
        currency: 'IDR',
        amount: finalAmount, // Use validated amount
        channel_code: PAYMENT_GATEWAY_CONFIG.PAYMENT_METHODS.QRIS.channelCode,
        callback_url: PAYMENT_GATEWAY_CONFIG.CALLBACKS.WEBHOOK_URL || 'https://your-server.com/api/xendit/webhook',
        expires_at: new Date(
          Date.now() + PAYMENT_GATEWAY_CONFIG.PAYMENT_METHODS.QRIS.expiryMinutes * 60000
        ).toISOString(),
        metadata: {
          customer_name: request.customerName,
          customer_email: request.customerEmail,
          customer_phone: request.customerPhone,
          description: request.description,
        },
      };

      // Sending QRIS request
      
      const response = await paymentClient.post('/qr_codes', payload);
      
      // QRIS payment created successfully
      
      // Important: Different dashboard URLs for test vs live mode
      const isTestMode = PAYMENT_GATEWAY_CONFIG.SECRET_KEY?.startsWith('xnd_development_');
      if (isTestMode) {
        // TEST MODE: QRIS payment created
      } else {
        // LIVE MODE: QRIS payment created
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create QRIS payment');
    }
  }

  /**
   * Create E-Wallet Payment
   */
  async createEwalletPayment(
    request: CreatePaymentRequest,
    channelCode: EwalletChannel
  ): Promise<EwalletPaymentResponse> {
    try {
      // Validate required fields
      if (!request.orderId) {
        throw new Error('Order ID is required');
      }
      if (!request.amount || request.amount <= 0) {
        throw new Error('Valid amount is required');
      }
      if (!request.customerName) {
        throw new Error('Customer name is required');
      }

      // Format phone number properly (remove +62, add 62 prefix)
      let formattedPhone = request.customerPhone || '';
      if (formattedPhone) {
        // Remove any non-digits
        formattedPhone = formattedPhone.replace(/\D/g, '');
        // Add 62 prefix if it starts with 0
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '62' + formattedPhone.substring(1);
        }
        // Ensure it starts with 62
        if (!formattedPhone.startsWith('62')) {
          formattedPhone = '62' + formattedPhone;
        }
      }

      const payload = {
        reference_id: request.orderId,
        currency: 'IDR',
        amount: Math.round(Number(request.amount)), // Ensure it's an integer for IDR
        checkout_method: 'ONE_TIME_PAYMENT',
        channel_code: channelCode,
        channel_properties: {
          success_redirect_url: PAYMENT_GATEWAY_CONFIG.CALLBACKS.SUCCESS_REDIRECT_URL || 'https://yourapp.com/payment/success',
          failure_redirect_url: PAYMENT_GATEWAY_CONFIG.CALLBACKS.FAILURE_REDIRECT_URL || 'https://yourapp.com/payment/failure',
          ...(formattedPhone && { mobile_number: formattedPhone }),
        },
        metadata: {
          customer_name: request.customerName,
          customer_email: request.customerEmail || '',
          description: request.description || `Payment for order ${request.orderId}`,
        },
      };

      console.log('Creating e-wallet payment with payload:', JSON.stringify(payload, null, 2));

      const response = await paymentClient.post('/ewallets/charges', payload);

      console.log('E-wallet payment created successfully:', response.data.id);

      return response.data;
    } catch (error: any) {
      console.error('E-wallet payment creation failed:', error.response?.data || error.message);

      // Provide more specific error messages
      if (error.response?.data?.error_code) {
        const errorCode = error.response.data.error_code;
        const errorMessage = error.response.data.message;

        switch (errorCode) {
          case 'INVALID_JSON_FORMAT':
            throw new Error('Format data tidak valid. Silakan coba lagi.');
          case 'DUPLICATE_PAYMENT':
            throw new Error('Pembayaran dengan ID ini sudah ada.');
          case 'CHANNEL_UNAVAILABLE':
            throw new Error(`${channelCode} sedang tidak tersedia. Silakan pilih metode lain.`);
          default:
            throw new Error(errorMessage || 'Gagal membuat pembayaran e-wallet');
        }
      }

      throw new Error(error.response?.data?.message || 'Gagal membuat pembayaran e-wallet');
    }
  }

  /**
   * Create Virtual Account Payment
   */
  async createVirtualAccount(
    request: CreatePaymentRequest,
    bankCode: VirtualAccountBank
  ): Promise<VirtualAccountResponse> {
    try {
      // Creating Virtual Account payment
      
      // Validate and ensure minimum amount for VA payments
      const amount = Math.round(Number(request.amount));
      const minimumAmount = 10000; // VA typical minimum
      const finalAmount = Math.max(minimumAmount, amount);
      
      if (amount < minimumAmount) {
        }
      
      // Banks that don't support description field
      const banksWithoutDescription = ['BCA', 'MANDIRI'];
      
      const payload: any = {
        external_id: `va_${request.orderId}_${Date.now()}`,
        bank_code: bankCode,
        name: request.customerName.substring(0, 50), // Max 50 chars
        expected_amount: finalAmount, // Use validated amount
        is_closed: true, // Required when using expected_amount
        is_single_use: true,
        expiration_date: new Date(
          Date.now() + PAYMENT_GATEWAY_CONFIG.PAYMENT_METHODS.VIRTUAL_ACCOUNT.expiryMinutes * 60000
        ).toISOString(),
      };
      
      // Only add description for banks that support it
      if (!banksWithoutDescription.includes(bankCode) && request.description) {
        payload.description = request.description;
      }

      // Sending VA request
      
      const response = await paymentClient.post('/callback_virtual_accounts', payload);
      
      // VA created successfully
      
      // Log dashboard URL for testing
      const isTestMode = PAYMENT_GATEWAY_CONFIG.SECRET_KEY?.startsWith('xnd_development_');
      if (isTestMode) {
        // TEST MODE: VA created
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create virtual account');
    }
  }

  /**
   * Verify Payment in Dashboard (for debugging)
   */
  async verifyPaymentExists(paymentId: string): Promise<void> {
    try {
      // Try to fetch the payment
      const response = await paymentClient.get(`/qr_codes/${paymentId}`);
      
      if (response.data) {
        const isTestMode = PAYMENT_GATEWAY_CONFIG.SECRET_KEY?.startsWith('xnd_development_');
        if (isTestMode) {
          } else {
          }
      }
      } catch (error: any) {
      }
  }

  /**
   * Check Virtual Account Payment Status
   */
  async checkVAPaymentStatus(vaId: string): Promise<any> {
    try {
      // Checking VA payment status
      
      const response = await paymentClient.get(`/callback_virtual_accounts/${vaId}`);
      
      // VA status retrieved
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check VA status');
    }
  }

  /**
   * Check QRIS Payment Status
   */
  async checkQRISPaymentStatus(qrId: string): Promise<any> {
    try {
      // Checking QRIS payment status
      
      const response = await paymentClient.get(`/qr_codes/${qrId}`);
      
      // QRIS status retrieved
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check QRIS status');
    }
  }

  /**
   * Check E-Wallet Payment Status
   */
  async checkEwalletPaymentStatus(chargeId: string): Promise<any> {
    try {
      // Checking E-Wallet payment status
      
      const response = await paymentClient.get(`/ewallets/charges/${chargeId}`);
      
      // E-Wallet status retrieved
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check E-Wallet status');
    }
  }

  /**
   * Universal Payment Status Checker
   */
  async checkPaymentStatusUniversal(paymentId: string, paymentMethod: PaymentMethod): Promise<{
    isPaid: boolean;
    status: string;
    amount?: number;
    paidAmount?: number;
    paymentData?: any;
  }> {
    try {
      let paymentData: any;
      let isPaid = false;
      let status = 'UNKNOWN';
      let amount = 0;
      let paidAmount = 0;

      // Checking payment status

      switch (paymentMethod) {
        case 'QRIS':
          paymentData = await this.checkQRISPaymentStatus(paymentId);
          isPaid = paymentData.status === 'COMPLETED';
          status = paymentData.status;
          amount = paymentData.amount;
          paidAmount = isPaid ? paymentData.amount : 0;
          break;

        case 'VIRTUAL_ACCOUNT':
          paymentData = await this.checkVAPaymentStatus(paymentId);
          // VA is paid when it receives payment (has received_amount) or status is COMPLETED
          isPaid = paymentData.status === 'COMPLETED' || 
                   (paymentData.received_amount && paymentData.received_amount >= paymentData.expected_amount);
          status = paymentData.status;
          amount = paymentData.expected_amount;
          paidAmount = paymentData.received_amount || 0;
          break;

        case 'EWALLET':
          paymentData = await this.checkEwalletPaymentStatus(paymentId);
          isPaid = paymentData.status === 'SUCCEEDED' || paymentData.status === 'CAPTURED';
          status = paymentData.status;
          amount = paymentData.charge_amount;
          paidAmount = isPaid ? paymentData.capture_amount || paymentData.charge_amount : 0;
          break;

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      const result = {
        isPaid,
        status,
        amount,
        paidAmount,
        paymentData
      };

      // Payment check complete

      return result;
    } catch (error: any) {
      return {
        isPaid: false,
        status: 'ERROR',
        amount: 0,
        paidAmount: 0,
        paymentData: null
      };
    }
  }

  /**
   * Check and Update Payment for Any Method
   */
  async checkAndUpdatePayment(
    paymentId: string, 
    paymentMethod: PaymentMethod, 
    orderId: string,
    updateOrderCallback?: (orderId: string, isPaid: boolean, paymentData: any) => Promise<void>
  ): Promise<{ isPaid: boolean; status: string; updated?: boolean }> {
    try {
      const paymentResult = await this.checkPaymentStatusUniversal(paymentId, paymentMethod);
      
      // If payment is successful and we have a callback to update the order
      if (paymentResult.isPaid && updateOrderCallback) {
        try {
          await updateOrderCallback(orderId, true, paymentResult.paymentData);
          // Order status updated to paid
          return {
            ...paymentResult,
            updated: true
          };
        } catch (updateError) {
          }
      }

      return paymentResult;
    } catch (error: any) {
      return {
        isPaid: false,
        status: 'ERROR',
        updated: false
      };
    }
  }

  /**
   * Get Payment Status
   */
  async getPaymentStatus(paymentId: string, paymentType: PaymentMethod): Promise<any> {
    try {
      let endpoint = '';
      
      switch (paymentType) {
        case 'QRIS':
          endpoint = `/qr_codes/${paymentId}`;
          break;
        case 'EWALLET':
          endpoint = `/ewallets/charges/${paymentId}`;
          break;
        case 'VIRTUAL_ACCOUNT':
          endpoint = `/callback_virtual_accounts/${paymentId}`;
          break;
        default:
          throw new Error('Invalid payment type');
      }

      const response = await paymentClient.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get payment status');
    }
  }

  /**
   * Simulate Virtual Account Payment (Xendit Test Mode)
   * Based on official Xendit documentation
   */
  async simulateVAPayment(vaId: string, amount: number): Promise<any> {
    try {
      // Simulating VA payment
      
      // Official Xendit VA simulation endpoint
      const endpoint = `/pool_virtual_accounts/${vaId}/simulate_payment`;
      
      const payload = {
        amount: Math.round(amount), // Ensure it's an integer for IDR
      };

      // Sending simulation request
      
      const response = await paymentClient.post(endpoint, payload);
      
      // Simulation completed
      
      return response.data;
    } catch (error: any) {
      // VA simulation error (silenced)
      throw new Error(error.response?.data?.message || 'Failed to simulate VA payment');
    }
  }

  /**
   * Calculate payment fee
   */
  calculateFee(amount: number, paymentMethod: PaymentMethod): number {
    const feeConfig = PAYMENT_GATEWAY_CONFIG.FEES[paymentMethod];
    if (!feeConfig) return 0;

    const percentageFee = (amount * feeConfig.percentage) / 100;
    const totalFee = percentageFee + feeConfig.fixed;
    
    return Math.round(totalFee); // Round to nearest Rupiah
  }

  /**
   * Format Virtual Account number for display
   */
  formatVANumber(accountNumber: string): string {
    // Format: XXXX-XXXX-XXXX-XXXX
    return accountNumber.replace(/(\d{4})(?=\d)/g, '$1-');
  }

  /**
   * Generate QR Code URL from QR string
   */
  generateQRCodeURL(qrString: string): string {
    // Using a QR code generator service (you can also generate locally)
    const encodedQR = encodeURIComponent(qrString);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedQR}`;
  }

  /**
   * Validate webhook signature (for backend)
   */
  validateWebhookSignature(webhookId: string, webhookToken: string, requestBody: any): boolean {
    // This should be done on your backend server
    // The webhook token is sent in the x-callback-token header
    // You should validate it matches your configured webhook token
    
    // For now, just return true as this needs backend implementation
    // Note: Webhook validation should be done on backend
    return true;
  }
}

export default new PaymentGatewayService();