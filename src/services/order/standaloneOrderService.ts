import standaloneClient from '../api/standaloneClient';
import config from '../../config/environment';
import { Order, OrderLine, OrderStatus, CreateOrderData, OrderFilter, Activity } from './orderService';

class StandaloneOrderService {
  /**
   * Create a new order using standalone API
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      console.log('[StandaloneOrderService] Creating order...', orderData);

      // Create order via standalone API
      const response = await standaloneClient.post('/orders', orderData);

      console.log('[StandaloneOrderService] Order created successfully:', response);

      return this.transformOrder(response);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to create order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create order');
    }
  }

  /**
   * Get all orders for the current user
   */
  async getOrders(filter?: OrderFilter): Promise<Order[]> {
    try {
      console.log('[StandaloneOrderService] Fetching orders with filter:', filter);

      const params: any = {};
      if (filter) {
        if (filter.state) params.state = filter.state;
        if (filter.partner_id) params.partner_id = filter.partner_id;
        if (filter.date_from) params.date_from = filter.date_from;
        if (filter.date_to) params.date_to = filter.date_to;

        // Convert offset to page number for REST API
        if (filter.limit && filter.offset !== undefined) {
          const page = Math.floor(filter.offset / filter.limit) + 1;
          params.page = page;
          params.limit = filter.limit;
        } else if (filter.limit) {
          params.limit = filter.limit;
        }
      }

      const response = await standaloneClient.get('/orders', { params });

      console.log('[StandaloneOrderService] Raw response type:', typeof response);
      console.log('[StandaloneOrderService] Response structure:', {
        isArray: Array.isArray(response),
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        dataIsArray: Array.isArray(response?.data)
      });

      // Backend may return: array directly, {success, data: array}, or {data: array}
      let orders;
      if (response?.success && response?.data) {
        // Format: {success: true, data: [...]}
        orders = Array.isArray(response.data) ? response.data : [];
      } else if (response?.data && !response?.success) {
        // Format: {data: [...]}
        orders = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        // Direct array
        orders = response;
      } else {
        orders = [];
      }

      console.log('[StandaloneOrderService] Fetched orders:', orders.length);

      // Log order statuses for debugging
      if (orders.length > 0) {
        console.log('[StandaloneOrderService] Sample order statuses:',
          orders.slice(0, 3).map((o: any) => ({
            id: o.id,
            state: o.state,
            custom_status: o.custom_status,
            name: o.name,
            notes: o.notes?.substring(0, 100),
            xendit_payment_status: o.xendit_payment_status
          }))
        );
      }

      return orders.map((order: any) => this.transformOrder(order));
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch orders:', error);
      return [];
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string | number): Promise<Order> {
    try {
      console.log('[StandaloneOrderService] Fetching order by ID:', orderId, 'Type:', typeof orderId);
      console.log('[StandaloneOrderService] API URL will be: /orders/' + orderId);

      const response = await standaloneClient.get(`/orders/${orderId}`);

      console.log('[StandaloneOrderService] Raw API response:', JSON.stringify(response).substring(0, 500));
      console.log('[StandaloneOrderService] Response type:', typeof response);
      console.log('[StandaloneOrderService] Response structure:', {
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        hasOrder: !!response?.data?.order,
        hasOrderLines: !!response?.data?.order_lines,
        orderHasOrderLine: !!response?.data?.order?.order_line,
        orderHasOrderLines: !!response?.data?.order?.order_lines
      });

      // Backend returns nested structure: {success, data: {order, order_lines}}
      let order;
      if (response?.success && response?.data?.order) {
        // Format: {success: true, data: {order: {...}, order_lines: [...]}}
        order = response.data.order;
        // Attach order_lines if they exist separately
        if (response.data.order_lines) {
          order.order_line = response.data.order_lines;
        }
        // Check if order_line is already in the order object
        if (!order.order_line && order.order_lines) {
          order.order_line = order.order_lines;
        }
      } else if (response?.data) {
        // Fallback: {data: {...}} or direct order object in data
        order = response.data;
      } else if (response?.order_line || response?.id) {
        // Direct response (has order properties)
        order = response;
      } else {
        console.error('[StandaloneOrderService] Unexpected response format:', response);
        throw new Error('Invalid response format from backend');
      }

      console.log('[StandaloneOrderService] Order extracted:', {
        id: order?.id,
        name: order?.name,
        state: order?.state,
        hasOrderLines: !!order?.order_line,
        orderLineCount: order?.order_line?.length
      });

      return this.transformOrder(order);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch order:', error);
      console.error('[StandaloneOrderService] Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch order');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string | number, status: OrderStatus): Promise<Order> {
    try {
      console.log('[StandaloneOrderService] Updating order status:', orderId, status);

      const response = await standaloneClient.put(`/orders/${orderId}/status`, {
        status,
        custom_status: status
      });

      console.log('[StandaloneOrderService] Order status updated successfully');

      // Fetch the updated order
      return await this.getOrderById(orderId);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to update order status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update order status');
    }
  }

  /**
   * Update order payment information
   */
  async updateOrderPaymentInfo(
    orderId: string | number,
    paymentId: string,
    paymentMethod: string,
    paymentStatus: string
  ): Promise<void> {
    try {
      console.log('[StandaloneOrderService] Updating payment info:', orderId);

      await standaloneClient.put(`/orders/${orderId}/payment`, {
        payment_id: paymentId,
        payment_method: paymentMethod,
        payment_status: paymentStatus
      });

      console.log('[StandaloneOrderService] Payment info updated successfully');
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to update payment info:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update payment info');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string | number, reason?: string): Promise<Order> {
    try {
      console.log('[StandaloneOrderService] Cancelling order:', orderId);

      const response = await standaloneClient.post(`/orders/${orderId}/cancel`, {
        reason
      });

      console.log('[StandaloneOrderService] Order cancelled successfully');

      // Fetch the updated order
      return await this.getOrderById(orderId);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to cancel order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to cancel order');
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(partnerId: number): Promise<Order[]> {
    try {
      console.log('[StandaloneOrderService] Fetching user orders for partner:', partnerId);

      return await this.getOrders({
        partner_id: partnerId,
        limit: 50
      });
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch user orders:', error);
      return [];
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus, limit: number = 20): Promise<Order[]> {
    try {
      console.log('[StandaloneOrderService] Fetching orders by status:', status);

      return await this.getOrders({
        state: status,
        limit
      });
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch orders by status:', error);
      return [];
    }
  }

  /**
   * Get user activities (orders, payments, deliveries, etc.)
   */
  async getActivities(limit: number = 50, partnerId?: number): Promise<Activity[]> {
    try {
      console.log('[StandaloneOrderService] Fetching activities');

      const filter: OrderFilter = { limit: 20 };
      if (partnerId) {
        filter.partner_id = partnerId;
      }

      const orders = await this.getOrders(filter);

      const orderActivities: Activity[] = [];

      for (const order of orders) {
        const baseActivity = {
          id: `order_${order.id}_${order.state}`,
          date: order.date_order,
          order: order,
          amount: order.amount_total,
        };

        // Check for custom status in note field first
        let customState = order.state;
        if (order.note) {
          const statusMatch = order.note.match(/^\[([A-Z_]+)\]/);
          if (statusMatch) {
            customState = statusMatch[1].toLowerCase() as OrderStatus;
          }
        }

        // Add appropriate activity type based on status
        switch (customState) {
          case 'waiting_payment':
          case 'pending':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Menunggu Pembayaran',
              description: `Pesanan ${order.name} - Selesaikan pembayaran sebelum batas waktu`,
              status: customState,
              icon: 'access-time',
            });
            break;

          case 'payment_confirmed':
            orderActivities.push({
              ...baseActivity,
              type: 'payment' as const,
              title: 'Pembayaran Berhasil',
              description: `Pembayaran untuk pesanan ${order.name} telah dikonfirmasi`,
              status: customState,
              icon: 'payment',
            });
            break;

          case 'processing':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Pesanan Diproses',
              description: `Pesanan ${order.name} sedang diproses - ${order.totalItems || 0} produk`,
              status: customState,
              icon: 'inventory',
            });
            break;

          case 'shipped':
            orderActivities.push({
              ...baseActivity,
              type: 'delivery' as const,
              title: 'Pesanan Dikirim',
              description: `Pesanan ${order.name} sedang dalam perjalanan`,
              status: customState,
              icon: 'local-shipping',
            });
            break;

          case 'delivered':
          case 'done':
            orderActivities.push({
              ...baseActivity,
              type: 'delivery' as const,
              title: 'Pesanan Selesai',
              description: `Pesanan ${order.name} telah diterima`,
              status: customState,
              icon: 'check-circle',
            });
            break;

          case 'cancelled':
          case 'cancel':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Pesanan Dibatalkan',
              description: `Pesanan ${order.name} telah dibatalkan`,
              status: customState,
              icon: 'cancel',
            });
            break;

          default:
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: this.getActivityTitle(customState),
              description: `Pesanan ${order.name} - ${order.totalItems || 0} produk`,
              status: customState,
            });
        }
      }

