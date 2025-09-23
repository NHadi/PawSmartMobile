import axios from 'axios';
import apiClient from '../api/apiClient';
import { API_CONFIG } from '../config/api.config';

/**
 * Unified Odoo Service (formerly odooComService)
 * Combines all Odoo operations in a single service
 * Supports both standard Odoo and Odoo.com specific features
 */
class OdooComService {
  private sessionId: string | null = null;
  private csrfToken: string | null = null;

  // ============================================
  // Core CRUD Operations (added from odooClient)
  // ============================================

  /**
   * Search and read records from Odoo model
   */
  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    options: {
      limit?: number;
      offset?: number;
      order?: string;
    } = {}
  ): Promise<any[]> {
    try {
      return await apiClient.odooExecute(
        model,
        'search_read',
        [],
        {
          domain,
          fields,
          limit: options.limit || 100,
          offset: options.offset || 0,
          order: options.order || 'id ASC',
        }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new record in Odoo model
   */
  async create(model: string, data: any): Promise<number> {
    try {
      return await apiClient.odooExecute(model, 'create', [data]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Read records by IDs from Odoo model
   */
  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    try {
      return await apiClient.odooExecute(
        model,
        'read',
        [ids],
        fields.length > 0 ? { fields } : {}
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update records in Odoo model
   */
  async write(model: string, ids: number[], data: any): Promise<boolean> {
    try {
      return await apiClient.odooExecute(model, 'write', [ids, data]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete records from Odoo model (actually unlink in Odoo)
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    try {
      return await apiClient.odooExecute(model, 'unlink', [ids]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for record IDs matching domain
   */
  async search(
    model: string,
    domain: any[] = [],
    options: {
      limit?: number;
      offset?: number;
      order?: string;
    } = {}
  ): Promise<number[]> {
    try {
      return await apiClient.odooExecute(
        model,
        'search',
        [domain],
        {
          limit: options.limit || 100,
          offset: options.offset || 0,
          order: options.order || 'id ASC',
        }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count records matching domain
   */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    try {
      return await apiClient.odooExecute(model, 'search_count', [domain]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute any custom method on Odoo model
   */
  async execute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    try {
      return await apiClient.odooExecute(model, method, args, kwargs);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get fields information for a model
   */
  async fieldsGet(model: string, attributes: string[] = []): Promise<any> {
    try {
      return await apiClient.odooExecute(
        model,
        'fields_get',
        [],
        attributes.length > 0 ? { attributes } : {}
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Name search for records (useful for many2one fields)
   */
  async nameSearch(
    model: string,
    name: string = '',
    domain: any[] = [],
    options: {
      limit?: number;
      operator?: string;
    } = {}
  ): Promise<Array<[number, string]>> {
    try {
      return await apiClient.odooExecute(
        model,
        'name_search',
        [],
        {
          name,
          args: domain,
          operator: options.operator || 'ilike',
          limit: options.limit || 100,
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Odoo.com Specific Methods (original methods)
  // ============================================

  /**
   * Authenticate with Odoo.com using mobile API key or username/password
   */
  async authenticate(username: string, password: string): Promise<any> {
    try {
      // First, get session info
      const sessionResponse = await axios.post(
        `${API_CONFIG.BASE_URL}/web/session/get_session_info`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      // Then authenticate
      const authResponse = await axios.post(
        `${API_CONFIG.BASE_URL}/web/session/authenticate`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: 'petnexus',
            login: username,
            password: password,
            // Use API key if available
            context: API_CONFIG.API_KEY ? { api_key: API_CONFIG.API_KEY } : {},
          },
          id: new Date().getTime(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (authResponse.data.result && authResponse.data.result.uid) {
        this.sessionId = authResponse.data.result.session_id;
        this.csrfToken = authResponse.data.result.csrf_token;
        
        return {
          success: true,
          uid: authResponse.data.result.uid,
          username: authResponse.data.result.username,
          name: authResponse.data.result.name,
          partner_id: authResponse.data.result.partner_id,
          session_id: this.sessionId,
        };
      }

      return {
        success: false,
        error: 'Authentication failed',
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Make authenticated API call using Odoo.com's web/dataset/call_kw endpoint
   */
  async callKw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: any = {}
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/web/dataset/call_kw/${model}/${method}`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: model,
            method: method,
            args: args,
            kwargs: {
              ...kwargs,
              context: {
                ...kwargs.context,
                api_key: API_CONFIG.API_KEY,
              },
            },
          },
          id: new Date().getTime(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
          },
          withCredentials: true,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message || 'API Error');
      }

      return response.data.result;
    } catch (error: any) {
      throw error;
    }
  }

  // ============================================
  // Business Logic Methods
  // ============================================

  /**
   * Get products from Odoo
   */
  async getProducts(filter: any = {}): Promise<any[]> {
    try {
      const domain: any[] = [['sale_ok', '=', true]];
      
      if (filter.category_id) {
        domain.push(['categ_id', '=', filter.category_id]);
      }
      
      if (filter.search) {
        domain.push(['name', 'ilike', filter.search]);
      }

      const products = await this.searchRead(
        'product.product',
        domain,
        [
          'id',
          'name',
          'display_name',
          'list_price',
          'standard_price',
          'qty_available',
          'virtual_available',
          'categ_id',
          'image_1920',
          'description_sale',
          'barcode',
          'default_code',
          'type',
          'uom_id',
        ],
        {
          limit: filter.limit || 20,
          offset: filter.offset || 0,
          order: 'name asc',
        }
      );

      // Transform to app format
      return products.map((product: any) => ({
        id: product.id,
        name: product.name || product.display_name,
        price: product.list_price || 0,
        originalPrice: product.standard_price || product.list_price || 0,
        discount: this.calculateDiscount(product.list_price, product.standard_price),
        qty_available: product.qty_available || 0,
        virtual_available: product.virtual_available || 0,
        category: product.categ_id ? product.categ_id[1] : 'Uncategorized',
        categ_id: product.categ_id,
        image: product.image_1920 
          ? { uri: `data:image/jpeg;base64,${product.image_1920}` }
          : require('../../../assets/product-placeholder.jpg'),
        description: product.description_sale || '',
        barcode: product.barcode || '',
        default_code: product.default_code || '',
        rating: 4.5, // Mock for now
        sold: Math.floor(Math.random() * 1000), // Mock for now
        isRecommended: Math.random() > 0.5, // Mock for now
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const categories = await this.searchRead(
        'product.category',
        [],
        ['id', 'name', 'display_name', 'parent_id', 'child_id'],
        {
          limit: 100,
          offset: 0,
          order: 'name',
        }
      );

      return categories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get orders
   */
  async getOrders(partnerId?: number): Promise<any[]> {
    try {
      const domain: any[] = [];
      
      if (partnerId) {
        domain.push(['partner_id', '=', partnerId]);
      }

      const orders = await this.searchRead(
        'sale.order',
        domain,
        [
          'id',
          'name',
          'partner_id',
          'date_order',
          'state',
          'amount_total',
          'amount_untaxed',
          'amount_tax',
          'order_line',
          'invoice_status',
          'delivery_status',
        ],
        {
          limit: 20,
          offset: 0,
          order: 'date_order desc',
        }
      );

      return orders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      const orderId = await this.create(
        'sale.order',
        {
          partner_id: orderData.partner_id,
          order_line: orderData.order_line.map((line: any) => [
            0, 0, {
              product_id: line.product_id,
              product_uom_qty: line.quantity,
              price_unit: line.price,
            }
          ]),
          note: orderData.note || '',
        }
      );

      // Read the created order
      const order = await this.read(
        'sale.order',
        [orderId],
        ['name', 'state', 'amount_total']
      );

      return order[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscount(listPrice?: number, standardPrice?: number): number {
    if (!listPrice || !standardPrice || standardPrice >= listPrice) {
      return 0;
    }
    return Math.round(((listPrice - standardPrice) / listPrice) * 100);
  }

  /**
   * Direct authentication with API key (for mobile apps)
   */
  async authenticateWithApiKey(): Promise<any> {
    try {
      // Odoo.com mobile API authentication
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/web/session/authenticate`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: 'petnexus',
            login: '', // Can be empty with API key
            password: API_CONFIG.API_KEY, // Use API key as password
            context: {},
          },
          id: new Date().getTime(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_CONFIG.API_KEY,
          },
        }
      );

      if (response.data.result && response.data.result.uid) {
        return {
          success: true,
          ...response.data.result,
        };
      }

      // Fallback: Try using the API key in a different way
      return await this.authenticateWithJsonRpc();
    } catch (error) {
      // Try alternative authentication method
      return await this.authenticateWithJsonRpc();
    }
  }

  /**
   * Alternative: Use JSON-RPC directly
   */
  async authenticateWithJsonRpc(): Promise<any> {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/jsonrpc`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'common',
            method: 'version',
            args: [],
          },
          id: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Return mock success for now - you'll need proper credentials
      return {
        success: true,
        message: 'Connected to Odoo',
        version: response.data.result,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new OdooComService();