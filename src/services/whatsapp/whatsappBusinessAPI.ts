import axios from 'axios';
import config from '../../config/environment';

/**
 * WhatsApp Business API Integration
 * Official Meta/Facebook solution for sending WhatsApp messages
 */
class WhatsAppBusinessAPI {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    // Get these from Meta for Developers console
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.WHATSAPP.META.ACCESS_TOKEN;
    this.phoneNumberId = config.WHATSAPP.META.PHONE_NUMBER_ID;
  }

  /**
   * Send OTP via WhatsApp Business API
   * Uses authentication template with OTP button (2024 compliance)
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      // Validate OTP length (max 15 characters for WhatsApp auth templates)
      if (otpCode.length > 15) {
        console.error('OTP code too long. WhatsApp auth templates support max 15 characters.');
        return false;
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(phoneNumber),
          type: 'template',
          template: {
            name: config.WHATSAPP.META.OTP_TEMPLATE_NAME,
            language: {
              code: config.WHATSAPP.META.TEMPLATE_LANGUAGE
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otpCode
                  }
                ]
              },
              {
                type: 'button',
                sub_type: 'copy_code',
                index: '0',
                parameters: [
                  {
                    type: 'coupon_code',
                    coupon_code: otpCode
                  }
                ]
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp OTP message sent successfully:', response.data.messages?.[0]?.id);
      return true;
    } catch (error: any) {
      console.error('WhatsApp Business API error:', error.response?.data || error.message);
      
      // Provide more detailed error information
      if (error.response?.data?.error) {
        const errorDetails = error.response.data.error;
        console.error('Error details:', {
          code: errorDetails.code,
          message: errorDetails.message,
          type: errorDetails.type,
          subcode: errorDetails.error_subcode
        });
      }
      
      return false;
    }
  }

  /**
   * Send text message (requires business verification)
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(phoneNumber),
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error: any) {
      console.error('WhatsApp API error:', error.response?.data || error.message);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (Indonesia: +62)
    if (!cleaned.startsWith('62')) {
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }
}

/**
 * Setup Instructions:
 * 
 * 1. Go to https://developers.facebook.com/
 * 2. Create a new app or use existing
 * 3. Add WhatsApp product to your app
 * 4. Get your Access Token and Phone Number ID
 * 5. Create and submit OTP authentication templates for approval
 * 6. Add credentials to .env:
 *    EXPO_PUBLIC_WHATSAPP_PROVIDER=meta
 *    EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN=your_token
 *    EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID=your_phone_id
 *    EXPO_PUBLIC_WHATSAPP_OTP_TEMPLATE_NAME=otp_verification
 *    EXPO_PUBLIC_WHATSAPP_TEMPLATE_LANGUAGE=id
 * 
 * Note: Authentication templates must comply with 2024 WhatsApp requirements:
 * - Templates must be pre-approved by Meta
 * - OTP parameters limited to 15 characters
 * - Must include copy-code button for better user experience
 * - Legacy authentication templates rejected after May 31, 2024
 */

export default new WhatsAppBusinessAPI();