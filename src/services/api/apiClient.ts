import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_CONFIG } from '../config/api.config';
import config from '../../config/environment';

// Token storage keys
const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;
const REFRESH_TOKEN_KEY = config.STORAGE_KEYS.REFRESH_TOKEN;
const ODOO_CREDENTIALS_KEY = config.STORAGE_KEYS.ODOO_CREDENTIALS;

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.axiosInstance(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { access_token } = response.data;
              
              await AsyncStorage.setItem(AUTH_TOKEN_KEY, access_token);
              
              this.processQueue(null);
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            // Clear tokens and redirect to login
            await this.clearTokens();
            // You might want to trigger a logout event here
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  private async refreshToken(refreshToken: string) {
    return this.axiosInstance.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  // Generic request methods with retry logic
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() => this.axiosInstance.get<T>(url, config));
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() => this.axiosInstance.post<T>(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() => this.axiosInstance.put<T>(url, data, config));
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() => this.axiosInstance.delete<T>(url, config));
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() => this.axiosInstance.patch<T>(url, data, config));
  }

  // Enhanced retry logic for APK builds with better error handling
  private async retryRequest<T>(requestFn: () => Promise<any>): Promise<T> {
    let lastError: any;
    const { MAX_RETRIES, RETRY_DELAY, RETRY_MULTIPLIER } = API_CONFIG.RETRY;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error: any) {
        lastError = error;


        // Don't retry on certain status codes
        if (error.response?.status && [400, 401, 403, 404, 422].includes(error.response.status)) {
          throw error;
        }

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(RETRY_MULTIPLIER, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Test connection to Odoo server (APK-compatible)
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const startTime = Date.now();

      // For APK builds, use fetch API for better compatibility
      if (config.IS_EAS_BUILD) {
        try {
          const response = await fetch(`${this.axiosInstance.defaults.baseURL}/web/database/selector`, {
            method: 'GET',
            timeout: 10000,
            headers: {
              'User-Agent': 'PawSmart Mobile App',
              'Accept': 'application/json',
            }
          });

          const responseTime = Date.now() - startTime;

          return {
            success: response.ok,
            message: `APK Connection ${response.ok ? 'successful' : 'failed'} (${responseTime}ms)`,
            details: {
              responseTime,
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              type: response.type,
              isAPK: true,
            }
          };
        } catch (fetchError: any) {
          const responseTime = Date.now() - startTime;
          return {
            success: false,
            message: `APK Connection failed: ${fetchError.message}`,
            details: {
              error: fetchError.message,
              name: fetchError.name,
              responseTime,
              url: this.axiosInstance.defaults.baseURL,
              isAPK: true,
            }
          };
        }
      }

      // For development, use axios
      const response = await this.axiosInstance.get('/web/database/selector', {
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: `Connection successful (${responseTime}ms)`,
        details: {
          responseTime,
          status: response.status,
          url: this.axiosInstance.defaults.baseURL,
          isAPK: false,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: {
          error: error.message,
          code: error.code,
          status: error.response?.status,
          url: this.axiosInstance.defaults.baseURL,
          isAPK: config.IS_EAS_BUILD,
        }
      };
    }
  }

  // Test Odoo connection (alias for backwards compatibility)
  async testOdooConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    return this.testConnection();
  }

  // Odoo JSON-RPC specific method
  async jsonRpc(service: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
        kwargs,
      },
      id: new Date().getTime(),
    };

    try {
      const response = await this.axiosInstance.post('/jsonrpc', payload, {
        withCredentials: false,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data.error) {
        const errorMessage = response.data.error.data?.message || response.data.error.message || 'JSON-RPC Error';
        throw new Error(errorMessage);
      }
      
      // Odoo returns false for failed authentication, not an error
      return response.data.result;
    } catch (error: any) {
      // Enhanced error information for debugging
      let debugMessage = `API Error - Service: ${service}, Method: ${method}`;

      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        debugMessage += ' - Network connection failed';
      }

      if (error.response?.status) {
        debugMessage += ` - Status: ${error.response.status}`;
      }


      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error.data?.message || error.response.data.error.message || 'JSON-RPC Error';
        throw new Error(`${errorMessage} (${debugMessage})`);
      }

      // For network errors, provide more specific error message
      if (error.message?.includes('Network Error') || !error.response) {
        throw new Error(`Server tidak tersedia - Periksa koneksi internet. URL: ${this.axiosInstance.defaults.baseURL}`);
      }

      throw new Error(`${error.message} (${debugMessage})`);
    }
  }

  // Set custom headers
  setHeader(key: string, value: string) {
    this.axiosInstance.defaults.headers.common[key] = value;
  }

  // Remove custom headers
  removeHeader(key: string) {
    delete this.axiosInstance.defaults.headers.common[key];
  }

  // Store Odoo credentials for subsequent API calls
  // @deprecated - We now use admin credentials from .env for all API calls
  async storeOdooCredentials(uid: number, password: string, database: string) {
    // No longer storing user credentials for API calls
    }

  // Get stored Odoo credentials
  // @deprecated - We now use admin credentials from .env for all API calls
  async getOdooCredentials(): Promise<{ uid: number; password: string; database: string } | null> {
    // Always return null to force using admin credentials
    return null;
  }

  // Clear Odoo credentials
  async clearOdooCredentials() {
    await AsyncStorage.removeItem(ODOO_CREDENTIALS_KEY);
    await AsyncStorage.removeItem(config.STORAGE_KEYS.ADMIN_CREDENTIALS);
  }

  // Execute Odoo API call with .env credentials (admin access for API calls)
  async odooExecute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    // First check if we have an admin session, if not authenticate with .env credentials
    let adminCredentials = await this.getAdminCredentials();
    
    if (!adminCredentials) {
      // Authenticate with .env credentials for API access
      adminCredentials = await this.authenticateAdmin();
    }

    return this.jsonRpc('object', 'execute_kw', [
      adminCredentials.database,
      adminCredentials.uid,
      adminCredentials.password,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  // Authenticate with admin credentials from .env for API access
  async authenticateAdmin(): Promise<{ uid: number; password: string; database: string }> {
    // Check if we already have admin credentials cached
    const cachedCredentials = await this.getAdminCredentials();
    if (cachedCredentials) {
      return cachedCredentials;
    }
    
    const database = config.ODOO.DATABASE;
    const username = config.ODOO.USERNAME;
    const password = config.ODOO.PASSWORD;

    if (!username || !password) {
      throw new Error('Admin credentials not configured in environment');
    }

    try {
      // Authenticate with Odoo
      const uid = await this.jsonRpc('common', 'authenticate', [
        database,
        username,
        password,
        {},
      ]);

      if (!uid) {
        throw new Error('Admin authentication failed');
      }

      // Store admin credentials separately from user credentials
      const adminCredentials = { uid, password, database };
      await AsyncStorage.setItem(config.STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(adminCredentials));
      
      return adminCredentials;
    } catch (error: any) {
      throw error;
    }
  }

  // Get stored admin credentials (for API access)
  private async getAdminCredentials(): Promise<{ uid: number; password: string; database: string } | null> {
    try {
      const credentials = await AsyncStorage.getItem(config.STORAGE_KEYS.ADMIN_CREDENTIALS);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export default new ApiClient();