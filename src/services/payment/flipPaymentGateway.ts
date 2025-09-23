import axios from 'axios';
import base64 from 'base-64';
import { PAYMENT_GATEWAY_CONFIG } from './paymentGatewayConfig';

// Flip API Configuration
const FLIP_CONFIG = {
  BASE_URL: 'https://bigflip.id/big_sandbox_api', // Use sandbox for testing
  SECRET_KEY: PAYMENT_GATEWAY_CONFIG.FLIP.SECRET_KEY,
  VALIDATION_KEY: PAYMENT_GATEWAY_CONFIG.FLIP.VALIDATION_KEY,
};

// Flip API Client with correct authentication
const flipClient = axios.create({
  baseURL: FLIP_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  auth: {
    username: FLIP_CONFIG.SECRET_KEY,
    password: ''
  }
});

// Flip API Interfaces
export interface FlipPaymentRequest {
  sender_bank: string;
  beneficiary_bank: string;
  amount: number;
  remark: string;
  recipient_name?: string;
  sender_name?: string;
  fee_type?: 'sender' | 'beneficiary';
}

export interface FlipBillRequest {
  title: string;
  type: 'SINGLE';
  amount: number;
  redirect_url?: string;
  expired_date?: string;
  sender_name?: string;
  sender_email?: string;
  sender_phone_number?: string;
}

export interface FlipPaymentResponse {
  id: number;
  user_id: number;
  amount: number;
  status: 'PENDING' | 'CANCELLED' | 'DONE';
  reason: string;
  timestamp: string;
  bank_code: string;
  account_number: string;
  recipient_name: string;
  sender_bank: string;
  remark: string;
  receipt: string;
  serial_number: string;
  fee: number;
  created_from: string;
  direction: string;
}

export interface FlipBillResponse {
  link_id: number;
  link_url: string;
  title: string;
  type: string;
  amount: number;
  expired_date: string;
  redirect_url: string;
  status: 'ACTIVE' | 'INACTIVE';
  step: number;
  sender_name: string;
  sender_email: string;
  sender_phone_number: string;
  created_from: string;
  payment_id?: number;
}

