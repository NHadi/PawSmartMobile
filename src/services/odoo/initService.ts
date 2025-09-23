import AsyncStorage from '@react-native-async-storage/async-storage';
import odooComService from '../odoocom/odooComService';
import odooDoctorService from './doctorService';
import odooSyncService from './syncService';
import apiClient from '../api/apiClient';

/**
 * ODOO Integration Initialization Service
 * Manages the initialization and setup of ODOO integration
 */
class OdooInitService {
  private isInitialized: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private readonly LOG_KEY = '@PawSmart:OdooLogs';
  private readonly MAX_LOG_ENTRIES = 100;

  /**
   * Initialize ODOO integration
   */
  async initialize(): Promise<boolean> {
    // Prevent multiple initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<boolean> {
    if (this.isInitialized) {
      this.log('info', 'ODOO integration already initialized');
      return true;
    }

    try {
      this.log('info', 'Starting ODOO integration initialization...');

      // Step 1: Check ODOO connectivity
      const isConnected = await this.checkOdooConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to ODOO server');
      }

      // Step 2: Authenticate admin for API access
      await this.authenticateAdmin();

      // Step 3: Validate required ODOO models
      await this.validateOdooModels();

      // Step 4: Initialize synchronization service
      await odooSyncService.initialize();

      // Step 5: Cache initial data
      await this.cacheInitialData();

      this.isInitialized = true;
      this.log('info', 'ODOO integration initialized successfully');
      
      return true;
    } catch (error) {
      this.log('error', `ODOO initialization failed: ${error.message}`, error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Check ODOO server connection
   */
  private async checkOdooConnection(): Promise<boolean> {
    try {
      this.log('info', 'Checking ODOO server connection...');
      
      // Try to get server version
      const version = await apiClient.jsonRpc('common', 'version', []);
      
      if (version) {
        this.log('info', `Connected to ODOO server version: ${JSON.stringify(version)}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.log('error', 'ODOO connection check failed', error);
      return false;
    }
  }

  /**
   * Authenticate admin user for API access
   */
  private async authenticateAdmin(): Promise<void> {
    try {
      this.log('info', 'Authenticating admin for API access...');
      
      // This will use the credentials from .env
      await apiClient.authenticateAdmin();
      
      this.log('info', 'Admin authenticated successfully');
    } catch (error) {
      this.log('error', 'Admin authentication failed', error);
      throw error;
    }
  }

  /**
   * Validate required ODOO models exist
   */
  private async validateOdooModels(): Promise<void> {
    const requiredModels = [
      'hr.employee',
      'medical.appointment',
      'medical.record',
      'medical.prescription',
      'product.product',
      'sale.order',
      'account.move',
      'res.partner',
    ];

    const missingModels: string[] = [];

    for (const model of requiredModels) {
      try {
        // Try to get fields for the model
        const fields = await odooComService.fieldsGet(model, ['name']);
        
        if (!fields || Object.keys(fields).length === 0) {
          missingModels.push(model);
        }
      } catch (error) {
        this.log('warn', `Model ${model} not accessible`, error);
        missingModels.push(model);
      }
    }

    if (missingModels.length > 0) {
      this.log('warn', `Missing or inaccessible ODOO models: ${missingModels.join(', ')}`);
      
      // For now, we'll continue even if some models are missing
      // In production, you might want to throw an error or handle this differently
    } else {
      this.log('info', 'All required ODOO models validated');
    }
  }

  /**
   * Cache initial data for offline support
   */
  private async cacheInitialData(): Promise<void> {
    try {
      this.log('info', 'Caching initial data...');
      
      // Cache doctors list
      const doctors = await odooDoctorService.getDoctors({ available: true });
      if (doctors && doctors.length > 0) {
        await AsyncStorage.setItem(
          '@PawSmart:CachedDoctors',
          JSON.stringify({
            data: doctors,
            timestamp: Date.now(),
          })
        );
        this.log('info', `Cached ${doctors.length} doctors`);
      }

      // Cache product categories
      const categories = await odooComService.getCategories();
      if (categories && categories.length > 0) {
        await AsyncStorage.setItem(
          '@PawSmart:CachedCategories',
          JSON.stringify({
            data: categories,
            timestamp: Date.now(),
          })
        );
        this.log('info', `Cached ${categories.length} categories`);
      }

      this.log('info', 'Initial data cached successfully');
    } catch (error) {
      this.log('warn', 'Failed to cache initial data', error);
      // Don't throw - caching is not critical for initialization
    }
  }

  /**
   * Re-initialize ODOO integration
   */
  async reinitialize(): Promise<boolean> {
    this.log('info', 'Re-initializing ODOO integration...');
    
    // Clear initialization state
    this.isInitialized = false;
    this.initPromise = null;
    
    // Clear sync service
    odooSyncService.stopPeriodicSync();
    
    // Clear cached data
    await this.clearCache();
    
    // Re-initialize
    return this.initialize();
  }

  /**
   * Check if ODOO integration is initialized
   */
  isOdooInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status details
   */
  async getInitializationStatus(): Promise<{
    initialized: boolean;
    connected: boolean;
    authenticated: boolean;
    syncStatus: any;
    lastError?: string;
  }> {
    const syncStatus = await odooSyncService.getSyncStatus();
    const logs = await this.getLogs();
    const lastError = logs.find(log => log.level === 'error');

    return {
      initialized: this.isInitialized,
      connected: await this.checkOdooConnection(),
      authenticated: await this.isAuthenticated(),
      syncStatus,
      lastError: lastError?.message,
    };
  }

  /**
   * Check if authenticated
   */
  private async isAuthenticated(): Promise<boolean> {
    try {
      const credentials = await AsyncStorage.getItem('@PawSmart:adminCredentials');
      return !!credentials;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all ODOO-related cache
   */
  async clearCache(): Promise<void> {
    try {
      this.log('info', 'Clearing ODOO cache...');
      
      const keys = await AsyncStorage.getAllKeys();
      const odooKeys = keys.filter(key => 
        key.includes('Odoo') || 
        key.includes('Doctor') ||
        key.includes('Medical') ||
        key.includes('Appointment') ||
        key.includes('Cached')
      );
      
      if (odooKeys.length > 0) {
        await AsyncStorage.multiRemove(odooKeys);
        this.log('info', `Cleared ${odooKeys.length} cache entries`);
      }
      
      // Clear service-specific caches
      await odooDoctorService.clearCache();
      await odooSyncService.clearSyncData();
      
      this.log('info', 'ODOO cache cleared successfully');
    } catch (error) {
      this.log('error', 'Failed to clear cache', error);
      throw error;
    }
  }

  /**
   * Log message with level and optional error
   */
  private async log(
    level: 'info' | 'warn' | 'error',
    message: string,
    error?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error ? {
        message: error.message || String(error),
        stack: error.stack,
      } : undefined,
    };

    // Logging disabled for production
    // const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    // consoleMethod(`[ODOO ${level.toUpperCase()}]`, message, error || '');

    // Store in AsyncStorage
    try {
      const logsStr = await AsyncStorage.getItem(this.LOG_KEY);
      const logs = logsStr ? JSON.parse(logsStr) : [];
      
      logs.unshift(logEntry);
      
      // Keep only the latest entries
      if (logs.length > this.MAX_LOG_ENTRIES) {
        logs.splice(this.MAX_LOG_ENTRIES);
      }
      
      await AsyncStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
    } catch (storageError) {
      }
  }

  /**
   * Get stored logs
   */
  async getLogs(level?: 'info' | 'warn' | 'error'): Promise<any[]> {
    try {
      const logsStr = await AsyncStorage.getItem(this.LOG_KEY);
      const logs = logsStr ? JSON.parse(logsStr) : [];
      
      if (level) {
        return logs.filter((log: any) => log.level === level);
      }
      
      return logs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LOG_KEY);
      } catch (error) {
      }
  }

  /**
   * Test ODOO integration
   */
  async testIntegration(): Promise<{
    success: boolean;
    tests: Array<{
      name: string;
      success: boolean;
      message?: string;
      duration?: number;
    }>;
  }> {
    const tests: any[] = [];
    let overallSuccess = true;

    // Test 1: Connection
    const connectionStart = Date.now();
    try {
      const connected = await this.checkOdooConnection();
      tests.push({
        name: 'ODOO Connection',
        success: connected,
        message: connected ? 'Connected successfully' : 'Connection failed',
        duration: Date.now() - connectionStart,
      });
      if (!connected) overallSuccess = false;
    } catch (error) {
      tests.push({
        name: 'ODOO Connection',
        success: false,
        message: error.message,
        duration: Date.now() - connectionStart,
      });
      overallSuccess = false;
    }

    // Test 2: Authentication
    const authStart = Date.now();
    try {
      const authenticated = await this.isAuthenticated();
      tests.push({
        name: 'Authentication',
        success: authenticated,
        message: authenticated ? 'Authenticated' : 'Not authenticated',
        duration: Date.now() - authStart,
      });
      if (!authenticated) overallSuccess = false;
    } catch (error) {
      tests.push({
        name: 'Authentication',
        success: false,
        message: error.message,
        duration: Date.now() - authStart,
      });
      overallSuccess = false;
    }

    // Test 3: Doctor Service
    const doctorStart = Date.now();
    try {
      const doctors = await odooDoctorService.getDoctors({ limit: 1 });
      tests.push({
        name: 'Doctor Service',
        success: true,
        message: `Found ${doctors.length} doctors`,
        duration: Date.now() - doctorStart,
      });
    } catch (error) {
      tests.push({
        name: 'Doctor Service',
        success: false,
        message: error.message,
        duration: Date.now() - doctorStart,
      });
      overallSuccess = false;
    }

    // Test 4: Sync Service
    const syncStart = Date.now();
    try {
      const syncStatus = await odooSyncService.getSyncStatus();
      tests.push({
        name: 'Sync Service',
        success: true,
        message: syncStatus ? 'Sync service ready' : 'Sync service not initialized',
        duration: Date.now() - syncStart,
      });
    } catch (error) {
      tests.push({
        name: 'Sync Service',
        success: false,
        message: error.message,
        duration: Date.now() - syncStart,
      });
      overallSuccess = false;
    }

    return {
      success: overallSuccess,
      tests,
    };
  }
}

export default new OdooInitService();