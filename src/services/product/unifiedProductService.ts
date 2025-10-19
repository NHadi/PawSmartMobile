import config from '../../config/environment';
import productService, { Product, ProductFilter, ProductCategory, ProductBrand } from './productService';
import standaloneProductService from './standaloneProductService';

class UnifiedProductService {
  /**
   * Get all products with optional filters
   * Routes to appropriate service based on configuration
   */
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.getProducts(filter);
    } else {
      return productService.getProducts(filter);
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string | number): Promise<Product | null> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.getProductById(id);
    } else {
      return productService.getProductById(id);
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.getCategories();
    } else {
      return productService.getCategories();
    }
  }

  /**
   * Get product brands
   */
  async getBrands(): Promise<ProductBrand[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.getBrands();
    } else {
      return productService.getBrands();
    }
  }

  /**
   * Get recommended products
   */
  async getRecommendedProducts(limit: number = 10): Promise<Product[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.getRecommendedProducts(limit);
    } else {
      return productService.getRecommendedProducts(limit);
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    if (config.USE_STANDALONE_API) {
      return standaloneProductService.searchProducts(query);
    } else {
      return productService.searchProducts(query);
    }
  }
}

export default new UnifiedProductService();