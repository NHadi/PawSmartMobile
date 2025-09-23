/**
 * Payment Integration Service
 * Connects payment gateway with order management and polling
 */

import paymentGatewayService from './paymentGatewayService';
import paymentPollingService from './paymentPollingService';
import orderService from '../order/orderService';
import { PaymentMethod } from './paymentGatewayConfig';

interface PaymentSession {
  orderId: string;
  paymentId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentData: any;
  startTime: number;
}

class PaymentIntegrationService {
  private activeSessions: Map<string, PaymentSession> = new Map();

  /**
   * Create payment and start monitoring
   */
  async createPaymentWithMonitoring(
    orderData: {
      orderId: string;
      amount: number;
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      description?: string;
    },
    paymentMethod: PaymentMethod,
    paymentOptions: any = {}
  ): Promise<{
    success: boolean;
    paymentData?: any;
    error?: string;
    paymentUrl?: string;
    accountNumber?: string;
    qrString?: string;
  }> {
    try {
      let paymentResult: any;
      let paymentId: string;

      // Create payment using unified service
      paymentResult = await paymentGatewayService.createPayment({
        orderId: orderData.orderId,
        amount: orderData.amount,
        paymentMethod,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        description: orderData.description,
      }, undefined, paymentOptions);

      paymentId = paymentResult.paymentId;

      if (!paymentResult || !paymentId) {
        throw new Error('Failed to create payment - no payment ID returned');
      }

      // Store payment info in order
      await orderService.updateOrderPaymentInfo(
        orderData.orderId,
        paymentId,
        paymentMethod,
        paymentResult.status || 'PENDING'
      );

      // Create payment session
      const session: PaymentSession = {
        orderId: orderData.orderId,
        paymentId,
        paymentMethod,
        amount: orderData.amount,
        paymentData: paymentResult,
        startTime: Date.now(),
      };

      this.activeSessions.set(paymentId, session);

      // Start automatic polling
      paymentPollingService.startPolling(
        paymentId,
        paymentMethod,
        orderData.orderId
      );

      // Return appropriate response based on payment method
      const response: any = {
        success: true,
        paymentData: paymentResult,
      };

      switch (paymentMethod) {
        case 'QRIS':
          response.qrString = paymentResult.qrString;
          response.paymentUrl = paymentResult.paymentUrl;
          break;

        case 'VIRTUAL_ACCOUNT':
          response.accountNumber = paymentResult.accountNumber;
          response.bankCode = paymentResult.bankCode;
          break;

        case 'EWALLET':
          response.paymentUrl = paymentResult.paymentUrl;
          break;
      }

      return response;

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Manual payment check (for "Check Payment" button)
   */
  async checkPaymentManually(orderId: string): Promise<{
    success: boolean;
    isPaid: boolean;
    status: string;
    message: string;
    paymentData?: any;
  }> {
    try {
      // Get order details
      const order = await orderService.getOrderById(orderId);
      const paymentInfo = orderService.getPaymentInfoFromOrder(order);

      if (!paymentInfo.paymentId || !paymentInfo.paymentMethod) {
        return {
          success: false,
          isPaid: false,
          status: 'NO_PAYMENT',
          message: 'Tidak ada informasi pembayaran untuk pesanan ini.',
        };
      }

      // Use polling service for manual check
      const result = await paymentPollingService.manualPaymentCheck(
        paymentInfo.paymentId,
        paymentInfo.paymentMethod as PaymentMethod,
        orderId
      );

      return {
        success: true,
        isPaid: result.isPaid,
        status: result.status,
        message: result.message,
      };

    } catch (error: any) {
      return {
        success: false,
        isPaid: false,
        status: 'ERROR',
        message: 'Terjadi kesalahan saat mengecek pembayaran. Silakan coba lagi.',
      };
    }
  }

  /**
   * Get payment session info
   */
  getPaymentSession(paymentId: string): PaymentSession | undefined {
    return this.activeSessions.get(paymentId);
  }

  /**
   * Remove payment session
   */
  removePaymentSession(paymentId: string): void {
    this.activeSessions.delete(paymentId);
    paymentPollingService.stopPolling(paymentId);
  }

  /**
   * Get all active payment sessions
   */
  getActivePaymentSessions(): PaymentSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Resume monitoring for existing orders with pending payments
   */
  async resumePaymentMonitoring(): Promise<void> {
    try {
      const pendingOrders = await orderService.getOrdersWithPendingPayments();
      let resumedCount = 0;

      for (const order of pendingOrders) {
        const paymentInfo = orderService.getPaymentInfoFromOrder(order);
        
        if (paymentInfo.paymentId && paymentInfo.paymentMethod) {
          // Check if already polling
          if (!paymentPollingService.isPolling(paymentInfo.paymentId)) {
            // Create session
            const session: PaymentSession = {
              orderId: order.id.toString(),
              paymentId: paymentInfo.paymentId,
              paymentMethod: paymentInfo.paymentMethod as PaymentMethod,
              amount: order.amount_total,
              paymentData: null,
              startTime: Date.now(),
            };

            this.activeSessions.set(paymentInfo.paymentId, session);

            // Start polling
            paymentPollingService.startPolling(
              paymentInfo.paymentId,
              paymentInfo.paymentMethod as PaymentMethod,
              order.id.toString()
            );

            resumedCount++;
          }
        }
      }

      } catch (error) {
      }
  }

  /**
   * Stop all payment monitoring
   */
  stopAllPaymentMonitoring(): void {
    paymentPollingService.stopAllPolling();
    this.activeSessions.clear();
    
    }

  /**
   * Get payment fee for display
   */
  calculatePaymentFee(amount: number, paymentMethod: PaymentMethod): number {
    // Since we're using Flip, calculate fees based on Flip pricing
    switch (paymentMethod) {
      case 'QRIS':
      case 'EWALLET':
      case 'VIRTUAL_ACCOUNT':
        return Math.round(amount * 0.003); // 0.3% for Flip
      default:
        return 0;
    }
  }

  /**
   * Get total amount including fees
   */
  getTotalAmountWithFees(baseAmount: number, paymentMethod: PaymentMethod): {
    baseAmount: number;
    fee: number;
    totalAmount: number;
  } {
    const fee = this.calculatePaymentFee(baseAmount, paymentMethod);
    return {
      baseAmount,
      fee,
      totalAmount: baseAmount + fee,
    };
  }

  /**
   * Get payment methods available for amount
   */
  getAvailablePaymentMethods(amount: number): {
    method: PaymentMethod;
    name: string;
    fee: number;
    totalAmount: number;
    enabled: boolean;
  }[] {
    const methods: PaymentMethod[] = ['QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET'];
    
    return methods.map(method => {
      const fee = this.calculatePaymentFee(amount, method);
      const enabled = amount >= 10000 && amount <= 50000000; // 10K - 50M IDR limits
      
      return {
        method,
        name: this.getPaymentMethodDisplayName(method),
        fee,
        totalAmount: amount + fee,
        enabled,
      };
    });
  }

  /**
   * Get display name for payment method
   */
  private getPaymentMethodDisplayName(method: PaymentMethod): string {
    const names: { [key in PaymentMethod]: string } = {
      'QRIS': 'QRIS (Scan QR)',
      'VIRTUAL_ACCOUNT': 'Virtual Account',
      'EWALLET': 'E-Wallet',
      'CARDS': 'Kartu Kredit/Debit',
    };
    
    return names[method] || method;
  }
}

export default new PaymentIntegrationService();