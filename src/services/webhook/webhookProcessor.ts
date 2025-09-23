/**
 * Automated Webhook Processor
 * Processes Xendit webhooks automatically like real payments
 */

import orderService from '../order/orderService';
import paymentGatewayService from '../payment/paymentGatewayService';
import { PaymentMethod } from '../payment/paymentGatewayConfig';

interface WebhookData {
  id: string;
  external_id: string;
  status: string;
  bank_code?: string;
  account_number?: string;
  expected_amount?: number;
  received_amount?: number;
  callback_virtual_account_id?: string;
  payment_id?: string;
  reference_id?: string;
}

class WebhookProcessor {
  /**
   * Process Virtual Account webhook automatically
   */
  async processVirtualAccountWebhook(webhookData: WebhookData): Promise<void> {
    try {
      const { external_id, status, id: paymentId } = webhookData;
      
      // Extract order ID from external_id (format: va_35_1755536546716)
      const orderMatch = external_id.match(/va_(\d+)_/);
      if (!orderMatch) {
        return;
      }
      
      const orderId = orderMatch[1];
      // Check if payment is successful
      const isPaymentComplete = status === 'COMPLETED' || 
                               (status === 'ACTIVE' && webhookData.received_amount && 
                                webhookData.received_amount >= (webhookData.expected_amount || 0));
      
      if (isPaymentComplete) {
        // Update order with payment information
        await orderService.updateOrderPaymentInfo(
          orderId,
          paymentId,
          'VIRTUAL_ACCOUNT',
          'COMPLETED'
        );
        
        // Update order status to payment confirmed
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        
        // Optional: Send notification to user
        this.sendPaymentNotification(orderId, 'success');
        
      } else {
        // Update payment info but keep waiting for payment
        await orderService.updateOrderPaymentInfo(
          orderId,
          paymentId,
          'VIRTUAL_ACCOUNT',
          status
        );
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Process QRIS webhook automatically
   */
  async processQRISWebhook(webhookData: WebhookData): Promise<void> {
    try {
      const { reference_id, status, id: paymentId } = webhookData;
      
      if (reference_id && status === 'COMPLETED') {
        await orderService.updateOrderPaymentInfo(
          reference_id,
          paymentId,
          'QRIS',
          'COMPLETED'
        );
        
        await orderService.updateOrderStatus(reference_id, 'payment_confirmed');
        
        this.sendPaymentNotification(reference_id, 'success');
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Process E-Wallet webhook automatically
   */
  async processEwalletWebhook(webhookData: WebhookData): Promise<void> {
    try {
      const { reference_id, status, id: paymentId } = webhookData;
      
      if (reference_id && (status === 'SUCCEEDED' || status === 'CAPTURED')) {
        await orderService.updateOrderPaymentInfo(
          reference_id,
          paymentId,
          'EWALLET',
          'COMPLETED'
        );
        
        await orderService.updateOrderStatus(reference_id, 'payment_confirmed');
        
        this.sendPaymentNotification(reference_id, 'success');
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Universal webhook processor - detects type and processes accordingly
   */
  async processWebhook(webhookData: any): Promise<void> {
    try {
      // Detect webhook type and process accordingly
      if (webhookData.bank_code && webhookData.account_number) {
        // Virtual Account webhook
        await this.processVirtualAccountWebhook(webhookData);
      } else if (webhookData.qr_string || webhookData.type === 'QRIS') {
        // QRIS webhook  
        await this.processQRISWebhook(webhookData);
      } else if (webhookData.channel_code || webhookData.type === 'EWALLET') {
        // E-Wallet webhook
        await this.processEwalletWebhook(webhookData);
      } else {
        await this.processGenericPaymentWebhook(webhookData);
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Process generic payment webhook
   */
  async processGenericPaymentWebhook(webhookData: any): Promise<void> {
    try {
      const { id, external_id, reference_id, status } = webhookData;
      
      // Try to extract order ID from external_id or reference_id
      let orderId = reference_id;
      if (!orderId && external_id) {
        const match = external_id.match(/(?:va_|qris_|ewallet_)(\d+)_/);
        orderId = match ? match[1] : null;
      }
      
      if (orderId && (status === 'COMPLETED' || status === 'SUCCEEDED' || status === 'PAID')) {
        await orderService.updateOrderPaymentInfo(
          orderId,
          id,
          'VIRTUAL_ACCOUNT', // Default to VA
          'COMPLETED'
        );
        
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        
        this.sendPaymentNotification(orderId, 'success');
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Send payment notification to user
   */
  private sendPaymentNotification(orderId: string, type: 'success' | 'failed'): void {
    // Here you can add:
    // - Push notifications
    // - SMS notifications
    // - Email notifications
    // - In-app notifications
    
    // For now, just log
    if (type === 'success') {
      } else {
      }
  }
  
  /**
   * Simulate webhook processing (for testing without real payments)
   */
  async simulatePaymentWebhook(orderId: string, paymentMethod: PaymentMethod = 'VIRTUAL_ACCOUNT'): Promise<void> {
    const mockWebhookData = {
      id: `mock_payment_${Date.now()}`,
      external_id: `va_${orderId}_${Date.now()}`,
      reference_id: orderId,
      status: 'COMPLETED',
      bank_code: 'BRI',
      account_number: '1234567890',
      expected_amount: 100000,
      received_amount: 100000,
    };
    
    await this.processWebhook(mockWebhookData);
  }
}

export default new WebhookProcessor();