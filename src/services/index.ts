// Export all services from a single entry point
export { default as apiClient } from './api/apiClient';
export { default as authService } from './auth/unifiedAuthService';
export { default as productService } from './product/unifiedProductService';
export { default as orderService } from './order/orderService';
export { default as promotionService } from './promotion/promotionService';

// Export legacy services for direct access if needed
export { default as legacyAuthService } from './auth/authService';
export { default as legacyProductService } from './product/productService';
export { default as standaloneProductService } from './product/standaloneProductService';
export { default as standaloneAuthService } from './auth/standaloneAuthService';

// Export types
export * from './auth/authService';
export * from './auth/standaloneAuthService';
export * from './product/productService';
export * from './product/standaloneProductService';
export * from './order/orderService';
export * from './promotion/promotionService';

// Export configuration
export * from './config/api.config';