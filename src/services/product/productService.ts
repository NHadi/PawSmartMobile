import apiClient from '../api/apiClient';
import { API_ENDPOINTS, ODOO_CONFIG, API_CONFIG } from '../config/api.config';
import odooComService from '../odoocom/odooComService';

export interface Product {
  id: string | number;
  name: string;
  display_name?: string;
  description?: string;
  description_sale?: string;
  price: number;
  list_price?: number;
  standard_price?: number;
  originalPrice?: number;
  discount?: number;
  currency?: string;
  qty_available?: number;
  virtual_available?: number;
  uom_name?: string;
  categ_id?: [number, string];
  category?: string;
  brand?: string;
  image_1920?: string;
  image_128?: string;
  image?: any;
  rating?: number;
  sold?: number;
  is_favorite?: boolean;
  isRecommended?: boolean;
  barcode?: string;
  default_code?: string;
  weight?: number;
  volume?: number;
  product_tmpl_id?: [number, string];
}

export interface ProductCategory {
  id: number;
  name: string;
  display_name: string;
  parent_id?: [number, string];
  child_ids?: number[];
  product_count?: number;
}

export interface ProductBrand {
  id: string;
  name: string;
  image?: string;
  product_count?: number;
}

export interface ProductFilter {
  category_id?: number;
  brand?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  in_stock?: boolean;
  sort_by?: 'name' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  limit?: number;
  offset?: number;
}

class ProductService {
  /**
   * Get all products with optional filters
   */
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      // Build Odoo domain filter
      const domain: any[] = [['sale_ok', '=', true]];
      
      if (filter) {
        if (filter.category_id) {
          domain.push(['categ_id', '=', filter.category_id]);
        }
        if (filter.search) {
          domain.push(['name', 'ilike', filter.search]);
        }
        if (filter.in_stock) {
          domain.push(['qty_available', '>', 0]);
        }
        if (filter.min_price !== undefined) {
          domain.push(['list_price', '>=', filter.min_price]);
        }
        if (filter.max_price !== undefined) {
          domain.push(['list_price', '<=', filter.max_price]);
        }
      }

      // Determine sort order
      let order = 'name asc';
      if (filter?.sort_by) {
        switch (filter.sort_by) {
          case 'price_asc':
            order = 'list_price asc';
            break;
          case 'price_desc':
            order = 'list_price desc';
            break;
          case 'name':
            order = 'name asc';
            break;
          case 'newest':
            order = 'create_date desc';
            break;
          default:
            order = 'name asc';
        }
      }