      const activities: Activity[] = [...orderActivities];

      // Sort by date (newest first)
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch activities:', error);
      return [];
    }
  }

  /**
   * Get activity title based on order status
   */
  private getActivityTitle(status: OrderStatus): string {
    const titles: { [key: string]: string } = {
      'draft': 'Pesanan Draft',
      'sent': 'Penawaran Terkirim',
      'sale': 'Pesanan Dikonfirmasi',
      'done': 'Pesanan Selesai',
      'cancel': 'Pesanan Dibatalkan',
      'pending': 'Menunggu Pembayaran',
      'processing': 'Pesanan Diproses',
      'shipped': 'Pesanan Dikirim',
      'delivered': 'Pesanan Diterima',
      'cancelled': 'Pesanan Dibatalkan',
      'waiting_payment': 'Menunggu Pembayaran',
      'payment_confirmed': 'Pembayaran Dikonfirmasi',
    };
    return titles[status] || 'Pesanan';
  }

  /**
   * Confirm order (change state from draft to sale)
   */
  async confirmOrder(orderId: string | number): Promise<Order> {
    try {
      console.log('[StandaloneOrderService] Confirming order:', orderId);

      await standaloneClient.put(`/orders/${orderId}/status`, {
        status: 'sale',
        custom_status: 'payment_confirmed'
      });

      console.log('[StandaloneOrderService] Order confirmed successfully');

      return await this.getOrderById(orderId);
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to confirm order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to confirm order');
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(limit: number = 20): Promise<Order[]> {
    try {
      console.log('[StandaloneOrderService] Fetching order history');

      return await this.getOrders({ limit });
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch order history:', error);
      return [];
    }
  }

  /**
   * Check if order has pending payment
   */
  async hasOrderPendingPayment(orderId: string | number): Promise<boolean> {
    try {
      const order = await this.getOrderById(orderId);
      const paymentInfo = this.getPaymentInfoFromOrder(order);

      return (
        !!paymentInfo.paymentId &&
        paymentInfo.paymentStatus !== 'COMPLETED' &&
        paymentInfo.paymentStatus !== 'SUCCEEDED' &&
        paymentInfo.paymentStatus !== 'PAID'
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get orders with pending payments
   */
  async getOrdersWithPendingPayments(): Promise<Order[]> {
    try {
      console.log('[StandaloneOrderService] Fetching orders with pending payments');

      const orders = await this.getOrders({ limit: 100 });

      const pendingPaymentOrders = orders.filter((order) => {
        const paymentInfo = this.getPaymentInfoFromOrder(order);
        return (
          paymentInfo.paymentId &&
          paymentInfo.paymentStatus !== 'COMPLETED' &&
          paymentInfo.paymentStatus !== 'SUCCEEDED' &&
          paymentInfo.paymentStatus !== 'PAID' &&
          order.state === 'waiting_payment'
        );
      });

      return pendingPaymentOrders;
    } catch (error: any) {
      console.error('[StandaloneOrderService] Failed to fetch pending payment orders:', error);
      return [];
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
    // Check if order has xendit payment fields (REST API)
    if (order.xendit_payment_id) {
      return {
        paymentId: order.xendit_payment_id,
        paymentMethod: order.xendit_payment_method,
        paymentStatus: order.xendit_payment_status,
      };
    }

    // Fallback to note parsing (Odoo compatibility)
    if (!order.note) {
      return {};
    }

    const paymentMatch = order.note.match(/\[PAYMENT\]\s*([^:]+):([^:]+):([^\n]+)/);
    if (paymentMatch) {
      return {
        paymentMethod: paymentMatch[1],
        paymentId: paymentMatch[2],
        paymentStatus: paymentMatch[3],
      };
    }

    return {};
  }

  /**
   * Transform API order data to match app format
   */
  private transformOrder(apiOrder: any): Order {
    // Extract custom status - prioritize custom_status field from REST API
    let actualState: OrderStatus = apiOrder.state as OrderStatus;
    let statusText = '';

    console.log('[StandaloneOrderService] Transforming order:', {
      id: apiOrder.id,
      rawState: apiOrder.state,
      custom_status: apiOrder.custom_status,
      xendit_payment_status: apiOrder.xendit_payment_status,
      hasNotes: !!apiOrder.notes
    });

    // First check for custom_status field from REST API (preferred)
    if (apiOrder.custom_status) {
      actualState = apiOrder.custom_status as OrderStatus;
      // Generate status text from custom_status
      statusText = apiOrder.custom_status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    // Fallback to note field parsing (for legacy orders with [STATUS] in notes)
    else if (apiOrder.note || apiOrder.notes) {
      const note = apiOrder.note || apiOrder.notes;
      const statusMatch = note.match(/^\[([A-Z_]+)\]/);
      if (statusMatch) {
        const customStatus = statusMatch[1].toLowerCase().replace(/_/g, '_');
        // Only use note status if it's a valid order status (not REGULAR_ORDER, AUTOKIRIM_ORDER, etc.)
        const validStatuses = ['waiting_payment', 'payment_confirmed', 'admin_review', 'approved',
                              'processing', 'shipped', 'delivered', 'cancelled', 'pending'];
        if (validStatuses.includes(customStatus)) {
          actualState = customStatus as OrderStatus;
          statusText = customStatus.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        }
      }
    }

    // If state is still not a valid order status, check payment status to determine state
    if (apiOrder.state === 'regular_order' || apiOrder.state === 'autokirim_order') {
      // Check Xendit payment status to determine actual order state
      const paymentStatus = apiOrder.xendit_payment_status;

      if (paymentStatus === 'PAID' ||
          paymentStatus === 'SETTLED' ||
          paymentStatus === 'COMPLETED' ||
          paymentStatus === 'SUCCEEDED') {
        // Payment confirmed - user can track
        actualState = 'payment_confirmed';
        statusText = 'Pembayaran Dikonfirmasi';
      } else if (paymentStatus === 'PENDING' ||
                 paymentStatus === 'AWAITING_PAYMENT') {
        // Payment pending - user needs to pay
        actualState = 'waiting_payment';
        statusText = 'Menunggu Pembayaran';
      } else if (!paymentStatus || paymentStatus === 'CREATED') {
        // No payment yet - default to waiting payment
        actualState = 'waiting_payment';
        statusText = 'Menunggu Pembayaran';
      } else {
        // Unknown payment status - default to waiting payment for safety
        console.warn('[StandaloneOrderService] Unknown payment status:', paymentStatus);
        actualState = 'waiting_payment';
        statusText = 'Menunggu Pembayaran';
      }

      console.log('[StandaloneOrderService] Resolved state for order', apiOrder.id, ':', {
        from: apiOrder.state,
        to: actualState,
        paymentStatus,
        statusText
      });
    }

    // Default status text if not set
    if (!statusText) {
      const statusMap: { [key: string]: string } = {
        'draft': 'Draft',
        'sent': 'Quotation Sent',
        'sale': 'Sales Order',
        'done': 'Completed',
        'cancel': 'Cancelled',
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
      };
      statusText = statusMap[actualState] || actualState;
    }

    const transformedOrder: Order = {
      id: apiOrder.id,
      name: apiOrder.name || `Order ${apiOrder.id}`,
      transactionId: apiOrder.name || `TRX-${apiOrder.id}`,
      partner_id: apiOrder.partner_id,
      partner_name: apiOrder.partner_id?.[1],
      date_order: apiOrder.date_order || apiOrder.order_date,
      state: actualState,
      statusText: statusText,
      order_line: this.transformOrderLines(apiOrder.order_line || []),
      amount_untaxed: apiOrder.amount_untaxed || 0,
      amount_tax: apiOrder.amount_tax || 0,
      amount_total: apiOrder.amount_total || 0,
      amount_paid: apiOrder.amount_paid || 0,
      amount_residual: apiOrder.amount_residual || 0,
      currency_id: apiOrder.currency_id,
      note: apiOrder.note || apiOrder.notes,
      totalItems: apiOrder.order_line?.length || 0,
      xendit_payment_id: apiOrder.xendit_payment_id,
      xendit_payment_method: apiOrder.xendit_payment_method,
      xendit_payment_status: apiOrder.xendit_payment_status,
    };

    // Add simplified items for compatibility
    if (transformedOrder.order_line) {
      transformedOrder.items = transformedOrder.order_line.map(line => ({
        id: line.id ? line.id.toString() : `temp_${Math.random().toString(36).substr(2, 9)}`,
        name: line.product_name || line.product_id?.[1] || 'Product',
        quantity: line.product_uom_qty || line.quantity || 0,
        price: line.price_unit || 0,
        image_128: line.image_128 || null,
        image: line.image_128 ? `data:image/jpeg;base64,${line.image_128}` : null,
      }));
    }

    return transformedOrder;
  }

  /**
   * Transform order lines
   */
  private transformOrderLines(apiOrderLines: any[]): OrderLine[] {
    if (!Array.isArray(apiOrderLines)) {
      return [];
    }

    return apiOrderLines.map(line => {
      const image_128 = line['product_id.image_128'] || line.image_128 || null;

      return {
        id: line.id,
        product_id: line.product_id,
        product_name: line.product_name || line.product_id?.[1] || line.name || 'Product',
        product_uom_qty: line.product_uom_qty || line.quantity || 0,
        quantity: line.product_uom_qty || line.quantity || 0,
        price_unit: line.price_unit || 0,
        price_total: line.price_total || 0,
        price_subtotal: line.price_subtotal || 0,
        discount: line.discount,
        tax_id: line.tax_id || [],
        image_128: image_128,
        image: image_128 ? `data:image/jpeg;base64,${image_128}` : null,
      };
    });
  }
}

export default new StandaloneOrderService();
