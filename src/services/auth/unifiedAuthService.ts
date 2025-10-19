import config from '../../config/environment';
import authService, { User as AuthUser, LoginResponse as OdooLoginResponse } from './authService';
import standaloneAuthService, { User as StandaloneUser, LoginResponse as StandaloneLoginResponse } from './standaloneAuthService';

// Union type for users
export type User = AuthUser | StandaloneUser;

// Union type for login responses
export type LoginResponse = OdooLoginResponse | StandaloneLoginResponse;

class UnifiedAuthService {
  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.checkUsernameAvailability(username);
    } else {
      return authService.checkUsernameAvailability(username);
    }
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.checkEmailAvailability(email);
    } else {
      return authService.checkEmailAvailability(email);
    }
  }

  /**
   * Check if phone number is registered
   */
  async checkPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.checkPhoneNumberRegistered(phoneNumber);
    } else {
      return authService.checkPhoneNumberRegistered(phoneNumber);
    }
  }

  /**
   * Generate OTP
   */
  async generateOTP(phoneNumber: string): Promise<string> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.generateOTP(phoneNumber);
    } else {
      return authService.generateOTP(phoneNumber);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: {
    phoneNumber: string;
    otp: string;
    registrationData?: any;
  }): Promise<{ success: boolean; message?: string }> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.verifyOTP(data);
    } else {
      return authService.verifyOTP(data);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.changePassword(data);
    } else {
      // Odoo requires user ID, this is a simplified interface
      throw new Error('Change password not implemented for Odoo in unified service');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.forgotPassword(email);
    } else {
      throw new Error('Forgot password not implemented for Odoo in unified service');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<boolean> {
    if (config.USE_STANDALONE_API) {
      return standaloneAuthService.resetPassword(data);
    } else {
      throw new Error('Reset password not implemented for Odoo in unified service');
    }
  }
}

export default new UnifiedAuthService();