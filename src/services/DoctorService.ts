import apiClient from './api/apiClient';

export interface Doctor {
    id: number;
    name: string;
    specialization: string;
    qualification: string;
    experience_years: number;
    rating: number;
    total_appointments: number;
    photo: string | null;
    phone: string;
    email: string;
    location: string | null;
    consultation_fee: string; // Decimal string from backend
    home_service_fee: string; // Decimal string from backend
    is_available: boolean;
    offers_walk_in: boolean;
    offers_home_service: boolean;
    is_recommended: boolean;
    available_days?: string[];
    working_hours?: any;
    languages?: string[];
    partner_type?: string;
}

export interface DoctorSchedule {
    id: number;
    doctor_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

export interface DoctorDetail extends Doctor {
    schedules: DoctorSchedule[];
}

export interface DoctorAppointmentRequest {
    doctor_id: number;
    pet_id: number;
    appointment_date: string; // YYYY-MM-DD
    appointment_time: string; // HH:MM
    service_type: 'walk-in' | 'home-service';
    reason?: string;
    symptoms?: string;
    address_id?: number; // For home service
}

class DoctorService {
    private readonly BASE_PATH = '/api/v1/doctors';

    async getDoctors(params?: {
        page?: number;
        limit?: number;
        search?: string;
        specialization?: string;
        city?: string;
        is_available?: boolean;
        offers_home_service?: boolean;
        offers_walk_in?: boolean;
    }): Promise<{ data: Doctor[]; pagination: any }> {
        const response = await apiClient.get<any>(this.BASE_PATH, { params });
        return response;
    }

    async getDoctorDetail(id: number): Promise<DoctorDetail> {
        const response = await apiClient.get<any>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    async getPartnerDoctors(partnerId: number): Promise<Doctor[]> {
        const response = await apiClient.get<any>(`${this.BASE_PATH}/partner/${partnerId}/doctors`);
        return response.data;
    }

    async createAppointment(data: DoctorAppointmentRequest): Promise<any> {
        const response = await apiClient.post<any>(`${this.BASE_PATH}/appointments`, data);
        return response.data;
    }
}

export default new DoctorService();
