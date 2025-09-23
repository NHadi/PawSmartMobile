import odooComService from '../odoocom/odooComService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ODOO Doctor Service Integration
 * Comprehensive integration for Jasa Dokter (Doctor Services)
 * Manages doctors, appointments, medical records, and billing
 */
class OdooDoctorService {
  private readonly CACHE_PREFIX = '@PawSmart:DoctorCache:';
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  // ============================================
  // Doctor Management
  // ============================================

  /**
   * Get all available doctors from ODOO
   */
  async getDoctors(filters?: {
    specialization?: string;
    available?: boolean;
    location?: string;
    serviceType?: 'walk-in' | 'home-service';
  }): Promise<any[]> {
    try {
      const domain: any[] = [['is_doctor', '=', true]];
      
      if (filters?.specialization) {
        domain.push(['specialization', 'ilike', filters.specialization]);
      }
      
      if (filters?.available) {
        domain.push(['is_available', '=', true]);
      }
      
      if (filters?.location) {
        domain.push(['location_ids.name', 'ilike', filters.location]);
      }

      if (filters?.serviceType) {
        domain.push([`offers_${filters.serviceType.replace('-', '_')}`, '=', true]);
      }

      const doctors = await odooComService.searchRead(
        'hr.employee',
        domain,
        [
          'id',
          'name',
          'display_name',
          'specialization',
          'qualification',
          'experience_years',
          'rating',
          'total_appointments',
          'image_1920',
          'mobile_phone',
          'work_email',
          'work_location',
          'consultation_fee',
          'home_service_fee',
          'is_available',
          'available_days',
          'working_hours',
          'languages',
          'certifications',
          'offers_walk_in',
          'offers_home_service',
        ],
        {
          limit: 50,
          order: 'rating desc, total_appointments desc',
        }
      );

      return this.transformDoctorData(doctors);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get doctor details by ID
   */
  async getDoctorById(doctorId: number): Promise<any> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}doctor:${doctorId}`;
      const cached = await this.getCached(cacheKey);
      if (cached) return cached;

      const doctor = await odooComService.read(
        'hr.employee',
        [doctorId],
        [
          'id',
          'name',
          'specialization',
          'qualification',
          'experience_years',
          'rating',
          'total_appointments',
          'image_1920',
          'mobile_phone',
          'work_email',
          'work_location',
          'consultation_fee',
          'home_service_fee',
          'is_available',
          'available_days',
          'working_hours',
          'languages',
          'certifications',
          'about',
          'education_ids',
          'achievement_ids',
        ]
      );

      if (doctor && doctor.length > 0) {
        const transformedDoctor = this.transformDoctorData(doctor)[0];
        await this.setCached(cacheKey, transformedDoctor);
        return transformedDoctor;
      }

      throw new Error('Doctor not found');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get doctor schedule and availability
   */
  async getDoctorSchedule(
    doctorId: number,
    date: Date = new Date()
  ): Promise<any> {
    try {
      const dateStr = this.formatDate(date);
      
      // Get existing appointments for the date
      const appointments = await odooComService.searchRead(
        'medical.appointment',
        [
          ['doctor_id', '=', doctorId],
          ['appointment_date', '>=', `${dateStr} 00:00:00`],
          ['appointment_date', '<=', `${dateStr} 23:59:59`],
          ['state', 'not in', ['cancelled', 'no_show']],
        ],
        ['appointment_date', 'duration', 'state']
      );

      // Get doctor's working hours
      const doctor = await this.getDoctorById(doctorId);
      
      // Generate available time slots
      const timeSlots = this.generateTimeSlots(
        doctor.working_hours,
        appointments,
        date
      );

      return {
        doctorId,
        date: dateStr,
        workingHours: doctor.working_hours,
        timeSlots,
        bookedSlots: appointments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Appointment Management
  // ============================================

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: {
    doctorId: number;
    patientId: number;
    petId: number;
    date: Date;
    timeSlot: string;
    serviceType: 'walk-in' | 'home-service';
    reason: string;
    additionalServices?: string[];
    notes?: string;
    address?: any;
  }): Promise<any> {
    try {
      const appointmentDate = this.combineDateTime(
        appointmentData.date,
        appointmentData.timeSlot
      );

      const data = {
        doctor_id: appointmentData.doctorId,
        patient_id: appointmentData.patientId,
        pet_id: appointmentData.petId,
        appointment_date: appointmentDate,
        service_type: appointmentData.serviceType,
        reason: appointmentData.reason,
        additional_services: appointmentData.additionalServices || [],
        notes: appointmentData.notes || '',
        state: 'draft',
        duration: 1.0, // Default 1 hour
      };

      // Add address for home service
      if (appointmentData.serviceType === 'home-service' && appointmentData.address) {
        data['service_address'] = appointmentData.address;
      }

      const appointmentId = await odooComService.create(
        'medical.appointment',
        data
      );

      // Confirm the appointment
      await odooComService.execute(
        'medical.appointment',
        'action_confirm',
        [[appointmentId]]
      );

      // Get the created appointment details
      const appointment = await odooComService.read(
        'medical.appointment',
        [appointmentId]
      );

      return this.transformAppointmentData(appointment[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's appointments
   */
  async getUserAppointments(
    userId: number,
    filters?: {
      state?: string;
      fromDate?: Date;
      toDate?: Date;
      petId?: number;
    }
  ): Promise<any[]> {
    try {
      const domain: any[] = [['patient_id', '=', userId]];

      if (filters?.state) {
        domain.push(['state', '=', filters.state]);
      }

      if (filters?.fromDate) {
        domain.push(['appointment_date', '>=', this.formatDate(filters.fromDate)]);
      }

      if (filters?.toDate) {
        domain.push(['appointment_date', '<=', this.formatDate(filters.toDate)]);
      }

      if (filters?.petId) {
        domain.push(['pet_id', '=', filters.petId]);
      }

      const appointments = await odooComService.searchRead(
        'medical.appointment',
        domain,
        [
          'id',
          'name',
          'doctor_id',
          'patient_id',
          'pet_id',
          'appointment_date',
          'service_type',
          'reason',
          'state',
          'additional_services',
          'total_amount',
          'prescription_ids',
          'medical_record_id',
        ],
        {
          order: 'appointment_date desc',
        }
      );

      return appointments.map(apt => this.transformAppointmentData(apt));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: number,
    reason?: string
  ): Promise<boolean> {
    try {
      await odooComService.write(
        'medical.appointment',
        [appointmentId],
        {
          state: 'cancelled',
          cancellation_reason: reason || 'User cancelled',
          cancelled_date: new Date().toISOString(),
        }
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: number,
    newDate: Date,
    newTimeSlot: string
  ): Promise<any> {
    try {
      const newDateTime = this.combineDateTime(newDate, newTimeSlot);

      await odooComService.write(
        'medical.appointment',
        [appointmentId],
        {
          appointment_date: newDateTime,
          rescheduled: true,
          rescheduled_date: new Date().toISOString(),
        }
      );

      const appointment = await odooComService.read(
        'medical.appointment',
        [appointmentId]
      );

      return this.transformAppointmentData(appointment[0]);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Medical Records Management
  // ============================================

  /**
   * Get pet medical history
   */
  async getPetMedicalHistory(petId: number): Promise<any[]> {
    try {
      const records = await odooComService.searchRead(
        'medical.record',
        [['pet_id', '=', petId]],
        [
          'id',
          'appointment_id',
          'doctor_id',
          'date',
          'diagnosis',
          'symptoms',
          'treatment',
          'prescription_ids',
          'follow_up_required',
          'follow_up_date',
          'vital_signs',
          'weight',
          'temperature',
          'notes',
          'attachments',
        ],
        {
          order: 'date desc',
        }
      );

      return records.map(record => this.transformMedicalRecordData(record));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create medical record after appointment
   */
  async createMedicalRecord(recordData: {
    appointmentId: number;
    petId: number;
    doctorId: number;
    diagnosis: string;
    symptoms: string[];
    treatment: string;
    prescriptions?: any[];
    vitalSigns?: any;
    followUpRequired?: boolean;
    followUpDate?: Date;
    notes?: string;
  }): Promise<any> {
    try {
      const data = {
        appointment_id: recordData.appointmentId,
        pet_id: recordData.petId,
        doctor_id: recordData.doctorId,
        date: new Date().toISOString(),
        diagnosis: recordData.diagnosis,
        symptoms: recordData.symptoms.join(', '),
        treatment: recordData.treatment,
        vital_signs: recordData.vitalSigns || {},
        follow_up_required: recordData.followUpRequired || false,
        follow_up_date: recordData.followUpDate?.toISOString(),
        notes: recordData.notes || '',
      };

      const recordId = await odooComService.create('medical.record', data);

      // Create prescriptions if provided
      if (recordData.prescriptions && recordData.prescriptions.length > 0) {
        for (const prescription of recordData.prescriptions) {
          await this.createPrescription({
            ...prescription,
            medicalRecordId: recordId,
          });
        }
      }

      // Update appointment with medical record
      await odooComService.write(
        'medical.appointment',
        [recordData.appointmentId],
        {
          medical_record_id: recordId,
          state: 'done',
        }
      );

      return await odooComService.read('medical.record', [recordId]);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Prescription Management
  // ============================================

  /**
   * Create prescription
   */
  async createPrescription(prescriptionData: {
    medicalRecordId: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }): Promise<any> {
    try {
      const data = {
        medical_record_id: prescriptionData.medicalRecordId,
        medication_name: prescriptionData.medicationName,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        instructions: prescriptionData.instructions || '',
        prescribed_date: new Date().toISOString(),
      };

      const prescriptionId = await odooComService.create(
        'medical.prescription',
        data
      );

      return await odooComService.read('medical.prescription', [prescriptionId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get prescriptions for a pet
   */
  async getPetPrescriptions(petId: number): Promise<any[]> {
    try {
      const prescriptions = await odooComService.searchRead(
        'medical.prescription',
        [['medical_record_id.pet_id', '=', petId]],
        [
          'id',
          'medication_name',
          'dosage',
          'frequency',
          'duration',
          'instructions',
          'prescribed_date',
          'medical_record_id',
        ],
        {
          order: 'prescribed_date desc',
        }
      );

      return prescriptions;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Billing & Invoice Management
  // ============================================

  /**
   * Get appointment invoice
   */
  async getAppointmentInvoice(appointmentId: number): Promise<any> {
    try {
      const invoices = await odooComService.searchRead(
        'account.move',
        [
          ['appointment_id', '=', appointmentId],
          ['move_type', '=', 'out_invoice'],
        ],
        [
          'id',
          'name',
          'partner_id',
          'invoice_date',
          'amount_total',
          'amount_untaxed',
          'amount_tax',
          'state',
          'payment_state',
          'invoice_line_ids',
        ]
      );

      if (invoices.length > 0) {
        return this.transformInvoiceData(invoices[0]);
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create invoice for appointment
   */
  async createAppointmentInvoice(
    appointmentId: number,
    additionalCharges?: any[]
  ): Promise<any> {
    try {
      const appointment = await odooComService.read(
        'medical.appointment',
        [appointmentId]
      );

      if (!appointment || appointment.length === 0) {
        throw new Error('Appointment not found');
      }

      const apt = appointment[0];
      const invoiceLines = [];

      // Add consultation fee
      invoiceLines.push({
        name: `Consultation - ${apt.doctor_id[1]}`,
        quantity: 1,
        price_unit: apt.consultation_fee || 0,
        product_id: await this.getConsultationProductId(),
      });

      // Add home service fee if applicable
      if (apt.service_type === 'home-service') {
        invoiceLines.push({
          name: 'Home Service Fee',
          quantity: 1,
          price_unit: apt.home_service_fee || 0,
          product_id: await this.getHomeServiceProductId(),
        });
      }

      // Add additional services
      if (apt.additional_services && apt.additional_services.length > 0) {
        for (const service of apt.additional_services) {
          invoiceLines.push({
            name: service.name,
            quantity: 1,
            price_unit: service.price,
            product_id: service.product_id,
          });
        }
      }

      // Add any additional charges
      if (additionalCharges && additionalCharges.length > 0) {
        invoiceLines.push(...additionalCharges);
      }

      const invoiceData = {
        partner_id: apt.patient_id,
        appointment_id: appointmentId,
        move_type: 'out_invoice',
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_line_ids: invoiceLines.map(line => [0, 0, line]),
      };

      const invoiceId = await odooComService.create('account.move', invoiceData);

      // Post the invoice
      await odooComService.execute(
        'account.move',
        'action_post',
        [[invoiceId]]
      );

      return await this.getAppointmentInvoice(appointmentId);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Transform doctor data from ODOO format to app format
   */
  private transformDoctorData(doctors: any[]): any[] {
    return doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name || doctor.display_name,
      specialization: doctor.specialization || 'General Practitioner',
      qualification: doctor.qualification || '',
      experienceYears: doctor.experience_years || 0,
      rating: doctor.rating || 4.5,
      totalAppointments: doctor.total_appointments || 0,
      image: doctor.image_1920
        ? { uri: `data:image/jpeg;base64,${doctor.image_1920}` }
        : require('../../../assets/doctor-placeholder.jpg'),
      phone: doctor.mobile_phone || '',
      email: doctor.work_email || '',
      location: doctor.work_location || '',
      consultationFee: doctor.consultation_fee || 0,
      homeServiceFee: doctor.home_service_fee || 0,
      isAvailable: doctor.is_available || false,
      availableDays: doctor.available_days || [],
      workingHours: doctor.working_hours || {},
      languages: doctor.languages || ['English'],
      certifications: doctor.certifications || [],
      offersWalkIn: doctor.offers_walk_in || false,
      offersHomeService: doctor.offers_home_service || false,
      isRecommended: doctor.rating >= 4.5 || doctor.total_appointments > 100,
    }));
  }

  /**
   * Transform appointment data
   */
  private transformAppointmentData(appointment: any): any {
    return {
      id: appointment.id,
      name: appointment.name,
      doctorId: appointment.doctor_id?.[0],
      doctorName: appointment.doctor_id?.[1],
      patientId: appointment.patient_id?.[0],
      patientName: appointment.patient_id?.[1],
      petId: appointment.pet_id?.[0],
      petName: appointment.pet_id?.[1],
      appointmentDate: appointment.appointment_date,
      serviceType: appointment.service_type,
      reason: appointment.reason,
      state: appointment.state,
      additionalServices: appointment.additional_services || [],
      totalAmount: appointment.total_amount || 0,
      hasPrescription: appointment.prescription_ids?.length > 0,
      hasMedicalRecord: !!appointment.medical_record_id,
    };
  }

  /**
   * Transform medical record data
   */
  private transformMedicalRecordData(record: any): any {
    return {
      id: record.id,
      appointmentId: record.appointment_id?.[0],
      doctorId: record.doctor_id?.[0],
      doctorName: record.doctor_id?.[1],
      date: record.date,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms ? record.symptoms.split(', ') : [],
      treatment: record.treatment,
      prescriptions: record.prescription_ids || [],
      followUpRequired: record.follow_up_required,
      followUpDate: record.follow_up_date,
      vitalSigns: record.vital_signs || {},
      weight: record.weight,
      temperature: record.temperature,
      notes: record.notes,
      attachments: record.attachments || [],
    };
  }

  /**
   * Transform invoice data
   */
  private transformInvoiceData(invoice: any): any {
    return {
      id: invoice.id,
      number: invoice.name,
      partnerId: invoice.partner_id?.[0],
      partnerName: invoice.partner_id?.[1],
      invoiceDate: invoice.invoice_date,
      amountTotal: invoice.amount_total,
      amountUntaxed: invoice.amount_untaxed,
      amountTax: invoice.amount_tax,
      state: invoice.state,
      paymentState: invoice.payment_state,
      lines: invoice.invoice_line_ids || [],
    };
  }

  /**
   * Generate time slots based on working hours and existing appointments
   */
  private generateTimeSlots(
    workingHours: any,
    appointments: any[],
    date: Date
  ): any[] {
    const slots = [];
    const slotDuration = 60; // 60 minutes per slot
    
    // Default working hours if not specified
    const defaultHours = {
      morning: { start: '09:00', end: '12:00' },
      afternoon: { start: '14:00', end: '18:00' },
    };

    const hours = workingHours || defaultHours;
    
    // Generate slots for each period
    for (const period of Object.values(hours)) {
      const startTime = this.parseTime(period.start);
      const endTime = this.parseTime(period.end);
      
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        
        // Check if slot is available
        const isBooked = appointments.some(apt => {
          const aptTime = new Date(apt.appointment_date);
          return (
            aptTime >= currentTime &&
            aptTime < slotEnd
          );
        });

        slots.push({
          id: `${currentTime.getHours()}-${currentTime.getMinutes()}`,
          time: `${this.formatTime(currentTime)} - ${this.formatTime(slotEnd)}`,
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: !isBooked,
        });

        currentTime = slotEnd;
      }
    }

    return slots;
  }

  /**
   * Parse time string to Date object
   */
  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  /**
   * Format date for ODOO
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Combine date and time slot
   */
  private combineDateTime(date: Date, timeSlot: string): string {
    const [startTime] = timeSlot.split(' - ');
    const [hours, minutes] = startTime.split('.').map(Number);
    
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    
    return combined.toISOString();
  }

  /**
   * Get consultation product ID (create if not exists)
   */
  private async getConsultationProductId(): Promise<number> {
    try {
      const products = await odooComService.search(
        'product.product',
        [['default_code', '=', 'CONSULTATION']]
      );

      if (products.length > 0) {
        return products[0];
      }

      // Create consultation product if not exists
      return await odooComService.create('product.product', {
        name: 'Consultation Service',
        default_code: 'CONSULTATION',
        type: 'service',
        list_price: 0,
        sale_ok: true,
        purchase_ok: false,
      });
    } catch (error) {
      return 1; // Return default product ID
    }
  }

  /**
   * Get home service product ID (create if not exists)
   */
  private async getHomeServiceProductId(): Promise<number> {
    try {
      const products = await odooComService.search(
        'product.product',
        [['default_code', '=', 'HOME_SERVICE']]
      );

      if (products.length > 0) {
        return products[0];
      }

      // Create home service product if not exists
      return await odooComService.create('product.product', {
        name: 'Home Service Fee',
        default_code: 'HOME_SERVICE',
        type: 'service',
        list_price: 0,
        sale_ok: true,
        purchase_ok: false,
      });
    } catch (error) {
      return 1; // Return default product ID
    }
  }

  /**
   * Cache helper - get cached data
   */
  private async getCached(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < this.CACHE_DURATION) {
          return data.value;
        }
      }
    } catch (error) {
      }
    return null;
  }

  /**
   * Cache helper - set cached data
   */
  private async setCached(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          value,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      }
  }

  /**
   * Clear all doctor-related cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const doctorKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      if (doctorKeys.length > 0) {
        await AsyncStorage.multiRemove(doctorKeys);
      }
    } catch (error) {
      }
  }
}

export default new OdooDoctorService();