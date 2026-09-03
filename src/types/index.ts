// ===== Auth & User =====
export type AccountType = 'PATIENT' | 'ORGANIZATION';
export type OrgType = 'EMPLOYER' | 'HMO' | 'HOSPITAL';

export interface User {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: AccountType;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

// ===== Organization =====
export type OrgRole =
  | 'ORG_ADMIN'
  | 'STAFF'
  | 'HMO_ADMIN'
  | 'HMO_OFFICER'
  | 'PROVIDER_ADMIN'
  | 'DOCTOR';

export type MemberStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface Organization {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  type: OrgType;
  createdAt: string;
}

export interface OrgMember {
  id: number;
  userId: number;
  organizationId: number;
  role: OrgRole;
  status: MemberStatus;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Invitation {
  id: number;
  organizationId: number;
  email: string;
  role: OrgRole;
  token?: string;
  status: MemberStatus;
  createdAt: string;
}

// ===== HMO =====
export interface HmoPlan {
  id: number;
  hmoId: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface HmoProvider {
  id: number;
  hmoId: number;
  providerId: number;
  provider: {
    id: number;
    name: string;
    type: string;
    email: string;
    phone: string;
    address: string;
  };
  connectedAt: string;
}

export interface HmoEnrollment {
  id: number;
  patientId: number;
  hmoId: number;
  planId: number;
  hmoNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollmentDate: string;
}

export interface Partnership {
  id: number;
  hmoId: number;
  employerId: number;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  createdAt: string;
}

// ===== Clinical =====
export interface EligibilityResponse {
  eligible: boolean;
  hmoNumber: string;
  patientName: string;
  planName: string;
  provider: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export interface Diagnosis {
  id: number;
  appointmentId: number;
  diagnosis: string;
  recordedBy: number;
  recordedAt: string;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  issuedBy: number;
  securityVerified: boolean;
  issuedAt: string;
}

export interface ClinicalSummary {
  id: number;
  appointmentId: number;
  patientName: string;
  hospitalName: string;
  hmoNumber: string;
  diagnosis: {
    id: number;
    diagnosis: string;
    recordedAt: string;
    recordedBy: string;
  } | null;
  prescription: {
    id: number;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    issuedAt: string;
    issuedBy: string;
  } | null;
}

// ===== Hospital Patients =====
export interface HospitalPatient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  hospitalNumber: string;
  registrationDate: string;
}

// ===== Patient Portal =====
export interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  registrations: {
    hospitalId: number;
    hospitalName: string;
    hospitalNumber: string;
    registrationDate: string;
  }[];
  enrollments: {
    hmoId: number;
    hmoName: string;
    hmoNumber: string;
    planName: string;
    status: 'ACTIVE' | 'INACTIVE';
    enrollmentDate: string;
  }[];
}

export interface PatientPrescription {
  id: number;
  appointmentId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  issuedBy: string;
  hospital: string;
  issuedAt: string;
}

// ===== Appointment =====
export type AppointmentType = 'REQUEST' | 'CANCEL' | 'RESCHEDULE';
export type AppointmentService = 'CONSULTATION' | 'IMMUNIZATION' | 'MEDICATION';
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Appointment {
  id: number;
  hospitalId: number;
  hmoId: number;
  userId: number;
  scheduledAt: string;
  type: AppointmentType;
  service: AppointmentService;
  status: AppointmentStatus;
  createdAt: string;
}

// ===== Generic API =====
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  statusCode?: number;
  message: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}
