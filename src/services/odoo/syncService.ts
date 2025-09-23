import AsyncStorage from '@react-native-async-storage/async-storage';
import odooDoctorService from './doctorService';
import odooComService from '../odoocom/odooComService';

/**
 * ODOO Synchronization Service
 * Handles real-time data synchronization between app and ODOO
 */
class OdooSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private readonly SYNC_STATUS_KEY = '@PawSmart:SyncStatus';
  private readonly SYNC_QUEUE_KEY = '@PawSmart:SyncQueue';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly BATCH_SIZE = 10;

  /**
   * Initialize synchronization service
   */
  async initialize(): Promise<void> {
    try {
      // Load pending sync operations
      await this.processPendingSyncQueue();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      } catch (error) {
      }
  }

  /**
   * Start periodic synchronization
   */
  startPeriodicSync(): void {
    if (this.syncInterval) {
      this.stopPeriodicSync();
    }

    this.syncInterval = setInterval(async () => {
      if (!this.isSyncing) {
        await this.performSync();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform synchronization
   */
  async performSync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      // Process pending operations from queue
      await this.processPendingSyncQueue();
      
      // Sync critical data
      await this.syncDoctors();
      await this.syncAppointments();
      await this.syncMedicalRecords();
      
      // Update sync status
      await this.updateSyncStatus({
        lastSync: new Date().toISOString(),
        status: 'success',
      });
      
      } catch (error) {
      await this.updateSyncStatus({
        lastSync: new Date().toISOString(),
        status: 'error',
        error: error.message,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Add operation to sync queue (for offline support)
   */
  async addToSyncQueue(operation: {
    type: 'create' | 'update' | 'delete';
    model: string;
    data: any;
    timestamp?: string;
  }): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      
      queue.push({
        ...operation,
        timestamp: operation.timestamp || new Date().toISOString(),
        id: this.generateOperationId(),
        retryCount: 0,
      });
      
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Try to process immediately if online
      if (await this.isOnline()) {
        await this.processPendingSyncQueue();
      }
    } catch (error) {
      }
  }

  /**
   * Process pending sync queue
   */
  async processPendingSyncQueue(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      
      if (queue.length === 0) {
        return;
      }
      
      const processedIds: string[] = [];
      const failedOperations: any[] = [];
      
      // Process in batches
      for (let i = 0; i < queue.length; i += this.BATCH_SIZE) {
        const batch = queue.slice(i, i + this.BATCH_SIZE);
        
        for (const operation of batch) {
          try {
            await this.processOperation(operation);
            processedIds.push(operation.id);
          } catch (error) {
            // Increment retry count
            operation.retryCount = (operation.retryCount || 0) + 1;
            
            // Keep in queue if retry count is less than 3
            if (operation.retryCount < 3) {
              failedOperations.push(operation);
            } else {
              }
          }
        }
      }
      
      // Update queue with failed operations only
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(failedOperations));
      
      } catch (error) {
      }
  }

  /**
   * Process individual sync operation
   */
  private async processOperation(operation: any): Promise<void> {
    const { type, model, data } = operation;
    
    switch (type) {
      case 'create':
        await odooComService.create(model, data);
        break;
        
      case 'update':
        if (data.id) {
          await odooComService.write(model, [data.id], data);
        } else {
          throw new Error('Update operation requires ID');
        }
        break;
        
      case 'delete':
        if (data.id) {
          await odooComService.unlink(model, [data.id]);
        } else {
          throw new Error('Delete operation requires ID');
        }
        break;
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Sync doctors data
   */
  private async syncDoctors(): Promise<void> {
    try {
      const lastSync = await this.getLastSyncTime('doctors');
      
      // Get updated doctors since last sync
      const domain = lastSync
        ? [['write_date', '>', lastSync]]
        : [];
      
      const doctors = await odooComService.searchRead(
        'hr.employee',
        [['is_doctor', '=', true], ...domain],
        ['id', 'write_date'],
        { limit: 100 }
      );
      
      if (doctors.length > 0) {
        // Clear doctor cache to force refresh
        await odooDoctorService.clearCache();
      }
      
      await this.updateLastSyncTime('doctors');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync appointments data
   */
  private async syncAppointments(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;
      
      const lastSync = await this.getLastSyncTime('appointments');
      
      // Get updated appointments since last sync
      const domain = [
        ['patient_id', '=', userId],
        ...(lastSync ? [['write_date', '>', lastSync]] : []),
      ];
      
      const appointments = await odooComService.searchRead(
        'medical.appointment',
        domain,
        ['id', 'write_date', 'state'],
        { limit: 50 }
      );
      
      if (appointments.length > 0) {
        // Update local cache for each appointment
        for (const appointment of appointments) {
          await this.updateLocalAppointmentCache(appointment);
        }
      }
      
      await this.updateLastSyncTime('appointments');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync medical records data
   */
  private async syncMedicalRecords(): Promise<void> {
    try {
      const userPets = await this.getUserPets();
      if (!userPets || userPets.length === 0) return;
      
      const lastSync = await this.getLastSyncTime('medical_records');
      const petIds = userPets.map(pet => pet.id);
      
      // Get updated medical records since last sync
      const domain = [
        ['pet_id', 'in', petIds],
        ...(lastSync ? [['write_date', '>', lastSync]] : []),
      ];
      
      const records = await odooComService.searchRead(
        'medical.record',
        domain,
        ['id', 'write_date', 'pet_id'],
        { limit: 50 }
      );
      
      if (records.length > 0) {
        // Update local cache for each record
        for (const record of records) {
          await this.updateLocalMedicalRecordCache(record);
        }
      }
      
      await this.updateLastSyncTime('medical_records');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    localData: any,
    remoteData: any,
    conflictType: 'appointment' | 'medical_record' | 'prescription'
  ): Promise<any> {
    // Implement conflict resolution strategy
    // For now, we'll use "last write wins" strategy
    
    const localTimestamp = new Date(localData.write_date || localData.updatedAt);
    const remoteTimestamp = new Date(remoteData.write_date);
    
    if (localTimestamp > remoteTimestamp) {
      // Local data is newer, push to remote
      await this.addToSyncQueue({
        type: 'update',
        model: this.getModelName(conflictType),
        data: localData,
      });
      
      return localData;
    } else {
      // Remote data is newer, use it
      return remoteData;
    }
  }

  /**
   * Check if device is online
   */
  private async isOnline(): Promise<boolean> {
    try {
      // Try to fetch ODOO version as a connectivity check
      const response = await odooComService.execute('ir.module.module', 'search_count', [[]]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sync queue
   */
  private async getSyncQueue(): Promise<any[]> {
    try {
      const queue = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<any> {
    try {
      const status = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      return status ? JSON.parse(status) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(status: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      }
  }

  /**
   * Get last sync time for a specific entity
   */
  private async getLastSyncTime(entity: string): Promise<string | null> {
    try {
      const key = `@PawSmart:LastSync:${entity}`;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update last sync time for a specific entity
   */
  private async updateLastSyncTime(entity: string): Promise<void> {
    try {
      const key = `@PawSmart:LastSync:${entity}`;
      await AsyncStorage.setItem(key, new Date().toISOString());
    } catch (error) {
      }
  }

  /**
   * Get current user ID from stored credentials
   */
  private async getCurrentUserId(): Promise<number | null> {
    try {
      const userStr = await AsyncStorage.getItem('@PawSmart:currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.partner_id || user.id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user pets
   */
  private async getUserPets(): Promise<any[]> {
    try {
      const petsStr = await AsyncStorage.getItem('@PawSmart:userPets');
      return petsStr ? JSON.parse(petsStr) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update local appointment cache
   */
  private async updateLocalAppointmentCache(appointment: any): Promise<void> {
    try {
      const key = `@PawSmart:Appointment:${appointment.id}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...appointment,
        syncedAt: new Date().toISOString(),
      }));
    } catch (error) {
      }
  }

  /**
   * Update local medical record cache
   */
  private async updateLocalMedicalRecordCache(record: any): Promise<void> {
    try {
      const key = `@PawSmart:MedicalRecord:${record.id}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...record,
        syncedAt: new Date().toISOString(),
      }));
    } catch (error) {
      }
  }

  /**
   * Get model name for conflict type
   */
  private getModelName(conflictType: string): string {
    const modelMap: Record<string, string> = {
      appointment: 'medical.appointment',
      medical_record: 'medical.record',
      prescription: 'medical.prescription',
    };
    
    return modelMap[conflictType] || conflictType;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force sync specific entity
   */
  async forceSyncEntity(
    entity: 'doctors' | 'appointments' | 'medical_records'
  ): Promise<void> {
    this.isSyncing = true;
    
    try {
      switch (entity) {
        case 'doctors':
          await this.syncDoctors();
          break;
        case 'appointments':
          await this.syncAppointments();
          break;
        case 'medical_records':
          await this.syncMedicalRecords();
          break;
      }
      
      } catch (error) {
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Clear all sync data
   */
  async clearSyncData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => 
        key.includes('Sync') || 
        key.includes('LastSync') ||
        key.includes('Appointment:') ||
        key.includes('MedicalRecord:')
      );
      
      if (syncKeys.length > 0) {
        await AsyncStorage.multiRemove(syncKeys);
      }
      
      } catch (error) {
      }
  }
}

export default new OdooSyncService();