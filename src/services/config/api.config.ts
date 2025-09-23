import config from '../../config/environment';

// API Configuration for Odoo Backend
export const API_CONFIG = {
  // Base URL for Odoo server
  BASE_URL: config.ODOO.BASE_URL,
  
  // API version
  API_VERSION: config.ODOO.API_VERSION,
  
  // API Key for mobile authentication
  API_KEY: config.ODOO.API_KEY,
  
  // Request timeout (in milliseconds)
  TIMEOUT: config.NETWORK.TIMEOUT,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: config.NETWORK.RETRY_ATTEMPTS,
    RETRY_DELAY: config.NETWORK.RETRY_DELAY,
    RETRY_MULTIPLIER: config.NETWORK.RETRY_MULTIPLIER,
  },
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
  },
  
  // Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    HISTORY: '/orders/history',
  },
  
  // Promotions/Vouchers
  PROMOTIONS: {
    LIST: '/promotions',
    VALIDATE: '/promotions/validate',
    APPLY: '/promotions/apply',
  },
  
  // Service Providers (Groomers/Doctors)
  SERVICE_PROVIDERS: {
    LIST: '/service-providers',
    DETAIL: '/service-providers/:id',
    AVAILABILITY: '/service-providers/:id/availability',
    BOOK: '/service-providers/:id/book',
  },
  
  // Pets
  PETS: {
    LIST: '/pets',
    CREATE: '/pets',
    UPDATE: '/pets/:id',
    DELETE: '/pets/:id',
    DETAIL: '/pets/:id',
  },
  
  // Shipping
  SHIPPING: {
    OPTIONS: '/shipping/options',
    CALCULATE: '/shipping/calculate',
    PROVIDERS: '/shipping/providers',
  },
  
  // Payment
  PAYMENT: {
    METHODS: '/payment/methods',
    PROCESS: '/payment/process',
    VERIFY: '/payment/verify',
  },
  
  // User/Customer
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
    ADDRESSES: '/user/addresses',
    ADD_ADDRESS: '/user/addresses',
    UPDATE_ADDRESS: '/user/addresses/:id',
    DELETE_ADDRESS: '/user/addresses/:id',
  },
};

// Database name for API config
export const DATABASE = config.ODOO.DATABASE;

// Odoo specific configuration
export const ODOO_CONFIG = {
  // Database name (if multiple databases)
  DATABASE: config.ODOO.DATABASE,
  
  // JSON-RPC endpoint for Odoo
  JSONRPC_ENDPOINT: '/jsonrpc',
  
  // Common Odoo models
  MODELS: {
    PARTNER: 'res.partner',
    PRODUCT: 'product.product',
    PRODUCT_TEMPLATE: 'product.template',
    SALE_ORDER: 'sale.order',
    SALE_ORDER_LINE: 'sale.order.line',
    ACCOUNT_MOVE: 'account.move',
    STOCK_PICKING: 'stock.picking',
    COUPON_PROGRAM: 'sale.coupon.program',
  },
};