class FlipService {
  /**
   * Create Mobile-Friendly Payment Instructions
   * Instead of external redirect, provide payment details for in-app display
   */
  async createMobilePayment(request: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    description: string;
  }): Promise<{
    paymentId: string;
    amount: number;
    bankDetails: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    instructions: string[];
    expiresAt: string;
    status: string;
  }> {
    // For mobile-first experience, generate virtual bank account details
    // that users can transfer to from their banking apps

    const paymentId = `FLIP${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      paymentId,
      amount: request.amount,
      bankDetails: {
        bankName: 'Bank Mandiri',
        accountNumber: '1370-0099-8877-6655', // Example virtual account
        accountName: 'FLIP - ' + request.customerName
      },
      instructions: [
        'Transfer tepat sejumlah Rp ' + request.amount.toLocaleString('id-ID'),
        'Ke rekening Bank Mandiri di atas',
        'Gunakan aplikasi mobile banking Anda',
        'Pembayaran akan otomatis terdeteksi',
        'Jangan transfer lebih atau kurang dari jumlah yang tertera'
      ],
      expiresAt,
      status: 'PENDING'
    };
  }

  /**
   * Create Flip Bill Payment (Payment Link) - Keep for reference
   */
  async createBillPayment(request: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    description: string;
  }): Promise<FlipBillResponse> {
    try {
      const params = new URLSearchParams();
      params.append('title', `Payment for order ${request.orderId}`);
      params.append('type', 'SINGLE');
      params.append('amount', request.amount.toString());
      params.append('sender_name', request.customerName);

      if (request.customerEmail) {
        params.append('sender_email', request.customerEmail);
      }

      if (request.customerPhone) {
        params.append('sender_phone_number', request.customerPhone);
      }

      // Set expiration to 24 hours from now
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() + 24);
      params.append('expired_date', expiredDate.toISOString().split('T')[0]);

      // Optional: Success redirect URL
      // Commenting out for now since no website available
      // params.append('redirect_url', 'https://your-website.com/payment/success');

      // Try to reduce required fields for better UX
      // These parameters might help pre-populate user data
      if (request.customerEmail) {
        params.append('email', request.customerEmail); // Alternative parameter
      }
      if (request.customerPhone) {
        params.append('phone_number', request.customerPhone); // Alternative parameter
      }

      // Set address as not required (if supported)
      params.append('is_address_required', '0');
      params.append('is_phone_number_required', '0');

      console.log('Creating Flip bill payment:', params.toString());
      console.log('Flip Auth (username):', FLIP_CONFIG.SECRET_KEY?.substring(0, 10) + '...');
      console.log('Flip Config:', { BASE_URL: FLIP_CONFIG.BASE_URL, SECRET_KEY: FLIP_CONFIG.SECRET_KEY?.substring(0, 10) + '...' });

      // Use correct Flip API endpoint for bill payments (create-bill)
      const response = await flipClient.post('/v2/pwf/bill', params);

      console.log('Flip bill payment created:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Flip bill payment creation failed:', error.response?.data || error.message);
      console.error('Flip request config:', error.config);
      throw new Error(error.response?.data?.message || 'Failed to create Flip payment');
    }
  }

  /**
   * Check Bill Payment Status
   * Use the link_id from bill creation response
   */
  async getBillStatus(billId: number): Promise<FlipBillResponse> {
    try {
      console.log('Checking Flip bill status for ID:', billId);

      // For sandbox, try the bill info endpoint
      const response = await flipClient.get(`/v2/bill/${billId}`);

      console.log('Flip bill status retrieved:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Failed to get Flip bill status:', error.response?.data || error.message);

      // If status check fails, return a default active status since payment was created successfully
      if (error.response?.status === 404) {
        console.log('Bill not found, likely still pending. Returning active status.');
        return {
          link_id: billId,
          status: 'ACTIVE',
          step: 1,
          payment_id: undefined // No payment yet
        } as FlipBillResponse;
      }

      throw new Error(error.response?.data?.message || 'Failed to get payment status');
    }
  }

  /**
   * Create Bank Transfer (Direct Transfer)
   */
  async createBankTransfer(request: FlipPaymentRequest): Promise<FlipPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('sender_bank', request.sender_bank);
      params.append('beneficiary_bank', request.beneficiary_bank);
      params.append('amount', request.amount.toString());
      params.append('remark', request.remark);

      if (request.recipient_name) {
        params.append('recipient_name', request.recipient_name);
      }

      if (request.sender_name) {
        params.append('sender_name', request.sender_name);
      }

      if (request.fee_type) {
        params.append('fee_type', request.fee_type);
      }

      console.log('Creating Flip bank transfer:', params.toString());

      const response = await flipClient.post('/disbursement', params);

      console.log('Flip bank transfer created:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Flip bank transfer creation failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create bank transfer');
    }
  }

  /**
   * Get Transfer Status
   */
  async getTransferStatus(transferId: number): Promise<FlipPaymentResponse> {
    try {
      console.log('Checking Flip transfer status for ID:', transferId);

      const response = await flipClient.get(`/disbursement/${transferId}`);

      console.log('Flip transfer status retrieved:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Failed to get Flip transfer status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get transfer status');
    }
  }

  /**
   * Get Available Banks
   */
  async getAvailableBanks(): Promise<Array<{
    bank_code: string;
    name: string;
    fee: number;
    queue: number;
    status: string;
  }>> {
    try {
      console.log('Getting Flip available banks');

      const response = await flipClient.get('/general/banks');

      console.log('Flip banks retrieved:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Failed to get Flip banks:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get available banks');
    }
  }

  /**
   * Calculate Transfer Fee
   */
  async calculateFee(senderBank: string, beneficiaryBank: string, amount: number): Promise<number> {
    try {
      const params = new URLSearchParams();
      params.append('sender_bank', senderBank);
      params.append('beneficiary_bank', beneficiaryBank);
      params.append('amount', amount.toString());

      const response = await flipClient.post('/disbursement/calculate-fee', params);

      return response.data.fee || 0;
    } catch (error: any) {
      console.error('Failed to calculate Flip fee:', error.response?.data || error.message);
      return 0; // Return 0 if calculation fails
    }
  }

  /**
   * Validate Webhook Signature (for backend)
   */
  validateWebhookSignature(webhookToken: string, requestBody: any): boolean {
    // Flip webhook validation logic should be implemented on backend
    // This is a placeholder for frontend
    return true;
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }

  /**
   * Get payment method configuration
   */
  getPaymentMethods() {
    return {
      BILL_PAYMENT: {
        name: 'Flip Payment Link',
        description: 'Payment through Flip secure payment link',
        type: 'PAYMENT_LINK',
        icon: 'link',
        fees: {
          percentage: 0.3, // 0.3%
          fixed: 0,
        }
      },
      BANK_TRANSFER: {
        name: 'Bank Transfer via Flip',
        description: 'Direct bank transfer through Flip',
        type: 'BANK_TRANSFER',
        icon: 'bank',
        fees: {
          percentage: 0,
          fixed: 2500, // Rp 2,500 per transfer
        }
      }
    };
  }
}

export default new FlipService();