/**
 * Payment Polling Service
 * Automatically checks payment status for pending orders
 */

import paymentGatewayService from './paymentGatewayService';
import orderService from '../order/orderService';
import { PaymentMethod } from './paymentGatewayConfig';

interface PendingPayment {
  paymentId: string;
  paymentMethod: PaymentMethod;
  orderId: string;
  startTime: number;
  maxPollingTime: number; // in milliseconds
  pollInterval: number; // in milliseconds
}

class PaymentPollingService {
  private pendingPayments: Map<string, PendingPayment> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Default polling settings
  private defaultSettings = {
    QRIS: {
      maxPollingTime: 30 * 60 * 1000, // 30 minutes
      pollInterval: 10 * 1000, // 10 seconds
    },
    VIRTUAL_ACCOUNT: {
      maxPollingTime: 24 * 60 * 60 * 1000, // 24 hours
      pollInterval: 30 * 1000, // 30 seconds
    },
    EWALLET: {
      maxPollingTime: 60 * 60 * 1000, // 1 hour
      pollInterval: 15 * 1000, // 15 seconds
    },
    CARDS: {
      maxPollingTime: 30 * 60 * 1000, // 30 minutes
      pollInterval: 10 * 1000, // 10 seconds
    },
  };

  /**
   * Start polling for a payment
   */
  startPolling(
    paymentId: string,
    paymentMethod: PaymentMethod,
    orderId: string,
    customSettings?: { maxPollingTime?: number; pollInterval?: number }
  ): void {
    // Stop existing polling if any
    this.stopPolling(paymentId);

    const settings = this.defaultSettings[paymentMethod];
    const pendingPayment: PendingPayment = {
      paymentId,
      paymentMethod,
      orderId,
      startTime: Date.now(),
      maxPollingTime: customSettings?.maxPollingTime || settings.maxPollingTime,
      pollInterval: customSettings?.pollInterval || settings.pollInterval,
    };

    this.pendingPayments.set(paymentId, pendingPayment);

    // Start polling
    const pollInterval = setInterval(async () => {
      await this.pollPaymentStatus(paymentId);
    }, pendingPayment.pollInterval);

    this.pollingIntervals.set(paymentId, pollInterval);

    // Log polling started
    }

  /**
   * Stop polling for a payment
   */
  stopPolling(paymentId: string): void {
    const interval = this.pollingIntervals.get(paymentId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(paymentId);
    }

    this.pendingPayments.delete(paymentId);
    }

  /**
   * Poll payment status
   */
  private async pollPaymentStatus(paymentId: string): Promise<void> {
    const pendingPayment = this.pendingPayments.get(paymentId);
    if (!pendingPayment) {
      return;
    }

    try {
      const { paymentMethod, orderId, startTime, maxPollingTime } = pendingPayment;
      const elapsedTime = Date.now() - startTime;

      // Check if polling time has exceeded maximum
      if (elapsedTime > maxPollingTime) {
        this.stopPolling(paymentId);
        
        // Optionally update order status to expired/timeout
        try {
          await orderService.updateOrderStatus(orderId, 'cancelled');
          } catch (error) {
          }
        
        return;
      }

      // Check payment status
      const result = await paymentGatewayService.checkAndUpdatePayment(
        paymentId,
        paymentMethod,
        orderId,
        this.updateOrderStatusCallback.bind(this)
      );

      // If payment is successful, stop polling
      if (result.isPaid) {
        this.stopPolling(paymentId);
        
        // Optionally trigger success notifications
        this.onPaymentSuccess(paymentId, orderId, result);
      } 
      // If payment failed permanently, stop polling
      else if (result.status === 'FAILED' || result.status === 'EXPIRED' || result.status === 'CANCELLED') {
        this.stopPolling(paymentId);
        
        // Update order status
        try {
          await orderService.updateOrderStatus(orderId, 'cancelled');
          } catch (error) {
          }
        
        this.onPaymentFailure(paymentId, orderId, result);
      }

    } catch (error) {
      // Continue polling unless it's a critical error
      // You might want to implement retry logic here
    }
  }

  /**
   * Callback to update order status when payment is confirmed
   */
  private async updateOrderStatusCallback(orderId: string, isPaid: boolean, paymentData: any): Promise<void> {
    try {
      if (isPaid) {
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private onPaymentSuccess(paymentId: string, orderId: string, paymentResult: any): void {
    // Here you can add:
    // - Push notifications to user
    // - Analytics tracking
    // - Email notifications
    // - Webhook notifications to other services
    
    // Example: Send notification (you'll need to implement this)
    // notificationService.sendPaymentSuccessNotification(orderId, paymentResult);
  }

  /**
   * Handle failed payment
   */
  private onPaymentFailure(paymentId: string, orderId: string, paymentResult: any): void {
    // Here you can add:
    // - Push notifications to user about payment failure
    // - Analytics tracking
    // - Support ticket creation
    
    // Example: Send notification (you'll need to implement this)
    // notificationService.sendPaymentFailureNotification(orderId, paymentResult);
  }

  /**
   * Get all pending payments
   */
  getPendingPayments(): PendingPayment[] {
    return Array.from(this.pendingPayments.values());
  }

  /**
   * Check if a payment is being polled
   */
  isPolling(paymentId: string): boolean {
    return this.pendingPayments.has(paymentId);
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const [paymentId] of this.pendingPayments) {
      this.stopPolling(paymentId);
    }
    
    }

  /**
   * Manual check for a specific payment (for "Check Payment" button)
   */
  async manualPaymentCheck(
    paymentId: string,
    paymentMethod: PaymentMethod,
    orderId: string
  ): Promise<{ isPaid: boolean; status: string; message: string }> {
    try {
      const result = await paymentGatewayService.checkAndUpdatePayment(
        paymentId,
        paymentMethod,
        orderId,
        this.updateOrderStatusCallback.bind(this)
      );

      let message = '';
      if (result.isPaid) {
        message = 'Pembayaran berhasil! Status pesanan telah diperbarui.';
        // Stop polling if it was running
        this.stopPolling(paymentId);
        this.onPaymentSuccess(paymentId, orderId, result);
      } else if (result.status === 'ERROR') {
        message = 'Terjadi kesalahan saat mengecek status pembayaran. Silakan coba lagi.';
      } else if (result.status === 'FAILED' || result.status === 'EXPIRED') {
        message = 'Pembayaran gagal atau telah expired. Silakan buat pesanan baru.';
        this.stopPolling(paymentId);
      } else {
        message = `Status pembayaran: ${result.status}. Silakan selesaikan pembayaran.`;
      }

      return {
        isPaid: result.isPaid,
        status: result.status,
        message
      };
    } catch (error) {
      return {
        isPaid: false,
        status: 'ERROR',
        message: 'Terjadi kesalahan saat mengecek pembayaran. Silakan coba lagi.'
      };
    }
  }
}

export default new PaymentPollingService();