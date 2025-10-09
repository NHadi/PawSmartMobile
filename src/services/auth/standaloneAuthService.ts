import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import config from '../../config/environment';

// Storage keys
const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;
const REFRESH_TOKEN_KEY = config.STORAGE_KEYS.REFRESH_TOKEN;
const USER_DATA_KEY = config.STORAGE_KEYS.USER_DATA;

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
  name: string;
  phone: string;
  avatar?: string;
  role: 'customer';
  is_active: boolean;
  created_at: string;
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
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Store auth data
      await this.storeAuthData(data.data);

      return data.data;
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
      const response = await fetch(`${this.baseURL}/auth/register`, {
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

      // Store auth data
      await this.storeAuthData(data.data);

      return data.data;
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
      const response = await fetch(`${this.baseURL}/auth/social/${provider}`, {
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

      // Store auth data
      await this.storeAuthData(data.data);

      return data.data;
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
        await fetch(`${this.baseURL}/auth/logout`, {
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

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
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

      const response = await fetch(`${this.baseURL}/auth/me`, {
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
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
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

      const response = await fetch(`${this.baseURL}/auth/change-password`, {
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
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
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
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
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
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.access_token);
    if (authData.refresh_token) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
    }
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
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
}

export default new StandaloneAuthService();