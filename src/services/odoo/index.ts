/**
 * ODOO Integration Services
 * Central export for all ODOO-related services
 */

export { default as odooDoctorService } from './doctorService';
export { default as odooSyncService } from './syncService';
export { default as odooInitService } from './initService';

// Re-export hooks
export * from '../../hooks/useDoctors';

// Export types
export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  rating: number;
  totalAppointments: number;
  image: any;
  phone: string;
  email: string;
  location: string;
  consultationFee: number;
  homeServiceFee: number;
  isAvailable: boolean;
  availableDays: string[];
  workingHours: any;
  languages: string[];
  certifications: string[];
  offersWalkIn: boolean;
  offersHomeService: boolean;
  isRecommended: boolean;
}

export interface Appointment {
  id: number;
  name: string;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  petId: number;
  petName: string;
  appointmentDate: string;
  serviceType: 'walk-in' | 'home-service';
  reason: string;
  state: 'draft' | 'confirmed' | 'done' | 'cancelled' | 'no_show';
  additionalServices: any[];
  totalAmount: number;
  hasPrescription: boolean;
  hasMedicalRecord: boolean;
}

export interface MedicalRecord {
  id: number;
  appointmentId: number;
  doctorId: number;
  doctorName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescriptions: any[];
  followUpRequired: boolean;
  followUpDate?: string;
  vitalSigns: any;
  weight?: number;
  temperature?: number;
  notes: string;
  attachments: any[];
}

export interface TimeSlot {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DoctorSchedule {
  doctorId: number;
  date: string;
  workingHours: any;
  timeSlots: TimeSlot[];
  bookedSlots: number;
}