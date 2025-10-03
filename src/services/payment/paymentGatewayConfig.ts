/**
 * Payment Gateway Configuration
 * Multi-provider support: Flip (primary), Xendit (fallback)
 * Can be easily extended to other providers (Midtrans, Doku, etc.)
 */
import config from '../../config/environment';

export const PAYMENT_GATEWAY_CONFIG = {
  // Single provider configuration (Flip only)
  PRIMARY_PROVIDER: config.PAYMENT_GATEWAYS.PRIMARY_PROVIDER,
  FALLBACK_PROVIDER: config.PAYMENT_GATEWAYS.FALLBACK_PROVIDER, // null for Flip-only

  // Flip Configuration
  FLIP: {
    SECRET_KEY: config.PAYMENT_GATEWAYS.FLIP.SECRET_KEY,
    VALIDATION_KEY: config.PAYMENT_GATEWAYS.FLIP.VALIDATION_KEY,
    BASE_URL: config.PAYMENT_GATEWAYS.FLIP.BASE_URL,
    WEBHOOK_URL: config.PAYMENT_GATEWAYS.FLIP.WEBHOOK_URL,
  },

  // Xendit Configuration (Fallback)
  XENDIT: {
    SECRET_KEY: config.PAYMENT_GATEWAYS.XENDIT.SECRET_KEY,
    PUBLIC_KEY: config.PAYMENT_GATEWAYS.XENDIT.PUBLIC_KEY,
    BASE_URL: config.PAYMENT_GATEWAYS.XENDIT.BASE_URL,
    WEBHOOK_URL: config.PAYMENT_GATEWAYS.XENDIT.WEBHOOK_URL,
    WEBHOOK_TOKEN: config.PAYMENT_GATEWAYS.XENDIT.WEBHOOK_TOKEN,
  },

  // Legacy support (will be removed)
  SECRET_KEY: config.PAYMENT_GATEWAYS.XENDIT.SECRET_KEY,
  PUBLIC_KEY: config.PAYMENT_GATEWAYS.XENDIT.PUBLIC_KEY,
  BASE_URL: config.PAYMENT_GATEWAYS.XENDIT.BASE_URL,
  
  // Payment Methods Configuration
  PAYMENT_METHODS: {
    QRIS: {
      enabled: true,
      channelCode: 'QRIS',
      expiryMinutes: 30,
    },
    EWALLET: {
      enabled: true,
      channels: ['ID_DANA', 'ID_OVO', 'ID_LINKAJA', 'ID_SHOPEEPAY', 'ID_GOJEK'],
      expiryMinutes: 60,
    },
    VIRTUAL_ACCOUNT: {
      enabled: true,
      banks: ['BNI', 'BCA', 'BRI', 'MANDIRI', 'PERMATA', 'CIMB'],
      expiryMinutes: 1440, // 24 hours
    },
    CARDS: {
      enabled: true,
      supportedTypes: ['CREDIT', 'DEBIT'],
    },
  },
  
  // Callback URLs (update with your server endpoints)
  CALLBACKS: {
    SUCCESS_REDIRECT_URL: 'https://yourapp.com/payment/success',
    FAILURE_REDIRECT_URL: 'https://yourapp.com/payment/failure',
    FLIP_WEBHOOK_URL: config.PAYMENT_GATEWAYS.FLIP.WEBHOOK_URL,
    XENDIT_WEBHOOK_URL: config.PAYMENT_GATEWAYS.XENDIT.WEBHOOK_URL,
    XENDIT_WEBHOOK_TOKEN: config.PAYMENT_GATEWAYS.XENDIT.WEBHOOK_TOKEN,
  },
  
  // Fee Structure by Provider (for display purposes)
  FEES: {
    FLIP: {
      QRIS: {
        percentage: 0.7, // 0.7% (standard QRIS fee)
        fixed: 0,
      },
      PAYMENT_LINK: {
        percentage: 0.3, // 0.3%
        fixed: 0,
      },
      BANK_TRANSFER: {
        percentage: 0,
        fixed: 2500, // Rp 2,500
      },
    },
    XENDIT: {
      QRIS: {
        percentage: 0.7, // 0.7%
        fixed: 0,
      },
      EWALLET: {
        percentage: 2, // 2%
        fixed: 0,
      },
      VIRTUAL_ACCOUNT: {
        percentage: 0,
        fixed: 4000, // Rp 4,000
      },
      CARDS: {
        percentage: 2.9, // 2.9%
        fixed: 2000, // Rp 2,000
      },
    },
  },
};

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Payment Method Types
export type PaymentMethod = 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'CARDS';

// E-Wallet Channel Codes
export type EwalletChannel = 'ID_DANA' | 'ID_OVO' | 'ID_LINKAJA' | 'ID_SHOPEEPAY' | 'ID_GOJEK';

// Virtual Account Bank Codes
export type VirtualAccountBank = 'BNI' | 'BCA' | 'BRI' | 'MANDIRI' | 'PERMATA' | 'CIMB';