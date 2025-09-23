import apiClient from '../api/apiClient';
import { API_ENDPOINTS, ODOO_CONFIG } from '../config/api.config';

export type OrderStatus = 
  | 'draft'
  | 'sent'
  | 'sale'
  | 'done'
  | 'cancel'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'waiting_payment'
  | 'payment_confirmed'
  | 'admin_review'
  | 'approved'
  | 'return_approved'
  | 'inspecting';

export interface OrderLine {
  id: number;
  product_id: [number, string];
  product_name: string;
  product_uom_qty: number;
  quantity: number;
  price_unit: number;
  price_total: number;
  price_subtotal: number;
  discount?: number;
  tax_id?: number[];
  image?: any;
  image_128?: string | null;
}

export interface Order {
  id: number | string;
  name: string; // Order reference/number
  transactionId?: string;
  partner_id: [number, string];
  partner_name?: string;
  date_order: string;
  state: OrderStatus;
  statusText?: string;
  order_line: OrderLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_paid?: number;
  amount_residual?: number;
  currency_id?: [number, string];
  payment_term_id?: [number, string];
  pricelist_id?: [number, string];
  delivery_address?: string;
  shipping_method?: string;
  payment_method?: string;
  note?: string;
  totalItems?: number;
  items?: OrderItem[];
  // Payment tracking fields
  xendit_payment_id?: string;
  xendit_payment_method?: string;
  xendit_payment_status?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: any;
  image_128?: string | null;
}

export interface CreateOrderData {
  partner_id: number;
  order_line: Array<{
    product_id: number;
    product_uom_qty: number;
    price_unit?: number;
  }>;
  payment_method_id?: number;
  delivery_method_id?: number;
  note?: string;
  coupon_code?: string;
}

