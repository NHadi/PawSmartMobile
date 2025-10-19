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

      const response = await fetch(`${this.baseURL}/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      return data.success ? data.data : [];
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
      const response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product');
      }

      return data.success ? data.data : null;
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
      const response = await fetch(`${this.baseURL}/products/categories`, {
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
      const response = await fetch(`${this.baseURL}/products/brands`, {
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
      const response = await fetch(`${this.baseURL}/products/recommended?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recommended products');
      }

      return data.success ? data.data : [];
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
      const response = await fetch(`${this.baseURL}/products/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search products');
      }

      return data.success ? data.data : [];
    } catch (error: any) {
      console.warn('Failed to search products from standalone API, returning empty array:', error.message);
      return [];
    }
  }
}

export default new StandaloneProductService();