/**
 * APK-Optimized Network Client
 *
 * This client uses native fetch API instead of axios for better APK compatibility.
 * Includes comprehensive error handling, retry logic, and APK-specific debugging.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import config from '../../config/environment';
import NetInfo from '@react-native-community/netinfo';

// Network capability detection
interface NetworkCapabilities {
  canConnect: boolean;
  connectionType: string;
  isInternetReachable: boolean;
  networkState: any;
  error?: string;
}

class APKNetworkClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = config.ODOO.BASE_URL;
    this.timeout = config.NETWORK.TIMEOUT;
    this.maxRetries = config.NETWORK.RETRY_ATTEMPTS;
    this.retryDelay = config.NETWORK.RETRY_DELAY;
  }

  /**
   * Detect network capabilities for APK debugging
   */
  async detectNetworkCapabilities(): Promise<NetworkCapabilities> {
    try {
      const netState = await NetInfo.fetch();

      const capabilities: NetworkCapabilities = {
        canConnect: netState.isConnected ?? false,
        connectionType: netState.type || 'unknown',
        isInternetReachable: netState.isInternetReachable ?? false,
        networkState: netState
      };

      // Test basic connectivity
      try {
        const response = await this.timeoutFetch('https://www.google.com', {
          method: 'HEAD',
          timeout: 5000
        });
        capabilities.canConnect = response.ok;
      } catch (error: any) {
        capabilities.error = error.message;
        capabilities.canConnect = false;
      }

      return capabilities;
    } catch (error: any) {
      return {
        canConnect: false,
        connectionType: 'error',
        isInternetReachable: false,
        networkState: null,
        error: error.message
      };
    }
  }

  /**
   * Fetch with timeout support for APK builds
   */
  private async timeoutFetch(url: string, options: any = {}): Promise<Response> {
    const timeoutMs = options.timeout || this.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'PawSmart Mobile App',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      throw error;
    }
  }

  /**
   * Enhanced retry logic for APK builds
   */
  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    operation: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await requestFn();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Log successful request for APK debugging
        if (config.DEBUG || config.IS_EAS_BUILD) {
          console.log(`✅ APK Network Success (attempt ${attempt + 1}):`, {
            operation,
            url: response.url,
            status: response.status,
            type: response.type
          });
        }

        return data;
      } catch (error: any) {
        lastError = error;

        // Enhanced APK error logging
        if (config.DEBUG || config.IS_EAS_BUILD) {
          console.log(`❌ APK Network Error (attempt ${attempt + 1}/${this.maxRetries + 1}):`, {
            operation,
            error: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 200)
          });
        }

        // Don't retry on certain errors
        if (error.message.includes('404') || error.message.includes('401')) {
          break;
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          if (config.DEBUG || config.IS_EAS_BUILD) {
            console.log(`⏳ APK Network Retry in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Show APK-specific error dialog
    if (config.DEBUG || config.IS_EAS_BUILD) {
      this.showAPKNetworkError(operation, lastError);
    }

    throw lastError;
  }

  /**
   * Show APK-specific network error dialog
   */
  private showAPKNetworkError(operation: string, error: any) {
    let message = `APK Network Operation Failed\n\n`;
    message += `Operation: ${operation}\n`;
    message += `Error: ${error.message}\n`;
    message += `Type: ${error.name || 'Unknown'}\n\n`;
    message += `APK Troubleshooting:\n`;
    message += `• Check if internet connection is available\n`;
    message += `• Verify HTTP cleartext traffic is enabled\n`;
    message += `• Test with different network (WiFi/Mobile)\n`;
    message += `• Check Android network permissions\n`;

    Alert.alert(
      'APK Network Error',
      message,
      [
        {
          text: 'Test Connectivity',
          onPress: async () => {
            const capabilities = await this.detectNetworkCapabilities();
            Alert.alert(
              'Network Capabilities',
              JSON.stringify(capabilities, null, 2)
            );
          }
        },
        { text: 'OK' }
      ]
    );
  }

  /**
   * Test connection to Odoo server (APK-optimized)
   */
  async testOdooConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const startTime = Date.now();

      const response = await this.timeoutFetch(`${this.baseURL}/web/database/selector`, {
        method: 'GET',
        timeout: 10000
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
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `APK Connection failed: ${error.message}`,
        details: {
          error: error.message,
          name: error.name,
          stack: error.stack,
          baseURL: this.baseURL
        }
      };
    }
  }

  /**
   * Odoo JSON-RPC call (APK-optimized)
   */
  async jsonRpc(
    service: string,
    method: string,
    args: any[] = [],
    kwargs: any = {}
  ): Promise<any> {
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

    return this.retryRequest(async () => {
      const token = await AsyncStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);

      return this.timeoutFetch(`${this.baseURL}/jsonrpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
    }, `JSON-RPC ${service}.${method}`);
  }

  /**
   * Generic GET request (APK-optimized)
   */
  async get<T>(url: string, headers: any = {}): Promise<T> {
    return this.retryRequest(async () => {
      const token = await AsyncStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);

      return this.timeoutFetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...headers
        }
      });
    }, `GET ${url}`);
  }

  /**
   * Generic POST request (APK-optimized)
   */
  async post<T>(url: string, data: any, headers: any = {}): Promise<T> {
    return this.retryRequest(async () => {
      const token = await AsyncStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);

      return this.timeoutFetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...headers
        },
        body: JSON.stringify(data)
      });
    }, `POST ${url}`);
  }

  /**
   * Check if APK network client should be used
   */
  static shouldUseAPKClient(): boolean {
    return config.IS_EAS_BUILD || config.IS_PRODUCTION;
  }
}

// Export singleton instance
export default new APKNetworkClient();