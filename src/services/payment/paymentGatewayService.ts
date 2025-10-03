/**
 * Payment Gateway Service
 * Configurable payment service that can use any provider (Flip, Xendit, etc.)
 * Provider is selected based on configuration
 */

import flipPaymentGateway from './flipPaymentGateway';
import xenditPaymentGateway from './xenditPaymentGateway'; // Xendit service
import { PaymentMethod } from './paymentGatewayConfig';

// Gateway provider types
export type PaymentProvider = 'FLIP' | 'XENDIT';

// Configuration for each provider
const GATEWAY_CONFIG = {
  PRIMARY_PROVIDER: 'FLIP' as PaymentProvider,
  FALLBACK_PROVIDER: null, // Use only Flip, no fallback
  RETRY_ATTEMPTS: 2,
  TIMEOUT_MS: 30000,
};

// Unified payment interfaces
export interface UnifiedPaymentRequest {
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

export interface UnifiedPaymentResponse {
  provider: PaymentProvider;
  paymentId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  paymentUrl?: string;
  paymentData: any;
  qrString?: string;
  accountNumber?: string;
  bankCode?: string;
  expiresAt?: string;
  amount: number;
  fees?: number;
}

class PaymentGatewayService {
  /**
   * Create payment with configured provider
   */
  async createPayment(
    request: UnifiedPaymentRequest,
    preferredProvider?: PaymentProvider,
    paymentOptions?: any
  ): Promise<UnifiedPaymentResponse> {
    // Smart provider routing based on payment method
    let provider = preferredProvider;

    if (!provider) {
      // Route QRIS to Flip (staging endpoint /big_api/v3/pwf/bill)
      // Route EWALLET to Flip (supports e-wallet methods via PWF API)
      // Route VIRTUAL_ACCOUNT to Flip (mobile-friendly bank transfer)
      if (request.paymentMethod === 'QRIS') {
        provider = 'FLIP'; // Use Flip staging for QRIS
      } else if (request.paymentMethod === 'EWALLET') {
        provider = 'FLIP'; // Use Flip for E-Wallet
      } else {
        provider = GATEWAY_CONFIG.PRIMARY_PROVIDER; // Flip for others
      }
    }

    try {
      console.log(`Attempting payment with ${provider} provider (${request.paymentMethod}):`, request);

      switch (provider) {
        case 'FLIP':
          return await this.createFlipPayment(request, paymentOptions);

        case 'XENDIT':
          return await this.createXenditPayment(request, paymentOptions);

        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Payment creation failed with ${provider}:`, error);
      throw new Error(`Payment failed with ${provider}: ${error.message}`);
    }
  }

  /**
   * Create payment using Flip
   */
  private async createFlipPayment(request: UnifiedPaymentRequest, paymentOptions?: any): Promise<UnifiedPaymentResponse> {
    try {
      if (request.paymentMethod === 'QRIS') {
        // Use Flip QRIS
        const flipResponse = await flipPaymentGateway.createQRISPayment({
          order_id: request.orderId,
          amount: request.amount,
          customer_name: request.customerName,
          customer_email: request.customerEmail,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
        });

        return {
          provider: 'FLIP',
          paymentId: flipResponse.qr_id,
          status: this.mapFlipStatus(flipResponse.status),
          paymentData: flipResponse,
          qrString: flipResponse.qr_string,
          amount: flipResponse.amount,
          expiresAt: flipResponse.expires_at,
          fees: this.calculateFlipFees(request.amount),
        };
      } else if (request.paymentMethod === 'VIRTUAL_ACCOUNT') {
        // Use Flip Virtual Account
        const flipResponse = await flipPaymentGateway.createVAPayment({
          order_id: request.orderId,
          amount: request.amount,
          customer_name: request.customerName,
          customer_email: request.customerEmail,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
          bank_code: paymentOptions?.bankCode || 'bca', // Default to BCA if not specified
        });

        return {
          provider: 'FLIP',
          paymentId: flipResponse.va_id,
          status: this.mapFlipStatus(flipResponse.status),
          paymentData: flipResponse,
          accountNumber: flipResponse.va_number,
          bankCode: flipResponse.bank_code.toUpperCase(),
          amount: flipResponse.amount,
          expiresAt: flipResponse.expires_at,
          fees: this.calculateFlipFees(request.amount),
        };
      } else if (request.paymentMethod === 'EWALLET') {
        // Use Flip E-Wallet
        const flipResponse = await flipPaymentGateway.createEwalletPayment({
          order_id: request.orderId,
          amount: request.amount,
          customer_name: request.customerName,
          customer_email: request.customerEmail,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
          ewallet_code: paymentOptions?.channelCode || 'shopeepay_app', // E-wallet channel code
        });

        return {
          provider: 'FLIP',
          paymentId: flipResponse.ewallet_id,
          status: this.mapFlipStatus(flipResponse.status),
          paymentData: flipResponse,
          paymentUrl: flipResponse.payment_url,
          amount: flipResponse.amount,
          expiresAt: flipResponse.expires_at,
          fees: this.calculateFlipFees(request.amount),
        };
      } else {
        // For other payment methods, fall back to bill payment
        const flipResponse = await flipPaymentGateway.createBillPayment({
          orderId: request.orderId,
          amount: request.amount,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
        });

        return {
          provider: 'FLIP',
          paymentId: flipResponse.link_id.toString(),
          status: flipResponse.status === 'ACTIVE' ? 'PENDING' : 'FAILED',
          paymentUrl: flipResponse.link_url,
          paymentData: flipResponse,
          amount: flipResponse.amount,
          expiresAt: flipResponse.expired_date,
          fees: this.calculateFlipFees(request.amount),
        };
      }
    } catch (error) {
      throw new Error(`Flip payment creation failed: ${error.message}`);
    }
  }

  /**
   * Create payment using Xendit (fallback)
   */
  private async createXenditPayment(
    request: UnifiedPaymentRequest,
    paymentOptions?: any
  ): Promise<UnifiedPaymentResponse> {
    try {
      let xenditResponse;

      switch (request.paymentMethod) {
        case 'QRIS':
          xenditResponse = await xenditPaymentGateway.createQRISPayment(request);
          return {
            provider: 'XENDIT',
            paymentId: xenditResponse.id,
            status: this.mapXenditStatus(xenditResponse.status),
            paymentData: xenditResponse,
            qrString: xenditResponse.qr_string,
            amount: xenditResponse.amount,
            expiresAt: xenditResponse.expires_at,
            fees: xenditPaymentGateway.calculateFee(request.amount, 'QRIS'),
          };

        case 'EWALLET':
          if (!paymentOptions?.channelCode) {
            throw new Error('E-wallet channel code is required');
          }
          xenditResponse = await xenditPaymentGateway.createEwalletPayment(request, paymentOptions.channelCode);
          return {
            provider: 'XENDIT',
            paymentId: xenditResponse.id,
            status: this.mapXenditStatus(xenditResponse.status),
            paymentData: xenditResponse,
            paymentUrl: xenditResponse.actions?.mobile_web_checkout_url,
            amount: xenditResponse.charge_amount,
            fees: xenditPaymentGateway.calculateFee(request.amount, 'EWALLET'),
          };

        case 'VIRTUAL_ACCOUNT':
          if (!paymentOptions?.bankCode) {
            throw new Error('Bank code is required for virtual account');
          }
          xenditResponse = await xenditPaymentGateway.createVirtualAccount(request, paymentOptions.bankCode);
          return {
            provider: 'XENDIT',
            paymentId: xenditResponse.id,
            status: 'PENDING',
            paymentData: xenditResponse,
            accountNumber: xenditResponse.account_number,
            bankCode: xenditResponse.bank_code,
            amount: xenditResponse.expected_amount,
            expiresAt: xenditResponse.expiration_date,
            fees: xenditPaymentGateway.calculateFee(request.amount, 'VIRTUAL_ACCOUNT'),
          };

        default:
          throw new Error(`Unsupported payment method for Xendit: ${request.paymentMethod}`);
      }
    } catch (error) {
      throw new Error(`Xendit payment creation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status across providers
   */
  async getPaymentStatus(paymentId: string, provider: PaymentProvider): Promise<{
    isPaid: boolean;
    status: string;
    paymentData?: any;
  }> {
    try {
      switch (provider) {
        case 'FLIP':
          // Try to determine if it's QRIS, VA, or E-Wallet payment
          // All use the same getStatus endpoint, check in order
          try {
            // Check as QRIS first (has qr_string)
            const qrisStatus = await flipPaymentGateway.getQRISStatus(paymentId);
            if (qrisStatus.qr_string) {
              return {
                isPaid: qrisStatus.status === 'PAID',
                status: qrisStatus.status,
                paymentData: qrisStatus,
              };
            }
          } catch (qrisError: any) {
            // Silently handle - not a QRIS payment or payment not found
            if (qrisError.message !== 'PAYMENT_NOT_FOUND') {
              // Only log non-404 errors
            }
          }

          try {
            // Check as VA (has va_number)
            const vaStatus = await flipPaymentGateway.getVAStatus(paymentId);
            if (vaStatus.va_number) {
              return {
                isPaid: vaStatus.status === 'PAID',
                status: vaStatus.status,
                paymentData: vaStatus,
              };
            }
          } catch (vaError: any) {
            // Silently handle - not a VA payment
            if (vaError.message !== 'PAYMENT_NOT_FOUND') {
              // Only log non-404 errors
            }
          }

          // Check as E-Wallet (has ewallet_code)
          const ewalletStatus = await flipPaymentGateway.getEwalletStatus(paymentId);
          return {
            isPaid: ewalletStatus.status === 'PAID',
            status: ewalletStatus.status,
            paymentData: ewalletStatus,
          };

        case 'XENDIT':
          // Use Xendit payment status check - determine payment type from payment ID or context
          // For e-wallet payments from EwalletPaymentScreen, use 'EWALLET'
          const xenditStatus = await xenditPaymentGateway.getPaymentStatus(paymentId, 'EWALLET');

          // Map Xendit status to our format
          const isPaid = xenditStatus.status === 'SUCCEEDED' || xenditStatus.status === 'PAID' || xenditStatus.status === 'COMPLETED';

          return {
            isPaid: isPaid,
            status: xenditStatus.status,
            paymentData: xenditStatus,
          };

        default:
          throw new Error(`Unsupported provider for status check: ${provider}`);
      }
    } catch (error: any) {
      // Silently handle PAYMENT_NOT_FOUND - payment is still pending
      if (error.message === 'PAYMENT_NOT_FOUND') {
        return {
          isPaid: false,
          status: 'PENDING',
        };
      }

      // Log other errors
      console.error(`Failed to get payment status from ${provider}:`, error.message);
      return {
        isPaid: false,
        status: 'ERROR',
      };
    }
  }


  /**
   * Calculate fees for Flip payments
   */
  private calculateFlipFees(amount: number): number {
    return Math.round(amount * 0.003); // 0.3%
  }

  /**
   * Map Flip status to unified status
   */
  private mapFlipStatus(flipStatus: string): 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' {
    switch (flipStatus) {
      case 'PENDING':
        return 'PENDING';
      case 'PAID':
        return 'PAID';
      case 'EXPIRED':
        return 'EXPIRED';
      case 'CANCELLED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Map Xendit status to unified status
   */
  private mapXenditStatus(xenditStatus: string): 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' {
    switch (xenditStatus) {
      case 'PENDING':
      case 'ACTIVE':
        return 'PENDING';
      case 'PAID':
      case 'SUCCEEDED':
      case 'COMPLETED':
        return 'PAID';
      case 'EXPIRED':
        return 'EXPIRED';
      case 'FAILED':
      case 'CANCELLED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<{
    flip: { status: 'healthy' | 'degraded' | 'down'; responseTime?: number };
    xendit: { status: 'healthy' | 'degraded' | 'down'; responseTime?: number };
  }> {
    const startTime = Date.now();

    try {
      // Simple health check for each provider
      const [flipHealth, xenditHealth] = await Promise.allSettled([
        this.checkFlipHealth(),
        this.checkXenditHealth(),
      ]);

      return {
        flip: flipHealth.status === 'fulfilled'
          ? { status: 'healthy', responseTime: Date.now() - startTime }
          : { status: 'down' },
        xendit: xenditHealth.status === 'fulfilled'
          ? { status: 'healthy', responseTime: Date.now() - startTime }
          : { status: 'down' },
      };
    } catch (error) {
      return {
        flip: { status: 'down' },
        xendit: { status: 'down' },
      };
    }
  }

  private async checkFlipHealth(): Promise<boolean> {
    try {
      await flipPaymentGateway.getAvailableBanks();
      return true;
    } catch {
      return false;
    }
  }

  private async checkXenditHealth(): Promise<boolean> {
    // Add a simple health check for Xendit if available
    return true;
  }
}

export default new PaymentGatewayService();