import axios from 'axios';
import config from '../../config/environment';

/**
 * Fonnte WhatsApp Integration
 * Indonesian WhatsApp messaging service - popular and affordable
 * Website: https://fonnte.com/
 */
class FonnteWhatsApp {
  private apiUrl: string = 'https://api.fonnte.com/send';
  private token: string;

  constructor() {
    // Get token from configuration
    this.token = config.WHATSAPP.FONNTE_TOKEN;
  }

  /**
   * Send OTP via Fonnte
   * Simple and straightforward API
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      const message = `*PawSmart - Kode OTP*\n\nKode OTP Anda: *${otpCode}*\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.\n\n_Abaikan pesan ini jika Anda tidak melakukan registrasi._`;
      
      const response = await axios.post(
        this.apiUrl,
        {
          target: this.formatPhoneNumber(phoneNumber),
          message: message,
          countryCode: '62', // Indonesia
        },
        {
          headers: {
            'Authorization': this.token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        console.log('Fonnte message sent successfully');
        return true;
      } else {
        console.error('Fonnte error:', response.data.reason);
        return false;
      }
    } catch (error: any) {
      console.error('Fonnte API error:', error.message);
      return false;
    }
  }

  /**
   * Send with image
   */
  async sendWithImage(
    phoneNumber: string, 
    message: string, 
    imageUrl: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          target: this.formatPhoneNumber(phoneNumber),
          message: message,
          url: imageUrl,
          countryCode: '62',
        },
        {
          headers: {
            'Authorization': this.token,
          }
        }
      );

      return response.data.status;
    } catch (error) {
      console.error('Fonnte error:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove country code if present (Fonnte handles it separately)
    if (cleaned.startsWith('62')) {
      cleaned = cleaned.substring(2);
    }
    
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  }
}

/**
 * Setup Instructions:
 * 
 * 1. Register at https://fonnte.com/
 * 2. Connect your WhatsApp number (scan QR code)
 * 3. Get your API token from dashboard
 * 4. Add to .env:
 *    EXPO_PUBLIC_FONNTE_TOKEN=your_token_here
 * 
 * Pricing: Very affordable for Indonesian market
 * - Rp 50,000/month for 1000 messages
 * - No setup fees
 * - Instant activation
 */

export default new FonnteWhatsApp();