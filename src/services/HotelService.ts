import apiClient from './api/apiClient';

export interface Hotel {
    id: number;
    name: string;
    city: string;
    address: string;
    image: string;
    rating: number;
    reviewCount: number;
    startPrice: number;
    distance?: string;
}

export interface Room {
    id: number;
    name: string;
    petType: string;
    size: string;
    price: number;
    features: string[];
    image: string | null;
    description: string;
}

export interface HotelDetail extends Hotel {
    description: string;
    images: string[];
    facilities: string[];
    rooms: Room[];
    reviews: any[];
}

export interface BookingRequest {
    partner_id: number;
    room_id: number;
    pet_id: number;
    check_in_date: string; // YYYY-MM-DD
    check_out_date: string; // YYYY-MM-DD
    notes?: string;
    special_requests?: string;
}

class HotelService {
    private readonly BASE_PATH = '/api/v1/hotels';

    async getHotels(params?: {
        page?: number;
        limit?: number;
        search?: string;
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        petType?: string;
    }): Promise<{ data: Hotel[]; pagination: any }> {
        const response = await apiClient.get<any>(this.BASE_PATH, { params });
        return response; // Assuming response.data is the payload based on apiClient implementation
    }

    async getHotelDetail(id: number): Promise<HotelDetail> {
        const response = await apiClient.get<any>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    async createBooking(data: BookingRequest): Promise<any> {
        const response = await apiClient.post<any>(`${this.BASE_PATH}/bookings`, data);
        return response.data;
    }
}

export default new HotelService();
