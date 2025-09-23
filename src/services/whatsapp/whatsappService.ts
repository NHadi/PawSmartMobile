import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/environment';

// Import the service you want to use:
import whatsappBusinessAPI from './whatsappBusinessAPI';
// import twilioWhatsApp from './twilioWhatsApp';
import fonnteWhatsApp from './fonnteWhatsApp';

interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateId?: string;
  templateParams?: any;
}

type WhatsAppProvider = 'fonnte' | 'twilio' | 'meta' | 'console';

class WhatsAppService {
  private provider: WhatsAppProvider;

  constructor() {
    // Choose your provider here - now defaults to configured provider
    this.provider = (config.WHATSAPP.PROVIDER as WhatsAppProvider) || 'fonnte';
  }

  /**
   * Send OTP via WhatsApp
   * Supports multiple providers based on configuration
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      const message = `PawSmart - Kode OTP Anda: ${otpCode}\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.`;
      
      switch (this.provider) {
        case 'fonnte':
          // Send via Fonnte
          return await fonnteWhatsApp.sendOTP(phoneNumber, otpCode);
          
        case 'twilio':
          // Uncomment when twilioWhatsApp is imported
          // return await twilioWhatsApp.sendOTP(phoneNumber, otpCode);
          console.log('Twilio provider selected but not configured');
          break;
          
        case 'meta':
          // Send via Meta WhatsApp Business API
          return await whatsappBusinessAPI.sendOTP(phoneNumber, otpCode);
          
        case 'console':
        default:
          // Development mode - just log to console
          // Development mode - message logged to console in development
          break;
      }
      
      // Store the message locally for all providers
      await this.storeSentMessage(phoneNumber, message, otpCode);
      
      return true;
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return false;
    }
  }

  /**
   * Send general WhatsApp message
   */
  async sendMessage(data: WhatsAppMessage): Promise<boolean> {
    try {
      
      // In production, implement actual API call
      // For now, just log and return success
      await this.storeSentMessage(data.to, data.message);
      
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (default to Indonesia +62)
    if (!cleaned.startsWith('62')) {
      // Remove leading 0 if present
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Store sent message locally (for demo/development)
   */
  private async storeSentMessage(to: string, message: string, otpCode?: string): Promise<void> {
    try {
      const messageData = {
        to,
        message,
        otpCode,
        timestamp: new Date().toISOString(),
      };
      
      // Store last sent message
      await AsyncStorage.setItem(
        `@PawSmart:whatsapp:${to}`,
        JSON.stringify(messageData)
      );
      
      // Store OTP separately if provided
      if (otpCode) {
        await AsyncStorage.setItem(
          `@PawSmart:whatsapp:otp:${to}`,
          otpCode
        );
      }
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }

  /**
   * Get last OTP sent to a phone number (for testing)
   */
  async getLastOTP(phoneNumber: string): Promise<string | null> {
    try {
      const otp = await AsyncStorage.getItem(`@PawSmart:whatsapp:otp:${phoneNumber}`);
      return otp;
    } catch (error) {
      console.error('Failed to get OTP:', error);
      return null;
    }
  }

  /**
   * Send template message (for production use with WhatsApp Business API)
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    templateParams: any[]
  ): Promise<boolean> {
    try {
      // This would be implemented with actual WhatsApp Business API
      console.log('Sending template message:', {
        to: phoneNumber,
        template: templateName,
        params: templateParams,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send template message:', error);
      return false;
    }
  }
}

export default new WhatsAppService();