      // Use Odoo JSON-RPC to get products
      const products = await apiClient.odooExecute(
        'product.product',
        'search_read',
        [],
        {
          domain,
          fields: [
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
          limit: filter?.limit || 50,
          offset: filter?.offset || 0,
          order,
        }
      );

      // Transform and return products
      return this.transformProducts(products);
    } catch (error) {
      // Return fallback data if API fails
      return this.getFallbackProducts();
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string | number): Promise<Product> {
    try {
      // Use Odoo JSON-RPC to get product by ID
      const products = await apiClient.odooExecute(
        'product.product',
        'read',
        [[parseInt(productId.toString())]],
        {
          fields: [
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
            'description',
            'barcode',
            'default_code',
            'type',
            'uom_id',
            'uom_name',
            'weight',
            'volume',
          ],
        }
      );

      if (!products || products.length === 0) {
        // If not found, return a default product
        return this.getFallbackProductById(productId);
      }
      
      return this.transformProduct(products[0]);
    } catch (error) {
      // Return fallback product on error
      return this.getFallbackProductById(productId);
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    try {
      const response = await apiClient.get<{ products: Product[] }>(
        API_ENDPOINTS.PRODUCTS.SEARCH,
        {
          params: {
            q: query,
            limit,
          },
        }
      );

      return this.transformProducts(response.products || response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const categories = await apiClient.odooExecute(
        'product.category',
        'search_read',
        [],
        {
          domain: [],
          fields: ['id', 'name', 'display_name', 'parent_id', 'child_id'],
          order: 'name', // Remove 'sequence' as it doesn't exist in standard Odoo
        }
      );
      
      return categories || [];
    } catch (error) {
      // Return fallback categories
      return [
        { id: 1, name: 'Cat Food', display_name: 'Cat Food' },
        { id: 2, name: 'Dog Food', display_name: 'Dog Food' },
        { id: 3, name: 'Pet Accessories', display_name: 'Pet Accessories' },
        { id: 4, name: 'Pet Toys', display_name: 'Pet Toys' },
      ];
    }
  }

  /**
   * Get product brands
   */
  async getBrands(): Promise<ProductBrand[]> {
    try {
      // Note: Odoo doesn't have a built-in brand model
      // Return fallback brands since product.brand is not available
      // In a real implementation, you would either:
      // 1. Install a custom module that adds product.brand
      // 2. Use a custom field on products to store brand info
      // 3. Use product attributes to store brand information
      
      return this.getFallbackBrands();
    } catch (error) {
      return this.getFallbackBrands();
    }
  }

  /**
   * Get fallback brands for development/offline mode
   */
  private getFallbackBrands(): ProductBrand[] {
    return [
      { id: '1', name: 'Royal Canin' },
      { id: '2', name: 'Whiskas' },
      { id: '3', name: 'Pro Plan' },
      { id: '4', name: 'Pedigree' },
      { id: '5', name: 'Friskies' },
    ];
  }

  /**
   * Get products using Odoo JSON-RPC (alternative method)
   */
  async getProductsOdooRpc(domain: any[] = [], limit: number = 20): Promise<Product[]> {
    try {
      // Search for product IDs
      const productIds = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          ODOO_CONFIG.DATABASE,
          null, // uid will be set by apiClient
          null, // password will be set by apiClient
          ODOO_CONFIG.MODELS.PRODUCT,
          'search',
          [domain],
          { limit }
        ]
      );

      if (!productIds || productIds.length === 0) {
        return [];
      }

      // Read product data
      const products = await apiClient.jsonRpc(
        'object',
        'execute_kw',
        [
          ODOO_CONFIG.DATABASE,
          null,
          null,
          ODOO_CONFIG.MODELS.PRODUCT,
          'read',
          [productIds],
          {
            fields: [
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
              'uom_name',
              'product_tmpl_id',
            ],
          }
        ]
      );

      return this.transformProducts(products);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transform Odoo product data to match app format
   */
  private transformProduct(odooProduct: any): Product {
    // Extract brand from product name
    const extractBrand = (name: string): string | undefined => {
      const knownBrands = [
        'Royal Canin', 'Whiskas', 'Pedigree', 'Pro Plan', 
        'Bolt', 'Me-O', 'Meo', 'Friskies', 'Purina',
        'Fancy Feast', 'Sheba', 'Kit Cat', 'Felibite',
        'Josera', 'Brit', 'Orijen', 'Acana', 'Taste of the Wild'
      ];
      
      const lowerName = name.toLowerCase();
      for (const brand of knownBrands) {
        if (lowerName.includes(brand.toLowerCase())) {
          return brand;
        }
      }
      return undefined;
    };
    
    const productName = odooProduct.name || odooProduct.display_name || '';
    
    return {
      id: odooProduct.id,
      name: productName,
      display_name: odooProduct.display_name || '',
      description: odooProduct.description || odooProduct.description_sale || '',
      description_sale: odooProduct.description_sale || '',
      price: odooProduct.list_price || odooProduct.price || 0,
      originalPrice: odooProduct.standard_price || odooProduct.list_price || 0,
      discount: this.calculateDiscount(odooProduct.list_price, odooProduct.standard_price),
      qty_available: odooProduct.qty_available || 0,
      virtual_available: odooProduct.virtual_available || 0,
      category: odooProduct.categ_id?.[1] || 'Uncategorized',
      categ_id: odooProduct.categ_id || null,
      brand: extractBrand(productName),
      image: odooProduct.image_1920 ? 
        { uri: `data:image/jpeg;base64,${odooProduct.image_1920}` } : 
        require('../../../assets/product-placeholder.jpg'),
      image_1920: odooProduct.image_1920 || '',
      rating: odooProduct.rating || 4.5, // Default rating if not available
      sold: odooProduct.sales_count || Math.floor(Math.random() * 1000), // Mock sold count
      isRecommended: odooProduct.is_recommended || false,
      barcode: odooProduct.barcode || '',
      default_code: odooProduct.default_code || '',
      uom_name: odooProduct.uom_name || '',
      product_tmpl_id: odooProduct.product_tmpl_id || null,
    };
  }

  /**
   * Transform array of products
   */
  private transformProducts(odooProducts: any[]): Product[] {
    if (!Array.isArray(odooProducts)) {
      return [];
    }
    
    // Transform products
    const products = odooProducts.map(product => this.transformProduct(product));
    
    // Remove duplicates based on ID
    const uniqueProducts = products.reduce((acc: Product[], current: Product) => {
      const exists = acc.find(item => item.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueProducts;
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
   * Get recommended products
   */
  async getRecommendedProducts(limit: number = 10): Promise<Product[]> {
    try {
      const products = await this.getProducts({
        sort_by: 'rating',
        limit,
      });

      // Mark as recommended
      return products.map(product => ({
        ...product,
        isRecommended: true,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number, limit: number = 20): Promise<Product[]> {
    try {
      return await this.getProducts({
        category_id: categoryId,
        limit,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string, limit: number = 20): Promise<Product[]> {
    try {
      return await this.getProducts({
        brand,
        limit,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get fallback product by ID
   */
  private getFallbackProductById(productId: string | number): Product {
    const fallbackProducts = this.getFallbackProducts();
    const product = fallbackProducts.find(p => p.id.toString() === productId.toString());
    return product || fallbackProducts[0];
  }

  /**
   * Get fallback products for development/offline mode
   */
  private getFallbackProducts(): Product[] {
    return [
      {
        id: '1',
        name: 'Royal Canin Persian Adult (500gr)',
        price: 85000,
        originalPrice: 90000,
        rating: 4.9,
        sold: 456,
        image: require('../../../assets/product-placeholder.jpg'),
        discount: 5,
        isRecommended: true,
        qty_available: 10,
        category: 'Cat Food',
      },
      {
        id: '2',
        name: 'Whiskas Adult Tuna (1kg)',
        price: 45000,
        originalPrice: 50000,
        rating: 4.7,
        sold: 789,
        image: require('../../../assets/product-placeholder.jpg'),
        discount: 10,
        isRecommended: false,
        qty_available: 25,
        category: 'Cat Food',
      },
      {
        id: '3',
        name: 'Pro Plan Cat Food (2kg)',
        price: 120000,
        originalPrice: 140000,
        rating: 4.8,
        sold: 234,
        image: require('../../../assets/product-placeholder.jpg'),
        discount: 14,
        isRecommended: true,
        qty_available: 15,
        category: 'Cat Food',
      },
      {
        id: '4',
        name: 'Pedigree Adult Dog Food (1.5kg)',
        price: 75000,
        originalPrice: 85000,
        rating: 4.6,
        sold: 567,
        image: require('../../../assets/product-placeholder.jpg'),
        discount: 12,
        isRecommended: false,
        qty_available: 30,
        category: 'Dog Food',
      },
    ];
  }
}

export default new ProductService();