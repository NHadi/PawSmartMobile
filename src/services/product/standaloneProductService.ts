import apiClient from '../api/apiClient';
import config from '../../config/environment';

// Reuse Product interfaces from the main productService
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
  sku?: string;
  weight?: number;
  volume?: number;
  product_tmpl_id?: [number, string];
  brand_id?: number;
  is_active?: boolean;
  sale_ok?: boolean;
  purchase_ok?: boolean;
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

class StandaloneProductService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.STANDALONE_API.BASE_URL;
  }

  /**
   * Get all products with optional filters
   * Matches GET /products endpoint
   */
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      const params = new URLSearchParams();

      if (filter) {
        if (filter.category_id) params.append('category_id', filter.category_id.toString());
        if (filter.search) params.append('search', filter.search);
        if (filter.in_stock) params.append('in_stock', 'true');
        if (filter.min_price !== undefined) params.append('min_price', filter.min_price.toString());
        if (filter.max_price !== undefined) params.append('max_price', filter.max_price.toString());
        if (filter.sort_by) params.append('sort_by', filter.sort_by);
        if (filter.limit) params.append('limit', filter.limit.toString());
        if (filter.offset) params.append('offset', filter.offset.toString());
      }

      const response = await fetch(`${this.baseURL}/api/v1/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      const products = data.success ? data.data : [];
      return this.transformProducts(products);
    } catch (error: any) {
      console.warn('Failed to fetch products from standalone API, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get a single product by ID
   * Matches GET /products/{id} endpoint
   */
  async getProductById(id: string | number): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product');
      }

      const product = data.success ? data.data : null;
      return product ? this.transformProduct(product) : null;
    } catch (error: any) {
      console.warn('Failed to fetch product from standalone API:', error.message);
      return null;
    }
  }

  /**
   * Get product categories
   * Matches GET /products/categories endpoint
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/products/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }

      return data.success ? data.data : [];
    } catch (error: any) {
      console.warn('Failed to fetch categories from standalone API, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get product brands
   * Matches GET /products/brands endpoint
   */
  async getBrands(): Promise<ProductBrand[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/products/brands`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch brands');
      }

      return data.success ? data.data : [];
    } catch (error: any) {
      console.warn('Failed to fetch brands from standalone API, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Get recommended products
   * Matches GET /products/recommended endpoint
   */
  async getRecommendedProducts(limit: number = 10): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/products/recommended?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recommended products');
      }

      const products = data.success ? data.data : [];
      return this.transformProducts(products);
    } catch (error: any) {
      console.warn('Failed to fetch recommended products from standalone API, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Search products
   * Matches GET /products/search endpoint
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/products/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search products');
      }

      const products = data.success ? data.data : [];
      return this.transformProducts(products);
    } catch (error: any) {
      console.warn('Failed to search products from standalone API, returning empty array:', error.message);
      return [];
    }
  }

  /**
   * Transform API product data to match app Product interface
   */
  private transformProduct(apiProduct: any): Product {
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

    const productName = apiProduct.name || apiProduct.display_name || '';

    // Parse prices from string to number
    const listPrice = parseFloat(apiProduct.list_price || apiProduct.price || '0');
    const standardPrice = parseFloat(apiProduct.standard_price || apiProduct.originalPrice || '0');
    const discountPercentage = parseFloat(apiProduct.discount_percentage || '0');

    return {
      id: apiProduct.id,
      name: productName,
      display_name: apiProduct.display_name || '',
      description: apiProduct.description || apiProduct.description_sale || '',
      description_sale: apiProduct.description_sale || '',
      price: listPrice,
      list_price: listPrice,
      standard_price: standardPrice,
      originalPrice: standardPrice,
      discount: discountPercentage,
      currency: apiProduct.currency || 'IDR',
      qty_available: apiProduct.qty_available || 0,
      virtual_available: apiProduct.virtual_available || 0,
      category: apiProduct.category || 'Uncategorized',
      categ_id: apiProduct.category_id ? [apiProduct.category_id, apiProduct.category] : null,
      brand_id: apiProduct.brand_id,
      brand: extractBrand(productName),
      sku: apiProduct.sku,
      barcode: apiProduct.barcode || '',
      default_code: apiProduct.default_code || '',
      uom_name: apiProduct.uom_name || 'Unit',
      weight: apiProduct.weight ? parseFloat(apiProduct.weight) : undefined,
      volume: apiProduct.volume ? parseFloat(apiProduct.volume) : undefined,
      image_1920: apiProduct.image_1920 || '',
      image_128: apiProduct.image_128 || '',
      image: apiProduct.image_128 ? { uri: apiProduct.image_128 } : require('../../../assets/product-placeholder.jpg'),
      rating: apiProduct.rating ? parseFloat(apiProduct.rating) : 4.5,
      sold: apiProduct.sold || Math.floor(Math.random() * 1000),
      isRecommended: apiProduct.is_recommended || false,
      is_active: apiProduct.is_active,
      sale_ok: apiProduct.sale_ok,
      purchase_ok: apiProduct.purchase_ok,
      product_tmpl_id: apiProduct.product_tmpl_id,
    };
  }

  /**
   * Transform array of API products to match app Product interface
   */
  private transformProducts(apiProducts: any[]): Product[] {
    if (!Array.isArray(apiProducts)) {
      return [];
    }

    return apiProducts.map(product => this.transformProduct(product));
  }
}

export default new StandaloneProductService();