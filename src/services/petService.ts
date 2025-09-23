import AsyncStorage from '@react-native-async-storage/async-storage';
import odooComService from './odoocom/odooComService';

export interface Pet {
  id?: number;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'hamster' | 'other';
  breed?: string;
  age?: number;
  weight?: number;
  color?: string;
  gender?: 'male' | 'female';
  microchipId?: string;
  birthDate?: string;
  photo?: string;
  medicalHistory?: string;
  vaccinations?: Vaccination[];
  ownerId?: number;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vaccination {
  id?: number;
  name: string;
  date: string;
  nextDueDate?: string;
  veterinarian?: string;
  notes?: string;
}

class PetService {
  // Note: To use Odoo backend, create model 'x_pawsmart_pet' in Odoo via UI
  // Settings → Technical → Database Structure → Models → New
  private readonly MODEL_NAME = 'x_pawsmart_pet'; // Custom model via Odoo UI
  private readonly LOCAL_STORAGE_KEY = '@PawSmart:pets';
  private useLocalStorage = true; // Set to false after creating Odoo model

  /**
   * Get all pets for the current user
   */
  async getPets(ownerId?: number): Promise<Pet[]> {
    // For now, always use local storage until Odoo model is created
    // To enable Odoo: 
    // 1. Create 'pawsmart.pet' model in Odoo with required fields
    // 2. Set useLocalStorage = false in constructor
    
    if (!this.useLocalStorage) {
      try {
        const domain = ownerId ? [['x_owner_id', '=', ownerId]] : [];
        const pets = await odooComService.searchRead(
          this.MODEL_NAME,
          domain,
          [
            'id', 'x_name', 'x_type', 'x_breed', 'x_age', 'x_weight', 
            'x_color', 'x_gender', 'x_microchip_id', 'x_birth_date',
            'x_photo', 'x_medical_history', 'x_vaccinations', 'x_notes',
            'x_active', 'x_owner_id', 'create_date', 'write_date'
          ],
          { order: 'x_name ASC' }
        );

        return pets.map(this.transformFromOdoo);
      } catch (error: any) {
        // Silently fall back to local storage
        this.useLocalStorage = true;
      }
    }

    // Use local storage
    return this.getLocalPets();
  }

  /**
   * Get a single pet by ID
   */
  async getPet(petId: number | string): Promise<Pet | null> {
    // Convert string to number if needed
    const id = typeof petId === 'string' ? parseInt(petId, 10) : petId;
    
    if (!this.useLocalStorage) {
      try {
        const pets = await odooComService.read(
          this.MODEL_NAME,
          [id],
          [
            'id', 'x_name', 'x_type', 'x_breed', 'x_age', 'x_weight',
            'x_color', 'x_gender', 'x_microchip_id', 'x_birth_date',
            'x_photo', 'x_medical_history', 'x_vaccinations', 'x_notes',
            'x_active', 'x_owner_id', 'create_date', 'write_date'
          ]
        );

        if (pets && pets.length > 0) {
          return this.transformFromOdoo(pets[0]);
        }
      } catch (error) {
        this.useLocalStorage = true;
      }
    }

    // Use local storage
    const pets = await this.getLocalPets();
    return pets.find(p => p.id === id) || null;
  }

  /**
   * Create a new pet
   */
  async createPet(pet: Pet): Promise<Pet> {
    if (!this.useLocalStorage) {
      try {
        const odooData = this.transformToOdoo(pet);
        const petId = await odooComService.create(this.MODEL_NAME, odooData);
        
        // Read the created pet to get all fields
        const createdPet = await this.getPet(petId);
        return createdPet || { ...pet, id: petId };
      } catch (error) {
        this.useLocalStorage = true;
      }
    }

    // Use local storage
    return this.createLocalPet(pet);
  }

  /**
   * Update an existing pet
   */
  async updatePet(petId: number | string, updates: Partial<Pet>): Promise<boolean> {
    // Convert string to number if needed
    const id = typeof petId === 'string' ? parseInt(petId, 10) : petId;
    
    if (!this.useLocalStorage) {
      try {
        const odooData = this.transformToOdoo(updates);
        return await odooComService.write(this.MODEL_NAME, [id], odooData);
      } catch (error) {
        this.useLocalStorage = true;
      }
    }

    // Use local storage
    return this.updateLocalPet(id, updates);
  }

  /**
   * Delete a pet
   */
  async deletePet(petId: number | string): Promise<boolean> {
    // Convert string to number if needed
    const id = typeof petId === 'string' ? parseInt(petId, 10) : petId;
    
    if (!this.useLocalStorage) {
      try {
        return await odooComService.unlink(this.MODEL_NAME, [id]);
      } catch (error) {
        this.useLocalStorage = true;
      }
    }

    // Use local storage
    return this.deleteLocalPet(id);
  }

