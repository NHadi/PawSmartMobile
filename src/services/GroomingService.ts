import apiClient from './api/apiClient';

export interface Salon {
    id: number;
    name: string;
    address: string;
    city: string;
    district?: string;
    rating?: number;
    image_url?: string;
    // Computed/UI fields
    distance?: string;
    price_start?: number;
}

export interface Service {
    id: number;
    name: string;
    description: string;
    price: string | number;
    duration: number; // minutes
    pet_type: 'cat' | 'dog' | 'both' | string;
    image?: string;
}

export interface Package {
    id: number;
    name: string;
    description: string;
    price: string | number;
    discount_percentage: number;
}

export interface SalonDetail extends Salon {
    description?: string;
    phone?: string;
    services: Service[];
    packages: Package[];
    images?: string[]; // If we have multiple images
}

class GroomingService {
    private readonly BASE_PATH = '/api/v1/grooming';

    async getSalons(params?: {
        page?: number;
        limit?: number;
        search?: string;
        city?: string;
    }): Promise<{ data: Salon[]; meta?: any }> {
        const response = await apiClient.get<any>(`${this.BASE_PATH}/salons`, { params });
        return response;
    }

    async getSalonDetail(id: number): Promise<{ data: SalonDetail }> {
        const response = await apiClient.get<any>(`${this.BASE_PATH}/salons/${id}`);
        return response;
    }
}

export default new GroomingService();
