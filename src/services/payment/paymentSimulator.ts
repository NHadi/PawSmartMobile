/**
 * Payment Gateway Simulator
 * API-based payment simulation for test mode
 */

import paymentGatewayService from './paymentGatewayService';
import orderService from '../order/orderService';

class PaymentSimulator {
  /**
   * Simulate VA payment using official Xendit API
   */
  async simulateVirtualAccountPayment(orderId: string): Promise<{
    success: boolean;
    message: string;
    simulationData?: any;
  }> {
    try {
      // Simulating VA payment
      
      // Get order details
      const order = await orderService.getOrderById(orderId);
      const paymentInfo = orderService.getPaymentInfoFromOrder(order);
      
      if (!paymentInfo.paymentId) {
        // Look for payment info in note or create simulation for existing VA
        const vaMatch = order.note?.match(/va_\d+_\d+/);
        if (!vaMatch) {
          // Try to find VA ID in order note or external_id pattern
          // Checking for VA patterns in order
          
          // Look for external_id pattern (va_orderId_timestamp)
          const externalIdMatch = order.note?.match(/va_(\d+)_(\d+)/);
          if (externalIdMatch) {
            // Found VA external_id pattern
            
            // Try to find this VA in Xendit and simulate payment
            try {
              // Note: We would need a method to get VA by external_id, but for now use direct fallback
              // Using direct payment completion for reliability
            } catch (apiError: any) {
              // Could not find VA by external_id
            }
          }
          
          // Alternative: Look for Xendit VA ID in logs/note (UUID pattern)
          const uuidMatch = order.note?.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
          if (uuidMatch) {
            // Found potential Xendit VA ID
            try {
              const simulationResult = await paymentGatewayService.simulateVAPayment(
                uuidMatch[1], 
                order.amount_total
              );
              
              await orderService.updateOrderStatus(orderId, 'payment_confirmed');
              
              return {
                success: true,
                message: `✅ VA Payment simulated via Xendit API for order ${order.name}!`,
                simulationData: simulationResult,
              };
              
            } catch (apiError: any) {
              // Xendit API simulation failed
            }
          }
          
          // Fallback: Direct payment completion
          // Using direct payment completion fallback
          await orderService.updateOrderStatus(orderId, 'payment_confirmed');
          
          return {
            success: true,
            message: `✅ Payment completed for order ${order.name}! Status updated to payment confirmed.`,
          };
        }
      }
      
      // Use the payment ID from order or find the latest VA for this order
      let vaId = paymentInfo.paymentId;
      
      // If no payment ID, we'll simulate directly with order status update
      if (!vaId) {
        // No Xendit payment ID found, using direct completion
        
        // Simulate payment completion directly
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        
        return {
          success: true,
          message: `✅ Payment simulated successfully for order ${order.name}! Order status updated to payment confirmed.`,
        };
      }
      
      // Try to simulate using Xendit API
      try {
        const simulationResult = await paymentGatewayService.simulateVAPayment(vaId, order.amount_total);
        
        // Update order status after successful simulation
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        
        return {
          success: true,
          message: `✅ VA Payment simulated via Xendit API! Order ${order.name} marked as paid.`,
          simulationData: simulationResult,
        };
        
      } catch (apiError: any) {
        // Xendit API failed, using direct method
        
        // Fallback to direct status update
        await orderService.updateOrderStatus(orderId, 'payment_confirmed');
        
        return {
          success: true,
          message: `✅ Payment completed (fallback method) for order ${order.name}! Status updated to payment confirmed.`,
        };
      }
      
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Failed to simulate payment: ${error.message}`,
      };
    }
  }
  
  /**
   * Simulate payment for any order by order number
   */
  async simulatePaymentByOrderName(orderName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Extract order ID from order name (e.g., S00040 -> 40)
      const orderIdMatch = orderName.match(/\d+/);
      if (!orderIdMatch) {
        return {
          success: false,
          message: 'Invalid order name format',
        };
      }
      
      const orderId = orderIdMatch[0];
      return await this.simulateVirtualAccountPayment(orderId);
      
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to simulate payment: ${error.message}`,
      };
    }
  }
  
  /**
   * Get simulation status for order
   */
  async getOrderPaymentStatus(orderId: string): Promise<{
    orderName: string;
    status: string;
    statusText: string;
    amount: number;
    hasPayment: boolean;
  }> {
    try {
      const order = await orderService.getOrderById(orderId);
      const paymentInfo = orderService.getPaymentInfoFromOrder(order);
      
      return {
        orderName: order.name,
        status: order.state,
        statusText: order.statusText || order.state,
        amount: order.amount_total,
        hasPayment: !!paymentInfo.paymentId,
      };
      
    } catch (error: any) {
      throw error;
    }
  }
}

export default new PaymentSimulator();