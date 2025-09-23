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
      // Route QRIS and EWALLET to Xendit (supports these methods)
      // Route VIRTUAL_ACCOUNT to Flip (mobile-friendly bank transfer)
      if (request.paymentMethod === 'QRIS' || request.paymentMethod === 'EWALLET') {
        provider = 'XENDIT';
      } else {
        provider = GATEWAY_CONFIG.PRIMARY_PROVIDER; // Flip for others
      }
    }

    try {
      console.log(`Attempting payment with ${provider} provider (${request.paymentMethod}):`, request);

      switch (provider) {
        case 'FLIP':
          return await this.createFlipPayment(request);

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
  private async createFlipPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    try {
      if (request.paymentMethod === 'VIRTUAL_ACCOUNT') {
        // Use mobile-friendly payment approach - show bank details in app
        const flipResponse = await flipPaymentGateway.createMobilePayment({
          orderId: request.orderId,
          amount: request.amount,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
        });

        return {
          provider: 'FLIP',
          paymentId: flipResponse.paymentId,
          status: 'PENDING',
          paymentData: flipResponse,
          accountNumber: flipResponse.bankDetails.accountNumber,
          bankCode: 'MANDIRI',
          amount: flipResponse.amount,
          expiresAt: flipResponse.expiresAt,
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
          // Check if it's a mobile payment ID (starts with 'FLIP') or bill ID (numeric)
          if (paymentId.startsWith('FLIP')) {
            // Mobile payment - these don't have real-time status checking
            // Return pending status (user needs to manually confirm payment)
            return {
              isPaid: false,
              status: 'PENDING',
              paymentData: { mobile_payment: true, payment_id: paymentId },
            };
          } else {
            // Bill payment - use normal status check
            const flipStatus = await flipPaymentGateway.getBillStatus(parseInt(paymentId));
            return {
              isPaid: flipStatus.status === 'ACTIVE' && flipStatus.payment_id !== undefined,
              status: flipStatus.status,
              paymentData: flipStatus,
            };
          }

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
    } catch (error) {
      console.error(`Failed to get payment status from ${provider}:`, error);
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