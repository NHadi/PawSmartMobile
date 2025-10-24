import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import config from '../../config/environment';
import whatsappService from '../whatsapp/whatsappService';

// Storage keys
const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;
const REFRESH_TOKEN_KEY = config.STORAGE_KEYS.REFRESH_TOKEN;
const USER_DATA_KEY = config.STORAGE_KEYS.USER_DATA;

console.log('=== STANDALONE AUTH SERVICE INIT ===');
console.log('AUTH_TOKEN_KEY:', AUTH_TOKEN_KEY);
console.log('REFRESH_TOKEN_KEY:', REFRESH_TOKEN_KEY);
console.log('USER_DATA_KEY:', USER_DATA_KEY);
console.log('===================================');

// Export interfaces to match API swagger specification
export interface LoginCredentials {
  username: string; // Can be username, email, or phone
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  role: 'customer';
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string; // Keep for backward compatibility
}

export interface SocialLoginRequest {
  provider: 'google' | 'facebook' | 'apple';
  access_token: string;
  id_token?: string;
  email?: string;
  name?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class StandaloneAuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.STANDALONE_API.BASE_URL;
  }

  /**
   * Login user with username/password
   * Matches POST /auth/login endpoint
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Response success:', data.success);
      console.log('Response data structure:', JSON.stringify(data, null, 2));
      console.log('============================');

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Transform the response to match expected LoginResponse format
      const transformedAuthData: LoginResponse = {
        access_token: data.data.tokens.accessToken,
        refresh_token: data.data.tokens.refreshToken,
        expires_in: 3600, // Default 1 hour, adjust if needed
        user: {
          id: parseInt(data.data.user.id),
          username: data.data.user.email,
          email: data.data.user.email,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName || '',
          phone: '', // Add if available in response
          role: data.data.user.role,
          status: data.data.user.status,
          lastLogin: data.data.user.lastLogin,
        }
      };

      console.log('=== TRANSFORMED AUTH DATA ===');
      console.log('Has access_token:', !!transformedAuthData.access_token);
      console.log('Access token length:', transformedAuthData.access_token?.length || 0);
      console.log('User data:', transformedAuthData.user);
      console.log('==============================');

      // Store auth data
      await this.storeAuthData(transformedAuthData);

      return transformedAuthData;
    } catch (error: any) {
      // Handle network errors
      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      }
      throw error;
    }
  }

  /**
   * Register new user
   * Matches POST /auth/register endpoint
   */
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Username atau email sudah terdaftar');
        }
        throw new Error(data.message || 'Registration failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Transform the response to match expected LoginResponse format
      const transformedAuthData: LoginResponse = {
        access_token: data.data.tokens.accessToken,
        refresh_token: data.data.tokens.refreshToken,
        expires_in: 3600, // Default 1 hour, adjust if needed
        user: {
          id: parseInt(data.data.user.id),
          username: data.data.user.email,
          email: data.data.user.email,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName || '',
          phone: userData.phone || '',
          role: data.data.user.role,
          status: data.data.user.status,
          lastLogin: data.data.user.lastLogin,
        }
      };

      // Store auth data
      await this.storeAuthData(transformedAuthData);

      return transformedAuthData;
    } catch (error: any) {
      if (error.message?.includes('Network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT')) {
        throw new Error('Server tidak tersedia. Silakan coba lagi nanti.');
      }
      throw error;
    }
  }

  /**
   * Social login
   * Matches POST /auth/social/{provider} endpoints
   */
  async socialLogin(provider: 'google' | 'facebook' | 'apple', socialData: SocialLoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Social login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Social login failed');
      }

      // Transform the response to match expected LoginResponse format
      const transformedAuthData: LoginResponse = {
        access_token: data.data.tokens.accessToken,
        refresh_token: data.data.tokens.refreshToken,
        expires_in: 3600, // Default 1 hour, adjust if needed
        user: {
          id: parseInt(data.data.user.id),
          username: data.data.user.email,
          email: data.data.user.email,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName || '',
          phone: '', // Add if available in response
          role: data.data.user.role,
          status: data.data.user.status,
          lastLogin: data.data.user.lastLogin,
        }
      };

      // Store auth data
      await this.storeAuthData(transformedAuthData);

      return transformedAuthData;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Logout user
   * Matches POST /auth/logout endpoint
   */
  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await fetch(`${this.baseURL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // Continue with logout even if server call fails
    } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  /**
   * Refresh JWT token
   * Matches POST /auth/refresh endpoint
   */
  async refreshToken(): Promise<LoginResponse | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        await this.clearAuthData();
        return null;
      }

      await this.storeAuthData(data.data);
      return data.data;
    } catch (error) {
      await this.clearAuthData();
      return null;
    }
  }

  /**
   * Verify current token validity
   * Uses GET /auth/me endpoint
   */
  async verifyToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user profile
   * Uses GET /auth/me endpoint
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('=== GET CURRENT USER ===');
      console.log('Storage Key:', AUTH_TOKEN_KEY);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'null');

      if (!token) {
        console.log('❌ No token found in storage');
        return null;
      }

      const url = `${this.baseURL}/api/v1/auth/me`;
      console.log('Calling URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.log('❌ Response not OK:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('✅ Auth/me response success:', data.success);
      console.log('========================');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  /**
   * Change password
   * Matches PUT /auth/change-password endpoint
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${this.baseURL}/api/v1/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return data.success;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Request password reset
   * Matches POST /auth/forgot-password endpoint
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data.success;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Reset password with token
   * Matches POST /auth/reset-password endpoint
   */
  async resetPassword(resetData: PasswordResetConfirmRequest): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data.success;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthHeader(): Promise<string | null> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(authData: LoginResponse): Promise<void> {
    console.log('=== STORING AUTH DATA ===');
    console.log('Storage Key (AUTH_TOKEN_KEY):', AUTH_TOKEN_KEY);
    console.log('Has access_token:', !!authData.access_token);
    console.log('Access token length:', authData.access_token?.length || 0);
    console.log('Access token preview:', authData.access_token ? authData.access_token.substring(0, 30) + '...' : 'null');
    console.log('Has refresh_token:', !!authData.refresh_token);
    console.log('Has user:', !!authData.user);
    console.log('========================');

    if (authData.access_token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.access_token);
      console.log('✅ Token stored successfully');
    } else {
      console.warn('❌ No access_token in auth data, skipping storage');
    }

    if (authData.refresh_token) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
    }

    if (authData.user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
    }
  }

  /**
   * Clear authentication data
   */
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY,
    ]);
  }

  /**
   * Check if token needs refresh
   */
  async shouldRefreshToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return false;

      // Parse JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const threshold = config.STANDALONE_API.TOKEN_REFRESH_THRESHOLD || 300; // 5 minutes default

      return payload.exp - currentTime < threshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure valid token (refresh if needed)
   */
  async ensureValidToken(): Promise<string | null> {
    try {
      if (await this.shouldRefreshToken()) {
        await this.refreshToken();
      }
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if username is available
   * Matches GET /auth/check-username?username={username} endpoint
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If endpoint doesn't exist, assume username is available (for development)
        if (response.status === 404) {
          console.warn('Username check endpoint not available, assuming available');
          return true;
        }
        throw new Error(data.message || 'Username check failed');
      }

      return data.success ? data.available : true;
    } catch (error: any) {
      // Log error but don't block registration
      console.warn('Username availability check failed:', error.message);
      return true; // Assume available to not block registration
    }
  }

  /**
   * Check if email is available
   * Matches GET /auth/check-email?email={email} endpoint
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If endpoint doesn't exist, assume email is available (for development)
        if (response.status === 404) {
          console.warn('Email check endpoint not available, assuming available');
          return true;
        }
        throw new Error(data.message || 'Email check failed');
      }

      return data.success ? data.available : true;
    } catch (error: any) {
      // Log error but don't block registration
      console.warn('Email availability check failed:', error.message);
      return true; // Assume available to not block registration
    }
  }

  /**
   * Check if phone number is already registered
   * Matches GET /auth/check-phone?phone={phone} endpoint
   */
  async checkPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/check-phone?phone=${encodeURIComponent(phoneNumber)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If endpoint doesn't exist, assume phone is not registered (for development)
        if (response.status === 404) {
          console.warn('Phone check endpoint not available, assuming not registered');
          return false;
        }
        throw new Error(data.message || 'Phone check failed');
      }

      return data.success ? data.registered : false;
    } catch (error: any) {
      // Log error but don't block registration
      console.warn('Phone registration check failed:', error.message);
      return false; // Assume not registered to not block registration
    }
  }

  /**
   * Generate OTP for phone verification
   * Uses Fonnte WhatsApp service + local storage for verification
   */
  async generateOTP(phoneNumber: string): Promise<string> {
    console.log(`🔄 Generating OTP for ${phoneNumber} using WhatsApp service`);

    // Generate a 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP locally for verification
    const otpData = {
      otp: otpCode,
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes (WhatsApp standard)
    };

    await AsyncStorage.setItem(`@PawSmart:otp:${phoneNumber}`, JSON.stringify(otpData));
    console.log(`💾 OTP stored locally: ${otpCode}`);

    // Send OTP via WhatsApp (Fonnte service)
    try {
      console.log(`📱 Sending OTP via WhatsApp to ${phoneNumber}`);
      const messageSent = await whatsappService.sendOTP(phoneNumber, otpCode);

      if (messageSent) {
        console.log(`✅ OTP sent successfully via WhatsApp to ${phoneNumber}`);
        console.log(`📱 Check WhatsApp for OTP: ${otpCode}`);
      } else {
        console.warn(`⚠️ WhatsApp service failed, but OTP is still available locally`);
        console.log(`💡 OTP (development fallback): ${otpCode}`);
      }
    } catch (error: any) {
      console.error(`❌ WhatsApp service error:`, error.message);
      console.log(`💡 OTP is still available for testing: ${otpCode}`);
    }

    return otpCode;
  }

  /**
   * Verify OTP and complete registration if needed
   * Uses local verification + standalone API for registration completion
   */
  async verifyOTP(data: {
    phoneNumber: string;
    otp: string;
    registrationData?: any;
  }): Promise<{ success: boolean; message?: string }> {
    console.log(`🔍 Verifying OTP for ${data.phoneNumber}`);

    try {
      const storedData = await AsyncStorage.getItem(`@PawSmart:otp:${data.phoneNumber}`);
      console.log(`📱 Looking for stored OTP for ${data.phoneNumber}`);

      if (!storedData) {
        console.warn(`❌ No OTP found in storage for phone: ${data.phoneNumber}`);
        return { success: false, message: 'OTP tidak ditemukan' };
      }

      const otpData = JSON.parse(storedData);
      console.log(`📋 Found stored OTP for ${data.phoneNumber}:`, {
        otp: otpData.otp,
        expiresAt: new Date(otpData.expiresAt).toISOString(),
        timeRemaining: Math.max(0, otpData.expiresAt - Date.now()) + 'ms'
      });

      // Check if OTP is expired
      if (Date.now() > otpData.expiresAt) {
        await AsyncStorage.removeItem(`@PawSmart:otp:${data.phoneNumber}`);
        console.warn(`⏰ OTP expired for ${data.phoneNumber}`);
        return { success: false, message: 'OTP telah kadaluarsa' };
      }

      // Verify OTP
      if (otpData.otp !== data.otp) {
        console.warn(`❌ OTP mismatch for ${data.phoneNumber}. Expected: ${otpData.otp}, Received: ${data.otp}`);
        return { success: false, message: 'Kode OTP tidak valid' };
      }

      console.log(`✅ OTP verified successfully for ${data.phoneNumber}`);

      // If OTP is valid and we have registration data, complete registration in standalone API
      if (data.registrationData) {
        console.log(`🔄 Completing user registration for ${data.registrationData.username}...`);
        try {
          const registrationResult = await this.register(data.registrationData);
          console.log('✅ Registration completed successfully');
        } catch (error: any) {
          console.error('❌ Registration completion failed:', error);
          return { success: false, message: error.message || 'Registrasi gagal' };
        }
      }

      // Clear OTP after successful verification
      await AsyncStorage.removeItem(`@PawSmart:otp:${data.phoneNumber}`);
      console.log(`🗑️ OTP cleared from storage for ${data.phoneNumber}`);

      return { success: true };
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      return { success: false, message: error.message || 'Verifikasi OTP gagal' };
    }
  }
}

export default new StandaloneAuthService();