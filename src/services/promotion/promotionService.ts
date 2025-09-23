import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../config/api.config';

export type VoucherType = 'free_shipping' | 'discount' | 'cashback' | 'percentage' | 'fixed_amount';

export interface Voucher {
  id: string | number;
  code?: string;
  type: VoucherType;
  title: string;
  subtitle?: string;
  description: string;
  minPurchase: number;
  discount: number;
  discountPercentage?: number;
  maxDiscount?: number;
  expiryDate: string;
  startDate?: string;
  quantity: number;
  usedCount?: number;
  termsUrl?: string;
  isActive?: boolean;
  applicableProducts?: number[];
  applicableCategories?: number[];
}

export interface ApplyVoucherResponse {
  success: boolean;
  discount_amount: number;
  final_amount: number;
  message?: string;
  error?: string;
}

class PromotionService {
  /**
   * Get all available vouchers/promotions
   */
  async getVouchers(): Promise<Voucher[]> {
    try {
      const response = await apiClient.get<Voucher[]>(API_ENDPOINTS.PROMOTIONS.LIST);
      return this.transformVouchers(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate a voucher code
   */
  async validateVoucher(code: string, orderAmount: number): Promise<ApplyVoucherResponse> {
    try {
      const response = await apiClient.post<ApplyVoucherResponse>(
        API_ENDPOINTS.PROMOTIONS.VALIDATE,
        {
          code,
          order_amount: orderAmount,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Apply voucher to an order
   */
  async applyVoucher(
    voucherId: string | number,
    orderId?: string | number,
    orderAmount?: number
  ): Promise<ApplyVoucherResponse> {
    try {
      const response = await apiClient.post<ApplyVoucherResponse>(
        API_ENDPOINTS.PROMOTIONS.APPLY,
        {
          voucher_id: voucherId,
          order_id: orderId,
          order_amount: orderAmount,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's available vouchers
   */
  async getUserVouchers(userId: number): Promise<Voucher[]> {
    try {
      const response = await apiClient.get<Voucher[]>(
        `${API_ENDPOINTS.PROMOTIONS.LIST}/user/${userId}`
      );
      return this.transformVouchers(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transform Odoo voucher data to match app format
   */
  private transformVoucher(odooVoucher: any): Voucher {
    return {
      id: odooVoucher.id,
      code: odooVoucher.code || odooVoucher.name,
      type: this.mapVoucherType(odooVoucher.reward_type || odooVoucher.discount_type),
      title: odooVoucher.name || odooVoucher.title,
      subtitle: odooVoucher.subtitle,
      description: odooVoucher.description || `Min. purchase ${odooVoucher.rule_minimum_amount}`,
      minPurchase: odooVoucher.rule_minimum_amount || 0,
      discount: odooVoucher.discount_fixed_amount || odooVoucher.discount_percentage || 0,
      discountPercentage: odooVoucher.discount_percentage,
      maxDiscount: odooVoucher.discount_max_amount,
      expiryDate: odooVoucher.date_to || odooVoucher.expiry_date,
      startDate: odooVoucher.date_from || odooVoucher.start_date,
      quantity: odooVoucher.maximum_use_number || 1,
      usedCount: odooVoucher.used_count || 0,
      termsUrl: 'S&K',
      isActive: odooVoucher.active !== false,
      applicableProducts: odooVoucher.product_ids,
      applicableCategories: odooVoucher.category_ids,
    };
  }

  /**
   * Transform array of vouchers
   */
  private transformVouchers(odooVouchers: any[]): Voucher[] {
    if (!Array.isArray(odooVouchers)) {
      return [];
    }
    return odooVouchers.map(voucher => this.transformVoucher(voucher));
  }

  /**
   * Map Odoo voucher type to app format
   */
  private mapVoucherType(odooType: string): VoucherType {
    const typeMap: { [key: string]: VoucherType } = {
      'free_product': 'free_shipping',
      'discount': 'discount',
      'percentage': 'percentage',
      'fixed_amount': 'fixed_amount',
      'cashback': 'cashback',
      'free_shipping': 'free_shipping',
    };
    return typeMap[odooType] || 'discount';
  }

  /**
   * Get vouchers by type
   */
  async getVouchersByType(type: VoucherType): Promise<Voucher[]> {
    try {
      const allVouchers = await this.getVouchers();
      return allVouchers.filter(voucher => voucher.type === type);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if voucher is valid for order
   */
  isVoucherValid(voucher: Voucher, orderAmount: number): boolean {
    const now = new Date();
    const expiryDate = new Date(voucher.expiryDate);
    
    // Check expiry
    if (expiryDate < now) {
      return false;
    }

    // Check minimum purchase
    if (orderAmount < voucher.minPurchase) {
      return false;
    }

    // Check quantity
    if (voucher.quantity <= 0) {
      return false;
    }

    return true;
  }
}

export default new PromotionService();