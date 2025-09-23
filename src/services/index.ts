// Export all services from a single entry point
export { default as apiClient } from './api/apiClient';
export { default as authService } from './auth/authService';
export { default as productService } from './product/productService';
export { default as orderService } from './order/orderService';
export { default as promotionService } from './promotion/promotionService';

// Export types
export * from './auth/authService';
export * from './product/productService';
export * from './order/orderService';
export * from './promotion/promotionService';

// Export configuration
export * from './config/api.config';