import axios from 'axios';
import config from '../../config/environment';
import { Alert } from 'react-native';

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
      console.log('🔄 Fonnte: Attempting to send OTP to', phoneNumber);
      console.log('🔄 Fonnte: API URL:', this.apiUrl);
      console.log('🔄 Fonnte: Token configured:', !!this.token);

      const message = `*PawSmart - Kode OTP*\n\nKode OTP Anda: *${otpCode}*\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.\n\n_Abaikan pesan ini jika Anda tidak melakukan registrasi._`;

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('🔄 Fonnte: Formatted phone:', formattedPhone);

      const requestData = {
        target: formattedPhone,
        message: message,
        countryCode: '62', // Indonesia
      };

      console.log('🔄 Fonnte: Request data:', requestData);

      const response = await axios.post(
        this.apiUrl,
        requestData,
        {
          headers: {
            'Authorization': this.token,
            'Content-Type': 'application/json'
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('✅ Fonnte: Response status:', response.status);
      console.log('✅ Fonnte: Response data:', response.data);

      if (response.data.status) {
        console.log('✅ Fonnte: Message sent successfully');
        return true;
      } else {
        console.error('❌ Fonnte: API returned error:', response.data.reason);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Fonnte: Network/API error occurred');
      console.error('❌ Fonnte: Error message:', error.message);
      console.error('❌ Fonnte: Error code:', error.code);
      console.error('❌ Fonnte: Error response:', error.response?.data);
      console.error('❌ Fonnte: Error status:', error.response?.status);

      // Show debug alert in development mode for APK testing
      if (config.DEBUG === 'true' || __DEV__) {
        let debugMessage = `Fonnte Error:\n\n`;
        debugMessage += `Message: ${error.message}\n`;
        debugMessage += `Code: ${error.code || 'Unknown'}\n`;
        debugMessage += `Status: ${error.response?.status || 'N/A'}\n`;
        debugMessage += `Response: ${JSON.stringify(error.response?.data || {})}\n`;
        debugMessage += `URL: ${this.apiUrl}\n`;
        debugMessage += `Token: ${!!this.token ? 'Configured' : 'Missing'}`;

        Alert.alert(
          'WhatsApp Debug Info',
          debugMessage,
          [{ text: 'OK' }]
        );
      }

      // Additional network debugging
      if (error.code === 'NETWORK_ERROR') {
        console.error('❌ Fonnte: Network connectivity issue detected');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Fonnte: Connection refused - possible firewall/security issue');
      } else if (error.message?.includes('certificate')) {
        console.error('❌ Fonnte: SSL certificate issue detected');
      }

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