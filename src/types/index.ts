export type UserRole = 'student' | 'doctor' | 'pharmacy' | 'admin';

export interface User {
  id: string;
  email: string;
  register_number: string | null;
  role: UserRole;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  status?: 'active' | 'suspended';
  created_at?: string;
}

export interface StudentProfile {
  user_id: string;
  roll_no: string;
  department: string;
  year_of_study: string;
  gender: string;
  blood_group: string;
  dob?: string;
  hostel_block?: string;
  room_no?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  known_allergies?: string;
  chronic_conditions?: string;
}

export interface DoctorProfile {
  user_id: string;
  employee_id: string;
  specialization: string;
  qualification: string;
  opd_room: string;
  experience_years: number;
  bio?: string;
  available_days: string;
  start_time: string;
  end_time: string;
  slot_duration_mins: number;
  is_available_today: number;
}

export interface PharmacyProfile {
  user_id: string;
  staff_id: string;
  designation: string;
  license_no?: string;
}

export type AppointmentStatus = 'booked' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
export type ConsultationType = 'in_person' | 'online';

export interface Appointment {
  id: string;
  appointment_number: string;
  student_id: string;
  doctor_id: string;
  appointment_date: string;
  time_slot: string;
  consultation_type: ConsultationType;
  reason_for_visit: string;
  symptoms_description?: string;
  status: AppointmentStatus;
  token_number: number;
  check_in_time?: string;
  completed_time?: string;
  created_at: string;
  
  // Joined fields
  student_name?: string;
  student_email?: string;
  student_roll?: string;
  student_department?: string;
  student_year?: string;
  student_blood_group?: string;
  emergency_contact_phone?: string;
  hostel_block?: string;
  room_no?: string;
  doctor_name?: string;
  doctor_avatar?: string;
  doctor_specialization?: string;
  doctor_room?: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  student_id: string;
  doctor_id: string;
  start_time?: string;
  end_time?: string;
  vitals_bp?: string;
  vitals_pulse?: number;
  vitals_temp?: number;
  vitals_spo2?: number;
  vitals_weight?: number;
  symptoms?: string;
  clinical_notes?: string;
  diagnosis: string;
  treatment_recommendations?: string;
  doctor_advice?: string;
  follow_up_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  category?: string;
  dosage_form?: string;
  strength?: string;
  total_stock?: number;
  location_shelf?: string;
}

export interface Prescription {
  id: string;
  prescription_code: string;
  consultation_id: string;
  student_id: string;
  doctor_id: string;
  diagnosis_summary: string;
  general_instructions?: string;
  status: 'issued' | 'dispensed' | 'cancelled';
  issued_at: string;
  dispensed_at?: string;
  dispensed_by?: string;
  dispensed_by_name?: string;
  items: PrescriptionItem[];
  student_name?: string;
  student_roll?: string;
  student_email?: string;
  student_phone?: string;
  student_department?: string;
  student_year?: string;
  blood_group?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_qualification?: string;
  opd_room?: string;
}

export interface MedicineBatch {
  id: string;
  medicine_id: string;
  batch_number: string;
  quantity: number;
  initial_quantity: number;
  received_date: string;
  expiry_date: string;
  unit_cost: number;
  status: 'active' | 'near_expiry' | 'expired' | 'depleted';
  medicine_name?: string;
  medicine_code?: string;
  unit?: string;
  location_shelf?: string;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  unit: string;
  min_stock_alert: number;
  total_stock: number;
  location_shelf?: string;
  batches?: MedicineBatch[];
}

export interface StockTransaction {
  id: string;
  medicine_id: string;
  batch_id?: string;
  transaction_type: 'received' | 'dispensed' | 'adjustment_add' | 'adjustment_remove' | 'expired_discard';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  performed_by: string;
  performed_by_name?: string;
  performed_by_role?: string;
  medicine_name?: string;
  medicine_code?: string;
  batch_number?: string;
  unit?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface QueueDoctorStatus {
  doctorId: string;
  doctorName: string;
  opdRoom: string;
  specialization: string;
  totalToday: number;
  currentlyServingToken: number | null;
  currentlyServingPatient: string | null;
  waitingCount: number;
  completedCount: number;
  allTokens: any[];
}
