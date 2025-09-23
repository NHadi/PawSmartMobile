import AsyncStorage from '@react-native-async-storage/async-storage';

// Address interface
export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  fullAddress: string;
  detail: string;
  postalCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  province?: string;
  city?: string;
  district?: string;
  subDistrict?: string;
  createdAt: string;
  updatedAt: string;
}

// SQLite implementation (requires expo-sqlite or react-native-sqlite-storage)
// For now, we'll use AsyncStorage as a fallback
// To use SQLite, install: expo install expo-sqlite

class AddressService {
  private readonly STORAGE_KEY = 'user_addresses';
  private db: any = null;

  constructor() {
    this.initializeDatabase();
  }

  // Initialize database (SQLite when available, AsyncStorage as fallback)
  private async initializeDatabase() {
    try {
      // Try to use SQLite if available
      // const SQLite = require('expo-sqlite');
      // this.db = SQLite.openDatabase('petnexus.db');
      // await this.createTables();
    } catch (error) {
      }
  }

  // Create SQLite tables
  private async createTables() {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS addresses (
            id TEXT PRIMARY KEY,
            label TEXT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            fullAddress TEXT NOT NULL,
            detail TEXT,
            postalCode TEXT NOT NULL,
            isDefault INTEGER DEFAULT 0,
            latitude REAL,
            longitude REAL,
            province TEXT,
            city TEXT,
            district TEXT,
            subDistrict TEXT,
            createdAt TEXT,
            updatedAt TEXT
          )`,
          [],
          () => resolve(true),
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  // Get all addresses
  async getAllAddresses(): Promise<Address[]> {
    if (this.db) {
      return this.getAllAddressesSQLite();
    }
    return this.getAllAddressesAsyncStorage();
  }

  private async getAllAddressesSQLite(): Promise<Address[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM addresses ORDER BY isDefault DESC, updatedAt DESC',
          [],
          (_: any, result: any) => {
            const addresses: Address[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              addresses.push({
                ...row,
                isDefault: row.isDefault === 1,
              });
            }
            resolve(addresses);
          },
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async getAllAddressesAsyncStorage(): Promise<Address[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Get address by ID
  async getAddressById(id: string): Promise<Address | null> {
    if (this.db) {
      return this.getAddressByIdSQLite(id);
    }
    return this.getAddressByIdAsyncStorage(id);
  }

  private async getAddressByIdSQLite(id: string): Promise<Address | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM addresses WHERE id = ?',
          [id],
          (_: any, result: any) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                ...row,
                isDefault: row.isDefault === 1,
              });
            } else {
              resolve(null);
            }
          },
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async getAddressByIdAsyncStorage(id: string): Promise<Address | null> {
    const addresses = await this.getAllAddressesAsyncStorage();
    return addresses.find(addr => addr.id === id) || null;
  }

  // Add new address
  async addAddress(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    const newAddress: Address = {
      ...address,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If this is set as default, update other addresses
    if (newAddress.isDefault) {
      await this.clearDefaultAddress();
    }

    if (this.db) {
      await this.addAddressSQLite(newAddress);
    } else {
      await this.addAddressAsyncStorage(newAddress);
    }

    return newAddress;
  }

  private async addAddressSQLite(address: Address): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          `INSERT INTO addresses (
            id, label, name, phone, fullAddress, detail, postalCode,
            isDefault, latitude, longitude, province, city, district,
            subDistrict, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            address.id,
            address.label,
            address.name,
            address.phone,
            address.fullAddress,
            address.detail,
            address.postalCode,
            address.isDefault ? 1 : 0,
            address.latitude || null,
            address.longitude || null,
            address.province || null,
            address.city || null,
            address.district || null,
            address.subDistrict || null,
            address.createdAt,
            address.updatedAt,
          ],
          () => resolve(),
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async addAddressAsyncStorage(address: Address): Promise<void> {
    const addresses = await this.getAllAddressesAsyncStorage();
    addresses.push(address);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
  }

  // Update address
  async updateAddress(id: string, updates: Partial<Address>): Promise<Address | null> {
    const address = await this.getAddressById(id);
    if (!address) return null;

    const updatedAddress: Address = {
      ...address,
      ...updates,
      id: address.id, // Ensure ID doesn't change
      createdAt: address.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    // If this is set as default, update other addresses
    if (updates.isDefault && !address.isDefault) {
      await this.clearDefaultAddress();
    }

    if (this.db) {
      await this.updateAddressSQLite(updatedAddress);
    } else {
      await this.updateAddressAsyncStorage(updatedAddress);
    }

    return updatedAddress;
  }

  private async updateAddressSQLite(address: Address): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          `UPDATE addresses SET
            label = ?, name = ?, phone = ?, fullAddress = ?,
            detail = ?, postalCode = ?, isDefault = ?,
            latitude = ?, longitude = ?, province = ?,
            city = ?, district = ?, subDistrict = ?, updatedAt = ?
          WHERE id = ?`,
          [
            address.label,
            address.name,
            address.phone,
            address.fullAddress,
            address.detail,
            address.postalCode,
            address.isDefault ? 1 : 0,
            address.latitude || null,
            address.longitude || null,
            address.province || null,
            address.city || null,
            address.district || null,
            address.subDistrict || null,
            address.updatedAt,
            address.id,
          ],
          () => resolve(),
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async updateAddressAsyncStorage(address: Address): Promise<void> {
    const addresses = await this.getAllAddressesAsyncStorage();
    const index = addresses.findIndex(addr => addr.id === address.id);
    if (index !== -1) {
      addresses[index] = address;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    }
  }

  // Delete address
  async deleteAddress(id: string): Promise<boolean> {
    if (this.db) {
      return this.deleteAddressSQLite(id);
    }
    return this.deleteAddressAsyncStorage(id);
  }

  private async deleteAddressSQLite(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'DELETE FROM addresses WHERE id = ?',
          [id],
          (_: any, result: any) => resolve(result.rowsAffected > 0),
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async deleteAddressAsyncStorage(id: string): Promise<boolean> {
    const addresses = await this.getAllAddressesAsyncStorage();
    const filtered = addresses.filter(addr => addr.id !== id);
    if (filtered.length < addresses.length) {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // Set default address
  async setDefaultAddress(id: string): Promise<boolean> {
    await this.clearDefaultAddress();
    const address = await this.getAddressById(id);
    if (address) {
      await this.updateAddress(id, { isDefault: true });
      return true;
    }
    return false;
  }

  // Clear default address
  private async clearDefaultAddress(): Promise<void> {
    if (this.db) {
      await this.clearDefaultAddressSQLite();
    } else {
      await this.clearDefaultAddressAsyncStorage();
    }
  }

  private async clearDefaultAddressSQLite(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'UPDATE addresses SET isDefault = 0 WHERE isDefault = 1',
          [],
          () => resolve(),
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  private async clearDefaultAddressAsyncStorage(): Promise<void> {
    const addresses = await this.getAllAddressesAsyncStorage();
    const updated = addresses.map(addr => ({ ...addr, isDefault: false }));
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  // Get default address
  async getDefaultAddress(): Promise<Address | null> {
    const addresses = await this.getAllAddresses();
    return addresses.find(addr => addr.isDefault) || null;
  }
}

export default new AddressService();