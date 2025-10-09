// Environment configuration for PetNexus Mobile App
// Prioritize EAS build environment variables for APK builds
const isEASBuild = process.env.EAS_BUILD === 'true';
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  // API Server Configuration (Migration from Odoo to Standalone API)
  // Set USE_STANDALONE_API=true to use the new REST API instead of Odoo
  USE_STANDALONE_API: 'true',

  // Legacy Odoo Server Configuration (kept for backward compatibility)
  ODOO: {
    BASE_URL: process.env.EXPO_PUBLIC_ODOO_URL ||
      (__DEV__
        ? 'http://103.67.244.254:8069'  // Development fallback
        : 'http://103.67.244.254:8069'), // Production fallback
    DATABASE: process.env.EXPO_PUBLIC_ODOO_DATABASE ||
      (isProduction ? 'production' : 'development'),
    USERNAME: process.env.EXPO_PUBLIC_ODOO_USERNAME || 'zakariali0705@gmail.com',
    PASSWORD: process.env.EXPO_PUBLIC_ODOO_PASSWORD || 'admin',
    API_KEY: process.env.EXPO_PUBLIC_ODOO_API_KEY || 'bd598ce6e94176c354da8333ea381b854617175f',
    API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  },

  // Standalone API Configuration
  STANDALONE_API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ||
      (__DEV__
        ? 'http://43.157.209.126:3001/api/v1'     // Development API
        : 'https://api.pawsmart.com/v1'), // Production API
    JWT_SECRET: process.env.EXPO_PUBLIC_JWT_SECRET || 'your-jwt-secret-key',
    TOKEN_REFRESH_THRESHOLD: 300, // Refresh token 5 minutes before expiry
  },
  
  // Payment Gateway Configuration
  PAYMENT_GATEWAYS: {
    // Use Flip as primary provider with correct sandbox endpoint
    PRIMARY_PROVIDER: 'FLIP' as const,
    FALLBACK_PROVIDER: null, // No fallback

    // Flip Configuration
    FLIP: {
      SECRET_KEY: process.env.EXPO_PUBLIC_FLIP_SECRET_KEY ||
        (__DEV__
          ? 'JDJ5JDEzJGN0ZEpkeDhSaTdYQVhITEJ5Tzl0dk9GdDlCWkNaQm4zeUdxVHVKenp4UDlvb0VkemxYd3dD'
          : 'JDJ5JDEzJGN0ZEpkeDhSaTdYQVhITEJ5Tzl0dk9GdDlCWkNaQm4zeUdxVHVKenp4UDlvb0VkemxYd3dD'),
      VALIDATION_KEY: process.env.EXPO_PUBLIC_FLIP_VALIDATION_KEY ||
        (__DEV__
          ? '$2y$13$2dLwn5UGqX8Y4zKCiynWyenSYQMM0MohS3r.YRvTBUVVii4b3gH8m'
          : '$2y$13$2dLwn5UGqX8Y4zKCiynWyenSYQMM0MohS3r.YRvTBUVVii4b3gH8m'),
      BASE_URL: 'https://fm-dev-box.flip.id/', // Sandbox endpoint for testing
      WEBHOOK_URL: process.env.EXPO_PUBLIC_FLIP_WEBHOOK_URL ||
        (__DEV__
          ? 'https://webhook.site/#!/c8c8c8c8-1234-5678-90ab-cdef12345678' // Temporary webhook for testing
          : 'https://your-production-webhook.com/flip'),
    },

    // Xendit Configuration (Fallback)
    XENDIT: {
      SECRET_KEY: process.env.EXPO_PUBLIC_XENDIT_SECRET_KEY ||
        (__DEV__
          ? 'xnd_development_msfP7kWOSLK5Yq1W765yVEYv33hTaMU7llz1z84PTQLeNOBmb0Xl5550owlh3W'
          : 'xnd_production_YOUR_PRODUCTION_SECRET_KEY'), // Replace with your production key
      PUBLIC_KEY: process.env.EXPO_PUBLIC_XENDIT_PUBLIC_KEY ||
        (__DEV__
          ? 'xnd_public_development_fKdWUc1tI9wCWkP0u5QIOEL2yycIzd8WzO2S3s7NsvL6djBJZ2iXR6LPzgBeUhkx'
          : 'xnd_public_production_YOUR_PRODUCTION_PUBLIC_KEY'), // Replace with your production key
      BASE_URL: 'https://api.xendit.co',
      WEBHOOK_URL: process.env.EXPO_PUBLIC_XENDIT_WEBHOOK_URL ||
        (__DEV__
          ? 'https://webhook.site/182463e6-a64b-441a-8f69-92416f08145c'
          : 'https://your-production-webhook.com/xendit'), // Replace with your production webhook
      WEBHOOK_TOKEN: process.env.EXPO_PUBLIC_XENDIT_WEBHOOK_TOKEN ||
        (__DEV__
          ? 'RSIYNgN5N5hEp9etz2k3ukqhNepjL86dIuhqGfPzNT4JoQmX'
          : 'YOUR_PRODUCTION_WEBHOOK_TOKEN'), // Replace with your production token
    },
  },

  // Shipping Service Configuration
  SHIPPING: {
    KIRIMINAJA: {
      BASE_URL: process.env.EXPO_PUBLIC_KIRIMINAJA_BASE_URL ||
        (__DEV__
          ? 'https://tdev.kiriminaja.com' // Development/Testing endpoint
          : 'https://api.kiriminaja.com'), // Production endpoint
      API_TOKEN: process.env.EXPO_PUBLIC_KIRIMINAJA_TOKEN ||
        (__DEV__
          ? '68ba0c1ca45329a8ccf59371cad993ba1c4a23d749ca0569e5e4476e18de6cf8' // Development token
          : 'YOUR_PRODUCTION_TOKEN'), // Replace with production token
      API_VERSION: 'v6.1',
    },
  },
  
  // Social Login Configuration
  SOCIAL_LOGIN: {
    GOOGLE: {
      IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '813145283633-m76ed93hla2i35nb7r3dfd7cgrjauh12.apps.googleusercontent.com',
      ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '813145283633-7aroaegs4gb8gj4pa9nar776va9grnck.apps.googleusercontent.com',
      WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '813145283633-c7gs0rsc79cas7dt23vu7b19m9hsue1p.apps.googleusercontent.com',
    },
    FACEBOOK: {
      APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '797841592820309',
    },
  },
  
  // WhatsApp Integration Configuration
  WHATSAPP: {
    PROVIDER: process.env.EXPO_PUBLIC_WHATSAPP_PROVIDER || 'fonnte',
    FONNTE_TOKEN: process.env.EXPO_PUBLIC_FONNTE_TOKEN || 'foUxAsfeYPs5CpBoTz6q',
    // WhatsApp Business API (Meta) - Use commented values from .env when ready
    META: {
      ACCESS_TOKEN: __DEV__ ? '' : '', // EAAJMOb01Y10BPQlBxz9pgn8D4r0e6EZBxdrBXTgwkfCnhFaGmLQpi3og50bkiYtQDFHqkjBCNbwzDGUSpNRpmZCZB5ZAqil37DtY0S3C9ZBNsvmjUewv4c62Ju8Cgj2VzqP0zZC3qJffaynFC0dZCajsGrgAgfE7ghr9cUVY6iuxLFxXbgbiBUgzOqZBNN2I67hlo7s7QwT5wXZBGN0qAR7yx3O34
      PHONE_NUMBER_ID: __DEV__ ? '' : '', // 791724457356264
      OTP_TEMPLATE_NAME: 'pawnexus_otp_verification', // From commented line in .env
      TEMPLATE_LANGUAGE: 'id', // Indonesian (can change to 'en' if needed)
    },
    // Twilio WhatsApp API
    TWILIO: {
      ACCOUNT_SID: __DEV__ ? '' : '',
      AUTH_TOKEN: __DEV__ ? '' : '',
      WHATSAPP_NUMBER: 'whatsapp:+14155238886',
    },
  },
  
  // Network Configuration
  NETWORK: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    RETRY_MULTIPLIER: 2,
    // Allow HTTP traffic to specific domains
    ALLOWED_HTTP_DOMAINS: ['103.67.244.254', 'localhost', '127.0.0.1'],
    // Allow HTTPS domains for standalone API
    ALLOWED_HTTPS_DOMAINS: ['api.pawsmart.com', 'staging-api.pawsmart.com'],
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@PawSmart:authToken',
    REFRESH_TOKEN: '@PawSmart:refreshToken',
    USER_DATA: '@PawSmart:userData',
    ODOO_CREDENTIALS: '@PawSmart:odooCredentials',
    ADMIN_CREDENTIALS: '@PawSmart:adminCredentials',
  },
  
  // App Configuration
  APP: {
    NAME: 'PawSmart',
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,
  },
  
  // API Configuration (for non-Odoo services)
  API: {
    BASE_URL: __DEV__ 
      ? 'https://api-dev.petnexus.com'  // Development API
      : 'https://api.petnexus.com',     // Production API
  },
  
  // Debug Configuration - Use EAS build environment variables
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true' || __DEV__,

  // Network Debugging - Enhanced for APK troubleshooting
  LOG_API_CALLS: process.env.EXPO_PUBLIC_DEBUG === 'true' || __DEV__,
  LOG_ERRORS: true,

  // APK Build Detection
  IS_EAS_BUILD: isEASBuild,
  IS_PRODUCTION: isProduction,
};

// Helper function to get Odoo API URL (Legacy)
export const getOdooUrl = (endpoint: string = ''): string => {
  return `${config.ODOO.BASE_URL}${endpoint}`;
};

// Helper function to get full JSON-RPC URL (Legacy)
export const getJsonRpcUrl = (): string => {
  return `${config.ODOO.BASE_URL}/jsonrpc`;
};

// Helper function to get API base URL (new standalone API)
export const getApiBaseUrl = (): string => {
  return config.USE_STANDALONE_API ? config.STANDALONE_API.BASE_URL : config.ODOO.BASE_URL;
};

// Helper function to get API endpoint URL
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// Helper function to check if development mode
export const isDevelopment = (): boolean => {
  return __DEV__;
};

// Helper function to get database name
export const getDatabaseName = (): string => {
  return config.ODOO.DATABASE;
};

export default config;