export interface OrderFilter {
  state?: OrderStatus;
  partner_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface Activity {
  id: string;
  type: 'order' | 'payment' | 'delivery' | 'review' | 'promo' | 'points' | 'consultation';
  title: string;
  description: string;
  date: string;
  icon?: string;
  status?: string;
  order?: Order;
  amount?: number;
  points?: number;
  image?: any;
}

class OrderService {
  /**
   * Get all orders for the current user
   */
  async getOrders(filter?: OrderFilter): Promise<Order[]> {
    try {
      // Build Odoo domain filter
      const domain: any[] = [];
      
      if (filter) {
        if (filter.state) domain.push(['state', '=', filter.state]);
        if (filter.partner_id) domain.push(['partner_id', '=', filter.partner_id]);
        if (filter.date_from) domain.push(['date_order', '>=', filter.date_from]);
        if (filter.date_to) domain.push(['date_order', '<=', filter.date_to]);
      }


      // Use Odoo JSON-RPC to get orders
      const orders = await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'search_read',
        [],
        {
          domain,
          fields: [
            'id',
            'name',
            'partner_id',
            'date_order',
            'state',
            'order_line',
            'amount_untaxed',
            'amount_tax',
            'amount_total',
            'currency_id',
            'payment_term_id',
            'pricelist_id',
            'note',
            'invoice_status',
            'delivery_count',
          ],
          limit: filter?.limit || 20,
          offset: filter?.offset || 0,
          order: 'date_order desc',
        }
      );


      // Get order lines details for each order
      for (const order of orders) {
        if (order.order_line && order.order_line.length > 0) {
          try {
            // First, get basic order line details without images to ensure orders load
            const orderLines = await apiClient.odooExecute(
              ODOO_CONFIG.MODELS.SALE_ORDER_LINE,
              'read',
              [order.order_line],
              {
                fields: [
                  'id',
                  'product_id',
                  'name',
                  'product_uom_qty',
                  'price_unit',
                  'price_total',
                  'price_subtotal',
                  'discount',
                  'tax_id',
                ],
              }
            );

            order.order_line = orderLines;

            // Try to get product images as a separate, non-critical operation
            const productIds = orderLines.map(line => line.product_id?.[0]).filter(Boolean);
            if (productIds.length > 0) {
              try {
                const productImages = await apiClient.odooExecute(
                  'product.product',
                  'read',
                  [productIds],
                  {
                    fields: ['id', 'image_128'],
                  }
                );

                // Map images to order lines
                const imageMap = new Map();
                productImages.forEach(product => {
                  if (product.image_128) {
                    imageMap.set(product.id, product.image_128);
                  }
                });

                // Assign images to order lines
                orderLines.forEach(line => {
                  if (line.product_id && line.product_id[0]) {
                    const productImage = imageMap.get(line.product_id[0]);
                    if (productImage) {
                      line.image_128 = productImage;
                    }
                  }
                });
              } catch (imageError) {
                // Continue without images - don't fail the entire order fetch
              }
            }
          } catch (orderLineError) {
            // Set empty order lines instead of failing the entire fetch
            order.order_line = [];
          }
        }
      }

      return this.transformOrders(orders);
    } catch (error) {
      // Return empty array if API fails
      return [];
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(partnerId: number): Promise<Order[]> {
    try {
      // Getting user orders
      
      const orders = await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'search_read',
        [],
        {
          domain: [['partner_id', '=', partnerId]],
          fields: [
            'id',
            'name',
            'partner_id',
            'date_order',
            'state',
            'order_line',
            'amount_untaxed',
            'amount_tax',
            'amount_total',
            'note',
          ],
          order: 'date_order desc',
          limit: 50,
        }
      );

      // Retrieved orders from Odoo
      
      return orders.map(order => this.transformOrder(order));
    } catch (error) {
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string | number): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      try {
        // Use the same approach as getOrders - search_read instead of read
        const orders = await apiClient.odooExecute(
          ODOO_CONFIG.MODELS.SALE_ORDER,
          'search_read',
          [],
          {
            domain: [['id', '=', parseInt(orderId.toString())]],
            fields: [
              'id',
              'name',
              'partner_id',
              'date_order',
              'state',
              'order_line',
              'amount_untaxed',
              'amount_tax',
              'amount_total',
              'currency_id',
              'payment_term_id',
              'pricelist_id',
              'note',
              'invoice_status',
              'delivery_count',
            ],
          }
        );

      if (!orders || orders.length === 0) {
        throw new Error('Order not found');
      }

      const order = orders[0];

      // Try to fetch order lines with images using the same approach as other working screens
      if (order.order_line && order.order_line.length > 0) {
        try {
          console.log('🔍 Fetching order lines like ActivityScreen...');

          // Get order lines first (simple call like getOrders does)
          const orderLines = await apiClient.odooExecute(
            ODOO_CONFIG.MODELS.SALE_ORDER_LINE,
            'search_read',
            [],
            {
              domain: [['id', 'in', order.order_line]],
              fields: [
                'id',
                'product_id',
                'name',
                'product_uom_qty',
                'price_unit',
                'price_total',
                'price_subtotal',
                'discount',
                'tax_id',
              ],
            }
          );

          if (orderLines && orderLines.length > 0) {
            console.log('✅ Got order lines, now fetching images like PromoScreen...');

            // Get product images using the same batch approach as getOrders
            const productIds = orderLines.map(line => line.product_id?.[0]).filter(Boolean);
            if (productIds.length > 0) {
              try {
                const productImages = await apiClient.odooExecute(
                  'product.product',
                  'search_read',
                  [],
                  {
                    domain: [['id', 'in', productIds]],
                    fields: ['id', 'image_128'],
                  }
                );

                console.log('✅ Got product images successfully');

                // Map images to order lines (same as getOrders)
                const imageMap = new Map();
                productImages.forEach(product => {
                  if (product.image_128) {
                    imageMap.set(product.id, product.image_128);
                  }
                });

                orderLines.forEach(line => {
                  if (line.product_id && line.product_id[0]) {
                    const productImage = imageMap.get(line.product_id[0]);
                    if (productImage) {
                      line.image_128 = productImage;
                    }
                  }
                });
              } catch (imageError) {
                console.log('⚠️ Image fetch failed, continuing without images:', imageError.message);
                // Continue without images - don't fail the entire method
              }
            }

            order.order_line = orderLines;
          }
        } catch (orderLineError) {
          console.log('⚠️ Order lines fetch failed, using basic order data:', orderLineError.message);
          // Continue with just the basic order data - don't fail
          order.order_line = [];
        }
      }
      
        return this.transformOrder(order);
      } catch (serverError) {
        console.log('Server error in getOrderById, trying to find in cached orders:', serverError);

        // Fallback: try to find the order in recently fetched orders
        try {
          const allOrders = await this.getOrders({ limit: 100 });
          const foundOrder = allOrders.find(order =>
            order.id.toString() === orderId.toString()
          );

          if (foundOrder) {
            console.log('Found order in cached data:', foundOrder.id);
            return foundOrder;
          }
        } catch (fallbackError) {
          console.log('Fallback also failed:', fallbackError);
        }

        // If all else fails, throw the original error
        throw serverError;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Creating order
      
      // Prepare order lines for Odoo
      const orderLines = orderData.order_line.map(line => [
        0, 0, {
          product_id: line.product_id,
          product_uom_qty: line.product_uom_qty,
          price_unit: line.price_unit,
        }
      ]);

      // Create order in Odoo
      const orderId = await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'create',
        [{
          partner_id: orderData.partner_id,
          order_line: orderLines,
          note: orderData.note || '',
        }]
      );

      // Order created successfully
      
      if (!orderId) {
        throw new Error('Failed to create order - no ID returned from Odoo');
      }

      // Read the created order
      const order = await this.getOrderById(orderId);

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string | number, reason?: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      // Call action_cancel method in Odoo
      await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'action_cancel',
        [[parseInt(orderId.toString())]]
      );

