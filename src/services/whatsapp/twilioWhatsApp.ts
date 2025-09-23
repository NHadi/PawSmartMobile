import axios from 'axios';
import config from '../../config/environment';

/**
 * Twilio WhatsApp Integration
 * Popular third-party service for WhatsApp messaging
 */
class TwilioWhatsApp {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string; // Twilio WhatsApp number (e.g., 'whatsapp:+14155238886')
  private apiUrl: string;

  constructor() {
    this.accountSid = config.WHATSAPP.TWILIO.ACCOUNT_SID;
    this.authToken = config.WHATSAPP.TWILIO.AUTH_TOKEN;
    this.fromNumber = config.WHATSAPP.TWILIO.WHATSAPP_NUMBER;
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  /**
   * Send OTP via Twilio WhatsApp
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      const message = `PawSmart - Kode OTP Anda: ${otpCode}\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.`;
      
      const response = await axios.post(
        `${this.apiUrl}/Messages.json`,
        new URLSearchParams({
          'From': this.fromNumber,
          'To': `whatsapp:+${this.formatPhoneNumber(phoneNumber)}`,
          'Body': message
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('Twilio WhatsApp message sent:', response.data.sid);
      return true;
    } catch (error: any) {
      console.error('Twilio error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send template message with Twilio
   */
  async sendTemplateMessage(
    phoneNumber: string, 
    templateSid: string,
    parameters: Record<string, string>
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/Messages.json`,
        new URLSearchParams({
          'From': this.fromNumber,
          'To': `whatsapp:+${this.formatPhoneNumber(phoneNumber)}`,
          'ContentSid': templateSid,
          'ContentVariables': JSON.stringify(parameters)
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken
          }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Twilio error:', error.response?.data || error.message);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
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
 * 1. Sign up at https://www.twilio.com/
 * 2. Get WhatsApp enabled on your account
 * 3. Get your Account SID and Auth Token
 * 4. Set up WhatsApp sender (sandbox for testing)
 * 5. Add to .env:
 *    EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid
 *    EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token
 *    EXPO_PUBLIC_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
 * 
 * For testing: Users must first send "join [your-sandbox-keyword]" to the Twilio number
 */

export default new TwilioWhatsApp();