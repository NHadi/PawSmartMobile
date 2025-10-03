import axios from 'axios';
import base64 from 'base-64';
import { PAYMENT_GATEWAY_CONFIG } from './paymentGatewayConfig';

// Flip API Configuration - Use staging for QRIS
const FLIP_CONFIG = {
  BASE_URL: PAYMENT_GATEWAY_CONFIG.FLIP.BASE_URL || 'https://fm-dev-box.flip.id/', // Staging endpoint for QRIS
  SECRET_KEY: PAYMENT_GATEWAY_CONFIG.FLIP.SECRET_KEY,
  VALIDATION_KEY: PAYMENT_GATEWAY_CONFIG.FLIP.VALIDATION_KEY,
};

// Flip API Client with correct authentication
const flipClient = axios.create({
  baseURL: FLIP_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json', // Use JSON for v3 API
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

// Flip QRIS Interfaces
export interface FlipQRISRequest {
  amount: number;
  order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
}

export interface FlipQRISResponse {
  qr_id: string;
  link_id: number;
  link_url: string;
  payment_url: string;
  qr_string: string;
  amount: number;
  order_id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  expires_at: string;
  paid_at?: string;
  bill_payment_id?: string;
}

// Flip Virtual Account Interfaces
export interface FlipVARequest {
  amount: number;
  order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  bank_code: string; // bca, mandiri, bni, bri, permata, cimb, bsm
  customized_va_unique_numbers?: string; // Custom VA number (7-9 digits)
}

export interface FlipVAResponse {
  va_id: string;
  link_id: number;
  link_url: string;
  payment_url: string;
  va_number: string;
  bank_code: string;
  bank_name: string;
  amount: number;
  order_id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  expires_at: string;
  paid_at?: string;
  bill_payment_id?: string;
}

// Flip E-Wallet Interfaces
export interface FlipEwalletRequest {
  amount: number;
  order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  ewallet_code: string; // shopeepay_app, ovo_app, dana_app, gopay_app, linkaja_app
}

export interface FlipEwalletResponse {
  ewallet_id: string;
  link_id: number;
  link_url: string;
  payment_url: string;
  ewallet_code: string;
  ewallet_name: string;
  amount: number;
  order_id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  expires_at: string;
  paid_at?: string;
  bill_payment_id?: string;
}

class FlipService {
  /**
   * Create QRIS Payment via PWF (Payment With Flip) - Staging Mode
   * Endpoint: POST /big_api/v3/pwf/bill
   */
  async createQRISPayment(request: FlipQRISRequest): Promise<FlipQRISResponse> {
    try {
      console.log('Creating Flip QRIS payment (staging):', request);

      // Set expiration to 30 minutes from now (standard for QRIS)
      const expiredDate = new Date(Date.now() + 30 * 60 * 1000);
      // Format: YYYY-MM-DD HH:mm:ss (include seconds)
      const formattedExpiry = expiredDate.toISOString().replace('T', ' ').substring(0, 19);

      // Prepare JSON payload according to Flip API v3 documentation
      const payload = {
        title: request.description || `Payment for order ${request.order_id}`,
        type: 'single', // Lowercase as per documentation
        step: 'direct_api', // Required for Direct API integration
        amount: request.amount,
        sender_name: request.customer_name,
        sender_email: request.customer_email || 'noreply@example.com', // Required field
        sender_bank: 'qris', // QRIS payment method
        sender_bank_type: 'wallet_account', // Required for QRIS
        reference_id: request.order_id, // Optional merchant reference
        // expired_date: formattedExpiry, // Commented out - format validation issues, field is optional
      };

      console.log('Creating Flip QRIS payment with payload:', JSON.stringify(payload, null, 2));
      console.log('Flip Auth (username):', FLIP_CONFIG.SECRET_KEY?.substring(0, 10) + '...');

      // Use staging endpoint: big_api/v3/pwf/bill with JSON payload
      const response = await flipClient.post('big_api/v3/pwf/bill', payload);

      console.log('Flip QRIS payment created:', response.data);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Extract QR code from nested structure: bill_payment.receiver_bank_account.qr_code_data
      const qrCodeData = flipResponse.bill_payment?.receiver_bank_account?.qr_code_data ||
                         flipResponse.qr_string ||
                         flipResponse.qris_string ||
                         '';

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      return {
        qr_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || flipResponse.id?.toString(),
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        qr_string: qrCodeData,
        amount: flipResponse.amount,
        order_id: request.order_id,
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || expiredDate.toISOString(),
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      console.error('Flip QRIS payment creation failed:', error.response?.data || error.message);
      console.error('Flip request config:', error.config);
      throw new Error(error.response?.data?.message || 'Failed to create Flip QRIS payment');
    }
  }

  /**
   * Simulate Payment Success (Staging/Testing Only)
   * This simulates what would happen when Flip calls our backend webhook
   *
   * In production flow:
   * 1. User pays via QRIS
   * 2. Flip sends POST to our backend webhook with payment status
   * 3. Backend updates order status
   * 4. App polls and detects the status change
   *
   * For testing (without backend webhook):
   * We simulate by just checking the bill status directly
   */
  async simulatePaymentSuccess(linkId: string, billPaymentId: string, amount: number): Promise<any> {
    try {
      console.log('='.repeat(50));
      console.log('SIMULATING FLIP PAYMENT CALLBACK');
      console.log('='.repeat(50));

      // This is what Flip would send to our backend webhook
      const callbackData = {
        id: billPaymentId,
        bill_link: `flip.id/pwf-sandbox/#${linkId}`,
        bill_link_id: parseInt(linkId),
        bill_title: "Test Payment",
        reference_id: linkId,
        sender_name: "Test User",
        sender_bank: "qris",
        sender_email: "test@example.com",
        amount: amount,
        status: "SUCCESSFUL",
        sender_bank_type: "wallet_account",
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      console.log('Callback Data (what Flip would send):');
      console.log(JSON.stringify(callbackData, null, 2));
      console.log('Validation Token:', FLIP_CONFIG.VALIDATION_KEY?.substring(0, 20) + '...');
      console.log('='.repeat(50));

      // In a real scenario, this data would be sent to your backend webhook
      // Backend would verify the token matches VALIDATION_KEY
      // Backend would update order status in database
      // App would poll and see the updated status

      // For testing without backend:
      // We just return the callback data so the app knows what happened
      // The app will continue polling getQRISStatus() which should show PAID

      console.log('NOTE: In production, this data would be sent to your webhook URL');
      console.log('Webhook URL configured:', FLIP_CONFIG.WEBHOOK_URL);
      console.log('='.repeat(50));

      return {
        simulated: true,
        callback_data: callbackData,
        message: 'In production, Flip would POST this data to your webhook URL. Your backend should verify the token and update order status.',
        next_step: 'App will continue polling bill status to detect payment success'
      };
    } catch (error: any) {
      console.error('Failed to simulate payment:', error.response?.data || error.message);
      return { simulated: false, error: error.message };
    }
  }

  /**
   * Get QRIS Payment Status - Staging Mode
   * Endpoint: GET /big_api/v3/bill/{id}
   */
  async getQRISStatus(qrId: string): Promise<FlipQRISResponse> {
    try {
      // Use staging bill status endpoint
      const response = await flipClient.get(`big_api/v3/bill/${qrId}`);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Extract QR code from nested structure: bill_payment.receiver_bank_account.qr_code_data
      const qrCodeData = flipResponse.bill_payment?.receiver_bank_account?.qr_code_data ||
                         flipResponse.qr_string ||
                         flipResponse.qris_string ||
                         '';

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      return {
        qr_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || qrId,
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        qr_string: qrCodeData,
        amount: flipResponse.amount,
        order_id: flipResponse.reference_id || flipResponse.title || '',
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || new Date().toISOString(),
        paid_at: billStatus === 'PAID' ? new Date().toISOString() : undefined,
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      // Silently handle 404 - payment might still be pending
      if (error.response?.status === 404) {
        throw new Error('PAYMENT_NOT_FOUND');
      }
      throw new Error(error.response?.data?.message || 'Failed to get QRIS status');
    }
  }

  /**
   * Create Virtual Account Payment via PWF (Payment With Flip) - Staging Mode
   * Endpoint: POST /big_api/v3/pwf/bill
   */
  async createVAPayment(request: FlipVARequest): Promise<FlipVAResponse> {
    try {
      console.log('Creating Flip VA payment (staging):', request);

      // Set expiration to 24 hours from now (standard for VA)
      const expiredDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Prepare JSON payload according to Flip API v3 documentation
      const payload: any = {
        title: request.description || `Payment for order ${request.order_id}`,
        type: 'single', // Lowercase as per documentation
        step: 'direct_api', // Required for Direct API integration
        amount: request.amount,
        sender_name: request.customer_name,
        sender_email: request.customer_email || 'noreply@example.com', // Required field
        sender_bank: request.bank_code.toLowerCase(), // Bank code must be lowercase (bca, mandiri, bsi, etc.)
        sender_bank_type: 'virtual_account', // VA payment type
        reference_id: request.order_id, // Optional merchant reference
        // expired_date: formattedExpiry, // Commented out - optional field
      };

      // Add custom VA number if provided
      if (request.customized_va_unique_numbers) {
        payload.customized_va_unique_numbers = request.customized_va_unique_numbers;
      }

      console.log('Creating Flip VA payment with payload:', JSON.stringify(payload, null, 2));
      console.log('Flip Auth (username):', FLIP_CONFIG.SECRET_KEY?.substring(0, 10) + '...');

      // Use staging endpoint: big_api/v3/pwf/bill with JSON payload
      const response = await flipClient.post('big_api/v3/pwf/bill', payload);

      console.log('Flip VA payment created:', response.data);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Extract VA number from nested structure: bill_payment.receiver_bank_account.account_number
      const vaNumber = flipResponse.bill_payment?.receiver_bank_account?.account_number || '';
      const bankCode = flipResponse.bill_payment?.receiver_bank_account?.bank_code || request.bank_code;

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      // Map bank code to bank name
      const bankNames: Record<string, string> = {
        bca: 'BCA',
        mandiri: 'Bank Mandiri',
        bni: 'BNI',
        bri: 'BRI',
        permata: 'Bank Permata',
        cimb: 'CIMB Niaga',
        bsm: 'Bank Syariah Mandiri',
        bsi: 'Bank Syariah Indonesia',
      };

      return {
        va_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || flipResponse.id?.toString(),
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        va_number: vaNumber,
        bank_code: bankCode,
        bank_name: bankNames[bankCode.toLowerCase()] || bankCode.toUpperCase(),
        amount: flipResponse.amount,
        order_id: request.order_id,
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || expiredDate.toISOString(),
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      console.error('Flip VA payment creation failed:', error.response?.data || error.message);
      console.error('Flip request config:', error.config);
      throw new Error(error.response?.data?.message || 'Failed to create Flip VA payment');
    }
  }

  /**
   * Get Virtual Account Payment Status - Staging Mode
   * Endpoint: GET /big_api/v3/bill/{id}
   */
  async getVAStatus(vaId: string): Promise<FlipVAResponse> {
    try {
      // Use staging bill status endpoint
      const response = await flipClient.get(`big_api/v3/bill/${vaId}`);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Extract VA number from nested structure
      const vaNumber = flipResponse.bill_payment?.receiver_bank_account?.account_number || '';
      const bankCode = flipResponse.bill_payment?.receiver_bank_account?.bank_code || '';

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      // Map bank code to bank name
      const bankNames: Record<string, string> = {
        bca: 'BCA',
        mandiri: 'Bank Mandiri',
        bni: 'BNI',
        bri: 'BRI',
        permata: 'Bank Permata',
        cimb: 'CIMB Niaga',
        bsm: 'Bank Syariah Mandiri',
        bsi: 'Bank Syariah Indonesia',
      };

      return {
        va_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || vaId,
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        va_number: vaNumber,
        bank_code: bankCode,
        bank_name: bankNames[bankCode.toLowerCase()] || bankCode.toUpperCase(),
        amount: flipResponse.amount,
        order_id: flipResponse.reference_id || flipResponse.title || '',
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || new Date().toISOString(),
        paid_at: billStatus === 'PAID' ? new Date().toISOString() : undefined,
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      // Silently handle 404 - payment might still be pending
      if (error.response?.status === 404) {
        throw new Error('PAYMENT_NOT_FOUND');
      }
      throw new Error(error.response?.data?.message || 'Failed to get VA status');
    }
  }

  /**
   * Create E-Wallet Payment via PWF (Payment With Flip) - Staging Mode
   * Endpoint: POST /big_api/v3/pwf/bill
   */
  async createEwalletPayment(request: FlipEwalletRequest): Promise<FlipEwalletResponse> {
    try {
      console.log('Creating Flip E-Wallet payment (staging):', request);

      // Set expiration to 60 minutes from now (standard for e-wallet)
      const expiredDate = new Date(Date.now() + 60 * 60 * 1000);

      // Prepare JSON payload according to Flip API v3 documentation
      const payload = {
        title: request.description || `Payment for order ${request.order_id}`,
        type: 'single', // Lowercase as per documentation
        step: 'direct_api', // Required for Direct API integration
        amount: request.amount,
        sender_name: request.customer_name,
        sender_email: request.customer_email || 'noreply@example.com', // Required field
        sender_bank: request.ewallet_code, // E-wallet code (shopeepay_app, ovo_app, dana_app, gopay_app, linkaja_app)
        sender_bank_type: 'wallet_account', // E-wallet payment type
        reference_id: request.order_id, // Optional merchant reference
      };

      console.log('Creating Flip E-Wallet payment with payload:', JSON.stringify(payload, null, 2));
      console.log('Flip Auth (username):', FLIP_CONFIG.SECRET_KEY?.substring(0, 10) + '...');

      // Use staging endpoint: big_api/v3/pwf/bill with JSON payload
      const response = await flipClient.post('big_api/v3/pwf/bill', payload);

      console.log('Flip E-Wallet payment created:', response.data);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      // Map e-wallet code to name
      const ewalletNames: Record<string, string> = {
        shopeepay_app: 'ShopeePay',
        ovo: 'OVO',
        dana: 'DANA',
        gopay: 'GoPay',
        linkaja: 'LinkAja',
        shopeepay: 'ShopeePay',
      };

      return {
        ewallet_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || flipResponse.id?.toString(),
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        ewallet_code: request.ewallet_code,
        ewallet_name: ewalletNames[request.ewallet_code.toLowerCase()] || request.ewallet_code.toUpperCase(),
        amount: flipResponse.amount,
        order_id: request.order_id,
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || expiredDate.toISOString(),
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      console.error('Flip E-Wallet payment creation failed:', error.response?.data || error.message);
      console.error('Flip request config:', error.config);
      throw new Error(error.response?.data?.message || 'Failed to create Flip E-Wallet payment');
    }
  }

  /**
   * Get E-Wallet Payment Status - Staging Mode
   * Endpoint: GET /big_api/v3/bill/{id}
   */
  async getEwalletStatus(ewalletId: string): Promise<FlipEwalletResponse> {
    try {
      // Use staging bill status endpoint
      const response = await flipClient.get(`big_api/v3/bill/${ewalletId}`);

      // Transform response to match our expected format
      const flipResponse = response.data;

      // Extract e-wallet code from bill_payment
      const ewalletCode = flipResponse.bill_payment?.sender_bank || flipResponse.sender_bank || '';

      // Determine status based on bill_payment status
      const billStatus = flipResponse.bill_payment?.status || flipResponse.status;
      let paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      if (billStatus === 'PENDING') paymentStatus = 'PENDING';
      else if (billStatus === 'PAID' || billStatus === 'COMPLETED') paymentStatus = 'PAID';
      else if (billStatus === 'EXPIRED') paymentStatus = 'EXPIRED';
      else if (billStatus === 'CANCELLED' || billStatus === 'INACTIVE') paymentStatus = 'EXPIRED';

      // Map e-wallet code to name
      const ewalletNames: Record<string, string> = {
        shopeepay_app: 'ShopeePay',
        ovo: 'OVO',
        dana: 'DANA',
        gopay: 'GoPay',
        linkaja: 'LinkAja',
        shopeepay: 'ShopeePay',
      };

      return {
        ewallet_id: flipResponse.link_id?.toString() || flipResponse.bill_payment?.id || ewalletId,
        link_id: flipResponse.link_id,
        link_url: flipResponse.link_url || '',
        payment_url: flipResponse.payment_url || '',
        ewallet_code: ewalletCode,
        ewallet_name: ewalletNames[ewalletCode.toLowerCase()] || ewalletCode.toUpperCase(),
        amount: flipResponse.amount,
        order_id: flipResponse.reference_id || flipResponse.title || '',
        status: paymentStatus,
        created_at: flipResponse.created_from || new Date().toISOString(),
        expires_at: flipResponse.expired_date || new Date().toISOString(),
        paid_at: billStatus === 'PAID' ? new Date().toISOString() : undefined,
        bill_payment_id: flipResponse.bill_payment?.id,
      };
    } catch (error: any) {
      // Silently handle 404 - payment might still be pending
      if (error.response?.status === 404) {
        throw new Error('PAYMENT_NOT_FOUND');
      }
      throw new Error(error.response?.data?.message || 'Failed to get E-Wallet status');
    }
  }

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