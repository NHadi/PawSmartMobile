import config from '../../config/environment';
import orderService, { Order, OrderFilter, OrderStatus, CreateOrderData, Activity } from './orderService';
import standaloneOrderService from './standaloneOrderService';

class UnifiedOrderService {
  /**
   * Get all orders for the current user
   * Routes to appropriate service based on configuration
   */
  async getOrders(filter?: OrderFilter): Promise<Order[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getOrders(filter);
    } else {
      return orderService.getOrders(filter);
    }
  }

  /**
   * Get user's orders by partner ID
   */
  async getUserOrders(partnerId: number): Promise<Order[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getUserOrders(partnerId);
    } else {
      return orderService.getUserOrders(partnerId);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string | number): Promise<Order> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getOrderById(orderId);
    } else {
      return orderService.getOrderById(orderId);
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.createOrder(orderData);
    } else {
      return orderService.createOrder(orderData);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string | number, reason?: string): Promise<Order> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.cancelOrder(orderId, reason);
    } else {
      return orderService.cancelOrder(orderId, reason);
    }
  }

  /**
   * Confirm order
   */
  async confirmOrder(orderId: string | number): Promise<Order> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.confirmOrder(orderId);
    } else {
      return orderService.confirmOrder(orderId);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string | number, status: OrderStatus): Promise<Order> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.updateOrderStatus(orderId, status);
    } else {
      return orderService.updateOrderStatus(orderId, status);
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus, limit: number = 20): Promise<Order[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getOrdersByStatus(status, limit);
    } else {
      return orderService.getOrdersByStatus(status, limit);
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(limit: number = 20): Promise<Order[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getOrderHistory(limit);
    } else {
      return orderService.getOrderHistory(limit);
    }
  }

  /**
   * Get user activities (orders, payments, deliveries, etc.)
   */
  async getActivities(limit: number = 50, partnerId?: number): Promise<Activity[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getActivities(limit, partnerId);
    } else {
      return orderService.getActivities(limit, partnerId);
    }
  }

  /**
   * Update order with payment information
   */
  async updateOrderPaymentInfo(
    orderId: string | number,
    paymentId: string,
    paymentMethod: string,
    paymentStatus: string
  ): Promise<void> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.updateOrderPaymentInfo(orderId, paymentId, paymentMethod, paymentStatus);
    } else {
      return orderService.updateOrderPaymentInfo(orderId, paymentId, paymentMethod, paymentStatus);
    }
  }

  /**
   * Get payment info from order
   */
  getPaymentInfoFromOrder(order: Order): {
    paymentId?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  } {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getPaymentInfoFromOrder(order);
    } else {
      return orderService.getPaymentInfoFromOrder(order);
    }
  }

  /**
   * Check if order has pending payment
   */
  async hasOrderPendingPayment(orderId: string | number): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.hasOrderPendingPayment(orderId);
    } else {
      return orderService.hasOrderPendingPayment(orderId);
    }
  }

  /**
   * Get orders with pending payments
   */
  async getOrdersWithPendingPayments(): Promise<Order[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneOrderService.getOrdersWithPendingPayments();
    } else {
      return orderService.getOrdersWithPendingPayments();
    }
  }
}

export default new UnifiedOrderService();