  /**
   * Add vaccination record
   */
  async addVaccination(petId: number | string, vaccination: Vaccination): Promise<boolean> {
    const pet = await this.getPet(petId);
    if (!pet) return false;

    const vaccinations = pet.vaccinations || [];
    vaccinations.push({
      ...vaccination,
      id: Date.now(),
    });

    return this.updatePet(petId, { vaccinations });
  }

  // Local Storage Methods (Fallback)
  private async getLocalPets(): Promise<Pet[]> {
    try {
      const petsJson = await AsyncStorage.getItem(this.LOCAL_STORAGE_KEY);
      return petsJson ? JSON.parse(petsJson) : [];
    } catch (error) {
      return [];
    }
  }

  private async createLocalPet(pet: Pet): Promise<Pet> {
    const pets = await this.getLocalPets();
    const newPet: Pet = {
      ...pet,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    
    pets.push(newPet);
    await AsyncStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(pets));
    return newPet;
  }

  private async updateLocalPet(petId: number, updates: Partial<Pet>): Promise<boolean> {
    const pets = await this.getLocalPets();
    const index = pets.findIndex(p => p.id === petId);
    
    if (index === -1) return false;
    
    pets[index] = {
      ...pets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(pets));
    return true;
  }

  private async deleteLocalPet(petId: number): Promise<boolean> {
    const pets = await this.getLocalPets();
    const filtered = pets.filter(p => p.id !== petId);
    
    if (filtered.length === pets.length) return false;
    
    await AsyncStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  // Transform methods
  private transformFromOdoo(odooRecord: any): Pet {
    // Handle both custom module fields and UI-created fields (x_ prefix)
    return {
      id: odooRecord.id,
      name: odooRecord.x_name || odooRecord.name,
      type: odooRecord.x_type || odooRecord.type || 'other',
      breed: odooRecord.x_breed || odooRecord.breed,
      age: odooRecord.x_age || odooRecord.age,
      weight: odooRecord.x_weight || odooRecord.weight,
      color: odooRecord.x_color || odooRecord.color,
      gender: odooRecord.x_gender || odooRecord.gender,
      microchipId: odooRecord.x_microchip_id || odooRecord.microchip_id,
      birthDate: odooRecord.x_birth_date || odooRecord.birth_date,
      photo: odooRecord.x_photo || odooRecord.photo,
      medicalHistory: odooRecord.x_medical_history || odooRecord.medical_history,
      vaccinations: odooRecord.x_vaccinations ? JSON.parse(odooRecord.x_vaccinations) : 
                    odooRecord.vaccinations ? JSON.parse(odooRecord.vaccinations) : [],
      ownerId: odooRecord.x_owner_id?.[0] || odooRecord.owner_id?.[0],
      notes: odooRecord.x_notes || odooRecord.notes,
      isActive: odooRecord.x_active !== undefined ? odooRecord.x_active : odooRecord.is_active,
      createdAt: odooRecord.create_date,
      updatedAt: odooRecord.write_date,
    };
  }

  private transformToOdoo(pet: Partial<Pet>): any {
    const odooData: any = {};
    
    // Use x_ prefix for UI-created fields
    if (pet.name !== undefined) odooData.x_name = pet.name;
    if (pet.type !== undefined) odooData.x_type = pet.type;
    if (pet.breed !== undefined) odooData.x_breed = pet.breed;
    if (pet.age !== undefined) odooData.x_age = pet.age;
    if (pet.weight !== undefined) odooData.x_weight = pet.weight;
    if (pet.color !== undefined) odooData.x_color = pet.color;
    if (pet.gender !== undefined) odooData.x_gender = pet.gender;
    if (pet.microchipId !== undefined) odooData.x_microchip_id = pet.microchipId;
    if (pet.birthDate !== undefined) odooData.x_birth_date = pet.birthDate;
    if (pet.photo !== undefined) odooData.x_photo = pet.photo;
    if (pet.medicalHistory !== undefined) odooData.x_medical_history = pet.medicalHistory;
    if (pet.vaccinations !== undefined) odooData.x_vaccinations = JSON.stringify(pet.vaccinations);
    if (pet.ownerId !== undefined) odooData.x_owner_id = pet.ownerId;
    if (pet.notes !== undefined) odooData.x_notes = pet.notes;
    if (pet.isActive !== undefined) odooData.x_active = pet.isActive;
    
    return odooData;
  }
}

export default new PetService();