import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/environment';

// Token storage keys
const AUTH_TOKEN_KEY = config.STORAGE_KEYS.AUTH_TOKEN;
const REFRESH_TOKEN_KEY = config.STORAGE_KEYS.REFRESH_TOKEN;

class StandaloneClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${config.STANDALONE_API.BASE_URL}/api/v1`,
      timeout: config.NETWORK.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (config.LOG_API_CALLS || __DEV__) {
          console.log(`[StandaloneClient] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
        }

        return config;
      },
      (error) => {
        console.error('[StandaloneClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth errors and extract data
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log responses in development
        if (config.LOG_API_CALLS || __DEV__) {
          console.log(`[StandaloneClient] Response from ${response.config.url}:`, response.status);
        }

        // Return data directly
        return response.data;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Log errors
        console.error('[StandaloneClient] Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });

        // Handle 401 Unauthorized errors - attempt token refresh
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
              const access_token = response.access_token || response.token;

              await AsyncStorage.setItem(AUTH_TOKEN_KEY, access_token);

              this.processQueue(null);
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            await this.clearTokens();
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

  private async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${config.STANDALONE_API.BASE_URL}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  removeAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.axiosInstance.defaults.baseURL || '';
  }
}

export default new StandaloneClient();