      // If there's a reason, update the note
      if (reason) {
        await apiClient.odooExecute(
          ODOO_CONFIG.MODELS.SALE_ORDER,
          'write',
          [[parseInt(orderId.toString())], { note: reason }]
        );
      }

      // Return the updated order
      return await this.getOrderById(orderId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(limit: number = 20): Promise<Order[]> {
    try {
      const response = await apiClient.get<Order[]>(
        API_ENDPOINTS.ORDERS.HISTORY,
        {
          params: { limit },
        }
      );

      return this.transformOrders(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get orders using Odoo JSON-RPC (alternative method)
   */
  async getOrdersOdooRpc(domain: any[] = [], limit: number = 20): Promise<Order[]> {
    try {
      // Search for order IDs
      const orderIds = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          ODOO_CONFIG.DATABASE,
          null,
          null,
          ODOO_CONFIG.MODELS.SALE_ORDER,
          'search',
          [domain],
          { limit, order: 'date_order desc' }
        ]
      );

      if (!orderIds || orderIds.length === 0) {
        return [];
      }

      // Read order data
      const orders = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          ODOO_CONFIG.DATABASE,
          null,
          null,
          ODOO_CONFIG.MODELS.SALE_ORDER,
          'read',
          [orderIds],
          {
            fields: [
              'name',
              'partner_id',
              'date_order',
              'state',
              'order_line',
              'amount_untaxed',
              'amount_tax',
              'amount_total',
              'currency_id',
              'payment_term_id',
              'pricelist_id',
              'note',
            ],
          }
        ]
      );

      // Get order lines details
      for (const order of orders) {
        if (order.order_line && order.order_line.length > 0) {
          const orderLines = await apiClient.jsonRpc(
            'object',
            'execute_kw',
            [
              ODOO_CONFIG.DATABASE,
              null,
              null,
              ODOO_CONFIG.MODELS.SALE_ORDER_LINE,
              'read',
              [order.order_line],
              {
                fields: [
                  'product_id',
                  'product_uom_qty',
                  'price_unit',
                  'price_total',
                  'price_subtotal',
                  'discount',
                  'tax_id',
                ],
              }
            ]
          );
          order.order_line = orderLines;
        }
      }

      return this.transformOrders(orders);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transform Odoo order data to match app format
   */
  private transformOrder(odooOrder: any): Order {
    // Extract custom status from note field if present
    let actualState: OrderStatus = odooOrder.state as OrderStatus;
    let statusText = '';
    
    if (odooOrder.note) {
      const statusMatch = odooOrder.note.match(/^\[([A-Z_]+)\]/);
      if (statusMatch) {
        const customStatus = statusMatch[1].toLowerCase().replace(/_/g, '_');
        // Map note prefix back to our custom status
        switch (customStatus) {
          case 'waiting_payment':
            actualState = 'waiting_payment';
            statusText = 'Menunggu Pembayaran';
            break;
          case 'payment_confirmed':
            actualState = 'payment_confirmed';
            statusText = 'Pembayaran Dikonfirmasi';
            break;
          case 'admin_review':
            actualState = 'admin_review';
            statusText = 'Sedang Ditinjau Admin';
            break;
          case 'approved':
            actualState = 'approved';
            statusText = 'Disetujui';
            break;
          case 'processing':
            actualState = 'processing';
            statusText = 'Sedang Diproses';
            break;
          case 'shipped':
            actualState = 'shipped';
            statusText = 'Dikirim';
            break;
          case 'delivered':
            actualState = 'delivered';
            statusText = 'Terkirim';
            break;
          default:
            actualState = customStatus as OrderStatus;
            statusText = customStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
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
      id: odooOrder.id,
      name: odooOrder.name || odooOrder.display_name,
      transactionId: odooOrder.name || `TRX-${odooOrder.id}`,
      partner_id: odooOrder.partner_id,
      partner_name: odooOrder.partner_id?.[1],
      date_order: odooOrder.date_order,
      state: actualState,
      statusText: statusText,
      order_line: this.transformOrderLines(odooOrder.order_line || []),
      amount_untaxed: odooOrder.amount_untaxed || 0,
      amount_tax: odooOrder.amount_tax || 0,
      amount_total: odooOrder.amount_total || 0,
      amount_paid: odooOrder.amount_paid,
      amount_residual: odooOrder.amount_residual,
      currency_id: odooOrder.currency_id,
      payment_term_id: odooOrder.payment_term_id,
      pricelist_id: odooOrder.pricelist_id,
      note: odooOrder.note,
      totalItems: odooOrder.order_line?.length || 0,
    };

    // Add simplified items for compatibility
    if (transformedOrder.order_line) {
      transformedOrder.items = transformedOrder.order_line.map(line => ({
        id: line.id ? line.id.toString() : `temp_${Math.random().toString(36).substr(2, 9)}`,
        name: line.product_name || line.product_id?.[1] || 'Product',
        quantity: line.product_uom_qty || line.quantity || 0,
        price: line.price_unit || 0,
        image_128: line.image_128 || null, // Use real image data from ODOO
        image: line.image_128 ? `data:image/jpeg;base64,${line.image_128}` : null,
      }));
    }

    return transformedOrder;
  }

  /**
   * Transform array of orders
   */
  private transformOrders(odooOrders: any[]): Order[] {
    if (!Array.isArray(odooOrders)) {
      return [];
    }
    return odooOrders.map(order => this.transformOrder(order));
  }

  /**
   * Transform order lines
   */
  private transformOrderLines(odooOrderLines: any[]): OrderLine[] {
    if (!Array.isArray(odooOrderLines)) {
      return [];
    }

    return odooOrderLines.map(line => {
      // Extract image from product relation field
      const image_128 = line['product_id.image_128'] || line.image_128 || null;

      return {
        id: line.id,
        product_id: line.product_id,
        product_name: line.product_id?.[1] || line.name || 'Product',
        product_uom_qty: line.product_uom_qty || 0,
        quantity: line.product_uom_qty || 0,
        price_unit: line.price_unit || 0,
        price_total: line.price_total || 0,
        price_subtotal: line.price_subtotal || 0,
        discount: line.discount,
        tax_id: line.tax_id,
        image_128: image_128,
        image: image_128 ? `data:image/jpeg;base64,${image_128}` : null,
      };
    });
  }

  /**
   * Confirm order (change state from draft to sale)
   */
  async confirmOrder(orderId: string | number): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      // Call action_confirm method in Odoo to confirm the order
      await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'action_confirm',
        [[parseInt(orderId.toString())]]
      );

      // Return the updated order
      return await this.getOrderById(orderId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string | number, status: OrderStatus): Promise<Order> {
    try {
      // Map custom statuses to valid Odoo states
      let odooState: string;
      let notePrefix = '';
      
      switch (status) {
        case 'waiting_payment':
          odooState = 'draft';
          notePrefix = '[WAITING_PAYMENT] ';
          break;
        case 'payment_confirmed':
          odooState = 'sale';
          notePrefix = '[PAYMENT_CONFIRMED] ';
          break;
        case 'admin_review':
          odooState = 'sale';
          notePrefix = '[ADMIN_REVIEW] ';
          break;
        case 'approved':
          odooState = 'sale';
          notePrefix = '[APPROVED] ';
          break;
        case 'processing':
          odooState = 'sale';
          notePrefix = '[PROCESSING] ';
          break;
        case 'shipped':
          odooState = 'sale';
          notePrefix = '[SHIPPED] ';
          break;
        case 'delivered':
          odooState = 'done';
          notePrefix = '[DELIVERED] ';
          break;
        case 'cancelled':
        case 'cancel':
          odooState = 'cancel';
          break;
        default:
          // Use the status as-is if it's a valid Odoo state
          if (['draft', 'sent', 'sale', 'done', 'cancel'].includes(status)) {
            odooState = status;
          } else {
            odooState = 'sale';
            notePrefix = `[${status.toUpperCase()}] `;
          }
      }

      // Get current order to preserve existing note
      const currentOrder = await this.getOrderById(orderId);
      const existingNote = currentOrder.note || '';
      
      // Remove any existing status prefix and add new one
      const cleanNote = existingNote.replace(/^\[[A-Z_]+\]\s*/, '');
      const newNote = notePrefix + cleanNote;

      // Update the order state and note in Odoo
      const updateData: any = { state: odooState };
      if (notePrefix) {
        updateData.note = newNote;
      }
      
      await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'write',
        [[parseInt(orderId.toString())], updateData]
      );

      // Return the updated order
      return await this.getOrderById(orderId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus, limit: number = 20): Promise<Order[]> {
    try {
      return await this.getOrders({
        state: status,
        limit,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user activities (orders, payments, deliveries, etc.)
   */
  async getActivities(limit: number = 50, partnerId?: number): Promise<Activity[]> {
    try {
      // Get recent orders for the specific user
      const filter: OrderFilter = { limit: 20 };
      if (partnerId) {
        filter.partner_id = partnerId;
      }
      
      const orders = await this.getOrders(filter);
      
      // Convert orders to activities with appropriate types
      const orderActivities: Activity[] = [];
      
      for (const order of orders) {
        // Create activity based on order status
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
            
          case 'admin_review':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Sedang Ditinjau Admin',
              description: `Pesanan ${order.name} sedang ditinjau oleh admin`,
              status: customState,
              icon: 'rate-review',
            });
            break;
            
          case 'processing':
          case 'inspecting':
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
            
          case 'return_approved':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Pengembalian Disetujui',
              description: `Pengembalian untuk pesanan ${order.name} telah disetujui`,
              status: customState,
              icon: 'assignment-return',
            });
            break;
            
          case 'approved':
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: 'Pesanan Disetujui',
              description: `Pesanan ${order.name} telah disetujui oleh admin`,
              status: customState,
              icon: 'verified',
            });
            break;
            
          default:
            // For standard Odoo states (sale, draft, etc.)
            orderActivities.push({
              ...baseActivity,
              type: 'order' as const,
              title: this.getActivityTitle(customState),
              description: `Pesanan ${order.name} - ${order.totalItems || 0} produk`,
              status: customState,
            });
        }
      }

      // Add some promotional activities if we have few orders
      const activities: Activity[] = [...orderActivities];
      
      if (activities.length < 5) {
        // Add a welcome promo for new users
        activities.push({
          id: 'promo_welcome',
          type: 'promo',
          title: 'Selamat Datang di PawSmart!',
          description: 'Dapatkan diskon 10% untuk pembelian pertama Anda',
          date: new Date().toISOString(),
          icon: 'local-offer',
        });
      }

      // Sort by date (newest first)
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      return sortedActivities;
    } catch (error) {
      // Return empty array instead of mock data if there's an error
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
      'admin_review': 'Sedang Ditinjau Admin',
      'approved': 'Pesanan Disetujui',
      'return_approved': 'Pengembalian Disetujui',
      'inspecting': 'Pemeriksaan Barang',
    };
    return titles[status] || 'Pesanan';
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
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Updating order payment info

      // Get current order to preserve existing note
      const currentOrder = await this.getOrderById(orderId);
      const existingNote = currentOrder.note || '';
      
      // Create payment info note
      const paymentInfo = `[PAYMENT] ${paymentMethod}:${paymentId}:${paymentStatus}`;
      
      // Remove any existing payment info and add new one
      const cleanNote = existingNote.replace(/\[PAYMENT\][^\n]*\n?/g, '');
      const newNote = `${paymentInfo}\n${cleanNote}`.trim();

      await apiClient.odooExecute(
        ODOO_CONFIG.MODELS.SALE_ORDER,
        'write',
        [[parseInt(orderId.toString())], { note: newNote }]
      );

      // Payment info updated
    } catch (error) {
      throw error;
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
   * Check if order has pending payment
   */
  async hasOrderPendingPayment(orderId: string | number): Promise<boolean> {
    try {
      const order = await this.getOrderById(orderId);
      const paymentInfo = this.getPaymentInfoFromOrder(order);
      
      return paymentInfo.paymentId && 
             paymentInfo.paymentStatus !== 'COMPLETED' && 
             paymentInfo.paymentStatus !== 'SUCCEEDED' &&
             paymentInfo.paymentStatus !== 'PAID';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get orders with pending payments
   */
  async getOrdersWithPendingPayments(): Promise<Order[]> {
    try {
      // Get recent orders
      const orders = await this.getOrders({ limit: 100 });
      
      // Filter orders with pending payments
      const pendingPaymentOrders = orders.filter(order => {
        const paymentInfo = this.getPaymentInfoFromOrder(order);
        return paymentInfo.paymentId && 
               paymentInfo.paymentStatus !== 'COMPLETED' && 
               paymentInfo.paymentStatus !== 'SUCCEEDED' &&
               paymentInfo.paymentStatus !== 'PAID' &&
               (order.state === 'waiting_payment' || order.note?.includes('[WAITING_PAYMENT]'));
      });

      return pendingPaymentOrders;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate mock activities for development
   */
  private generateMockActivities(): Activity[] {
    const now = new Date();
    
    return [
      {
        id: 'promo_1',
        type: 'promo',
        title: 'Promo Spesial Akhir Tahun!',
        description: 'Diskon hingga 50% untuk semua produk makanan kucing',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'local-offer',
      },
      {
        id: 'points_1',
        type: 'points',
        title: 'Poin Reward Bertambah',
        description: '+150 poin dari pembelian terakhir',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        points: 150,
        icon: 'stars',
      },
      {
        id: 'consultation_1',
        type: 'consultation',
        title: 'Konsultasi Dokter Hewan',
        description: 'Jadwal konsultasi dengan Dr. Sarah - 15:00 WIB',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'medical-services',
      },
      {
        id: 'review_1',
        type: 'review',
        title: 'Berikan Ulasan Produk',
        description: 'Bagaimana pengalaman Anda dengan Royal Canin?',
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'rate-review',
      },
      {
        id: 'delivery_1',
        type: 'delivery',
        title: 'Paket Telah Sampai',
        description: 'Pesanan #PN2024001 telah diterima',
        date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'local-shipping',
        status: 'delivered',
      },
      {
        id: 'payment_1',
        type: 'payment',
        title: 'Pembayaran Berhasil',
        description: 'Pembayaran untuk pesanan #PN2024002',
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'payment',
        amount: 120000,
      },
      {
        id: 'promo_2',
        type: 'promo',
        title: 'Flash Sale Hari Ini!',
        description: 'Beli 2 gratis 1 untuk produk tertentu',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        icon: 'flash-on',
      },
    ];
  }
}

export default new OrderService();