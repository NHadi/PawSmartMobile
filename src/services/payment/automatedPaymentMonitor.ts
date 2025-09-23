/**
 * Automated Payment Monitor
 * Continuously monitors for completed payments and processes them automatically
 */

import webhookProcessor from '../webhook/webhookProcessor';
import orderService from '../order/orderService';
import paymentGatewayService from './paymentGatewayService';

class AutomatedPaymentMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  /**
   * Start automated monitoring
   */
  startMonitoring(intervalMs: number = 30000): void { // Check every 30 seconds
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkAndProcessPendingPayments();
    }, intervalMs);
    
    }
  
  /**
   * Stop automated monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    }
  
  /**
   * Check and process all pending payments automatically
   */
  async checkAndProcessPendingPayments(): Promise<void> {
    try {
      // Get orders with pending payments
      const pendingOrders = await orderService.getOrdersWithPendingPayments();
      
      if (pendingOrders.length === 0) {
        return;
      }
      
      for (const order of pendingOrders) {
        await this.processOrderPayment(order);
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Process payment for a specific order
   */
  private async processOrderPayment(order: any): Promise<void> {
    try {
      const paymentInfo = orderService.getPaymentInfoFromOrder(order);
      
      if (!paymentInfo.paymentId || !paymentInfo.paymentMethod) {
        return;
      }
      
      // Check payment status with Xendit
      const paymentStatus = await paymentGatewayService.checkPaymentStatusUniversal(
        paymentInfo.paymentId,
        paymentInfo.paymentMethod as any
      );
      
      if (paymentStatus.isPaid) {
        // Simulate webhook processing
        const mockWebhookData = {
          id: paymentInfo.paymentId,
          external_id: `${paymentInfo.paymentMethod.toLowerCase()}_${order.id}_${Date.now()}`,
          reference_id: order.id.toString(),
          status: 'COMPLETED',
          bank_code: 'BRI', // Default
          expected_amount: order.amount_total,
          received_amount: order.amount_total,
        };
        
        await webhookProcessor.processWebhook(mockWebhookData);
        
      } else {
        // Update payment status if changed
        if (paymentStatus.status !== paymentInfo.paymentStatus) {
          await orderService.updateOrderPaymentInfo(
            order.id,
            paymentInfo.paymentId,
            paymentInfo.paymentMethod,
            paymentStatus.status
          );
        }
      }
      
    } catch (error) {
      }
  }
  
  /**
   * Process existing completed payments (catch up on missed webhooks)
   */
  async processExistingCompletedPayments(): Promise<void> {
    try {
      // Get recent orders that might have completed payments
      const recentOrders = await orderService.getOrders({ limit: 20 });
      
      for (const order of recentOrders) {
        const paymentInfo = orderService.getPaymentInfoFromOrder(order);
        
        if (paymentInfo.paymentId && order.state !== 'sale') {
          try {
            const paymentStatus = await paymentGatewayService.checkPaymentStatusUniversal(
              paymentInfo.paymentId,
              paymentInfo.paymentMethod as any
            );
            
            if (paymentStatus.isPaid) {
              // Process as webhook
              const mockWebhookData = {
                id: paymentInfo.paymentId,
                external_id: `${paymentInfo.paymentMethod.toLowerCase()}_${order.id}_${Date.now()}`,
                reference_id: order.id.toString(),
                status: 'COMPLETED',
                expected_amount: order.amount_total,
                received_amount: order.amount_total,
              };
              
              await webhookProcessor.processWebhook(mockWebhookData);
            }
          } catch (error) {
            }
        }
      }
      
      } catch (error) {
      }
  }
  
  /**
   * Simulate webhook for testing
   */
  async simulateWebhookForOrder(orderId: string): Promise<void> {
    try {
      await webhookProcessor.simulatePaymentWebhook(orderId);
      } catch (error) {
      }
  }
  
  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    intervalActive: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      intervalActive: this.monitoringInterval !== null,
    };
  }
}

export default new AutomatedPaymentMonitor();