/**
 * Unified API Client
 *
 * Automatically selects the best network client based on build type and environment.
 * Uses APK-optimized client for APK builds, axios client for development.
 */

import config from '../../config/environment';
import apiClient from './apiClient';
import apkNetworkClient from './apkNetworkClient';

interface UnifiedClient {
  get<T>(url: string, headers?: any): Promise<T>;
  post<T>(url: string, data?: any, headers?: any): Promise<T>;
  put<T>(url: string, data?: any, headers?: any): Promise<T>;
  delete<T>(url: string, headers?: any): Promise<T>;
  patch<T>(url: string, data?: any, headers?: any): Promise<T>;
  jsonRpc(service: string, method: string, args?: any[], kwargs?: any): Promise<any>;
  testConnection(): Promise<{ success: boolean; message: string; details?: any }>;
  odooExecute(model: string, method: string, args?: any[], kwargs?: any): Promise<any>;
  authenticateAdmin(): Promise<{ uid: number; password: string; database: string }>;
  storeOdooCredentials(uid: number, password: string, database: string): Promise<void>;
  getOdooCredentials(): Promise<{ uid: number; password: string; database: string } | null>;
  clearOdooCredentials(): Promise<void>;
  setHeader(key: string, value: string): void;
  removeHeader(key: string): void;
}

class UnifiedAPIClient implements UnifiedClient {
  private useAPKClient: boolean;

  constructor() {
    // Determine which client to use
    this.useAPKClient = this.shouldUseAPKClient();

    // Log client selection for debugging
    if (config.DEBUG || config.IS_EAS_BUILD) {
      console.log(`🔧 Network Client Selected: ${this.useAPKClient ? 'APK-Optimized' : 'Axios'}`);
      console.log('📱 Build Info:', {
        isEASBuild: config.IS_EAS_BUILD,
        isProduction: config.IS_PRODUCTION,
        useAPKClientEnv: process.env.EXPO_PUBLIC_USE_APK_CLIENT,
        enableCleartext: process.env.EXPO_PUBLIC_ENABLE_CLEARTEXT
      });
    }
  }

  private shouldUseAPKClient(): boolean {
    // Check environment variable override
    if (process.env.EXPO_PUBLIC_USE_APK_CLIENT === 'true') {
      return true;
    }

    if (process.env.EXPO_PUBLIC_USE_APK_CLIENT === 'false') {
      return false;
    }

    // Auto-detect based on build type
    return apkNetworkClient.shouldUseAPKClient();
  }

  private getClient() {
    return this.useAPKClient ? apkNetworkClient : apiClient;
  }

  async get<T>(url: string, headers?: any): Promise<T> {
    const client = this.getClient();
    return client.get<T>(url, headers);
  }

  async post<T>(url: string, data?: any, headers?: any): Promise<T> {
    const client = this.getClient();
    return client.post<T>(url, data, headers);
  }

  async put<T>(url: string, data?: any, headers?: any): Promise<T> {
    const client = this.getClient();
    return client.put<T>(url, data, headers);
  }

  async delete<T>(url: string, headers?: any): Promise<T> {
    const client = this.getClient();
    return client.delete<T>(url, headers);
  }

  async patch<T>(url: string, data?: any, headers?: any): Promise<T> {
    const client = this.getClient();
    return client.patch<T>(url, data, headers);
  }

  async jsonRpc(service: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    const client = this.getClient();
    return client.jsonRpc(service, method, args, kwargs);
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const client = this.getClient();

    if (this.useAPKClient) {
      return apkNetworkClient.testOdooConnection();
    } else {
      return apiClient.testConnection();
    }
  }

  async odooExecute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    if (this.useAPKClient) {
      // For APK client, use JSON-RPC directly
      const adminCredentials = await this.authenticateAdmin();
      return this.jsonRpc('object', 'execute_kw', [
        adminCredentials.database,
        adminCredentials.uid,
        adminCredentials.password,
        model,
        method,
        args,
        kwargs,
      ]);
    } else {
      return apiClient.odooExecute(model, method, args, kwargs);
    }
  }

  async authenticateAdmin(): Promise<{ uid: number; password: string; database: string }> {
    if (this.useAPKClient) {
      // For APK client, implement admin authentication
      const database = config.ODOO.DATABASE;
      const username = config.ODOO.USERNAME;
      const password = config.ODOO.PASSWORD;

      if (!username || !password) {
        throw new Error('Admin credentials not configured in environment');
      }

      try {
        const uid = await this.jsonRpc('common', 'authenticate', [
          database,
          username,
          password,
          {},
        ]);

        if (!uid) {
          throw new Error('Admin authentication failed');
        }

        return { uid, password, database };
      } catch (error: any) {
        throw error;
      }
    } else {
      return apiClient.authenticateAdmin();
    }
  }

  async storeOdooCredentials(uid: number, password: string, database: string): Promise<void> {
    if (!this.useAPKClient) {
      return apiClient.storeOdooCredentials(uid, password, database);
    }
    // APK client doesn't store credentials
  }

  async getOdooCredentials(): Promise<{ uid: number; password: string; database: string } | null> {
    if (!this.useAPKClient) {
      return apiClient.getOdooCredentials();
    }
    // APK client doesn't store credentials
    return null;
  }

  async clearOdooCredentials(): Promise<void> {
    if (!this.useAPKClient) {
      return apiClient.clearOdooCredentials();
    }
    // APK client doesn't store credentials
  }

  setHeader(key: string, value: string): void {
    if (!this.useAPKClient) {
      apiClient.setHeader(key, value);
    }
    // APK client doesn't support custom headers yet
  }

  removeHeader(key: string): void {
    if (!this.useAPKClient) {
      apiClient.removeHeader(key);
    }
    // APK client doesn't support custom headers yet
  }

  // APK-specific methods
  async detectNetworkCapabilities() {
    if (this.useAPKClient) {
      return apkNetworkClient.detectNetworkCapabilities();
    }
    throw new Error('Network capabilities detection only available in APK client');
  }

  // Switch client at runtime (for testing)
  switchToAPKClient() {
    this.useAPKClient = true;
    console.log('🔄 Switched to APK network client');
  }

  switchToAxiosClient() {
    this.useAPKClient = false;
    console.log('🔄 Switched to Axios network client');
  }

  getCurrentClientType(): string {
    return this.useAPKClient ? 'APK-Optimized' : 'Axios';
  }
}

// Export singleton instance
export default new UnifiedAPIClient();