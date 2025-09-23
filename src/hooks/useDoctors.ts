import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import odooDoctorService from '../services/odoo/doctorService';
import { Alert } from 'react-native';

/**
 * Hook for managing doctors data from ODOO
 */
export function useDoctors(filters?: {
  specialization?: string;
  available?: boolean;
  location?: string;
  serviceType?: 'walk-in' | 'home-service';
}) {
  const queryKey = ['doctors', filters];

  const {
    data: doctors = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => odooDoctorService.getDoctors(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    doctors,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting single doctor details
 */
export function useDoctor(doctorId: number | null) {
  const {
    data: doctor,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => (doctorId ? odooDoctorService.getDoctorById(doctorId) : null),
    enabled: !!doctorId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    doctor,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting doctor schedule
 */
export function useDoctorSchedule(doctorId: number | null, date?: Date) {
  const selectedDate = date || new Date();

  const {
    data: schedule,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['doctor-schedule', doctorId, selectedDate.toDateString()],
    queryFn: () =>
      doctorId ? odooDoctorService.getDoctorSchedule(doctorId, selectedDate) : null,
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000, // 2 minutes - schedule changes frequently
  });

  return {
    schedule,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for managing appointments
 */
export function useAppointments(userId?: number, filters?: any) {
  const queryClient = useQueryClient();

  // Get appointments
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', userId, filters],
    queryFn: () =>
      userId ? odooDoctorService.getUserAppointments(userId, filters) : [],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData: any) =>
      odooDoctorService.createAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['doctor-schedule']);
      Alert.alert('Success', 'Appointment created successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create appointment');
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: number; reason?: string }) =>
      odooDoctorService.cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['doctor-schedule']);
      Alert.alert('Success', 'Appointment cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to cancel appointment');
    },
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: ({
      appointmentId,
      newDate,
      newTimeSlot,
    }: {
      appointmentId: number;
      newDate: Date;
      newTimeSlot: string;
    }) => odooDoctorService.rescheduleAppointment(appointmentId, newDate, newTimeSlot),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['doctor-schedule']);
      Alert.alert('Success', 'Appointment rescheduled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reschedule appointment');
    },
  });

  return {
    appointments,
    isLoading,
    error,
    refetch,
    createAppointment: createAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    rescheduleAppointment: rescheduleAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isLoading,
    isCancelling: cancelAppointmentMutation.isLoading,
    isRescheduling: rescheduleAppointmentMutation.isLoading,
  };
}

/**
 * Hook for managing medical records
 */
export function useMedicalRecords(petId?: number) {
  const queryClient = useQueryClient();

  // Get medical history
  const {
    data: medicalHistory = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['medical-history', petId],
    queryFn: () => (petId ? odooDoctorService.getPetMedicalHistory(petId) : []),
    enabled: !!petId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create medical record mutation
  const createMedicalRecordMutation = useMutation({
    mutationFn: (recordData: any) => odooDoctorService.createMedicalRecord(recordData),
    onSuccess: () => {
      queryClient.invalidateQueries(['medical-history']);
      queryClient.invalidateQueries(['appointments']);
      Alert.alert('Success', 'Medical record created successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create medical record');
    },
  });

  return {
    medicalHistory,
    isLoading,
    error,
    refetch,
    createMedicalRecord: createMedicalRecordMutation.mutate,
    isCreating: createMedicalRecordMutation.isLoading,
  };
}

/**
 * Hook for managing prescriptions
 */
export function usePrescriptions(petId?: number) {
  const queryClient = useQueryClient();

  // Get prescriptions
  const {
    data: prescriptions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prescriptions', petId],
    queryFn: () => (petId ? odooDoctorService.getPetPrescriptions(petId) : []),
    enabled: !!petId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create prescription mutation
  const createPrescriptionMutation = useMutation({
    mutationFn: (prescriptionData: any) =>
      odooDoctorService.createPrescription(prescriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries(['prescriptions']);
      queryClient.invalidateQueries(['medical-history']);
      Alert.alert('Success', 'Prescription created successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create prescription');
    },
  });

  return {
    prescriptions,
    isLoading,
    error,
    refetch,
    createPrescription: createPrescriptionMutation.mutate,
    isCreating: createPrescriptionMutation.isLoading,
  };
}

/**
 * Hook for managing invoices
 */
export function useAppointmentInvoice(appointmentId?: number) {
  const queryClient = useQueryClient();

  // Get invoice
  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointment-invoice', appointmentId],
    queryFn: () =>
      appointmentId ? odooDoctorService.getAppointmentInvoice(appointmentId) : null,
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: ({
      appointmentId,
      additionalCharges,
    }: {
      appointmentId: number;
      additionalCharges?: any[];
    }) => odooDoctorService.createAppointmentInvoice(appointmentId, additionalCharges),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointment-invoice']);
      queryClient.invalidateQueries(['appointments']);
      Alert.alert('Success', 'Invoice created successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create invoice');
    },
  });

  return {
    invoice,
    isLoading,
    error,
    refetch,
    createInvoice: createInvoiceMutation.mutate,
    isCreatingInvoice: createInvoiceMutation.isLoading,
  };
}

/**
 * Hook for clearing doctor service cache
 */
export function useDoctorCacheClear() {
  const queryClient = useQueryClient();

  const clearCache = useCallback(async () => {
    await odooDoctorService.clearCache();
    queryClient.invalidateQueries(['doctors']);
    queryClient.invalidateQueries(['doctor']);
    queryClient.invalidateQueries(['doctor-schedule']);
    queryClient.invalidateQueries(['appointments']);
    queryClient.invalidateQueries(['medical-history']);
    queryClient.invalidateQueries(['prescriptions']);
    queryClient.invalidateQueries(['appointment-invoice']);
  }, [queryClient]);

  return { clearCache };
}