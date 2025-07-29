// API Types based on OpenAPI specification
export interface Patient {
  id: string;
  userId: string;
  birthDate: any;
  user: {
    createdBy?: null;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
    phone:string;
    updatedBy: null;
    deletedAt: null;
    deletedBy: null;
    createdAt?: string;
    updatedAt?: string;
},
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  createdAt?: any;
  deletedAt?: any;
  updatedAt?: any
}

interface UserInfoModel {
  patient?: Patient
}

export interface UserModel {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  createdAt?: any
  deletedAt?: any
  updatedAt?: any
  infos: UserInfoModel
  clientType: string
}

export interface Practician {
  id: string;
  userId: string;
  specialties: {
    id: string;
    name: string;
  }[];
  user: {
    createdBy?: null;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
    phone:string;
    updatedBy: null;
    deletedAt: null;
    deletedBy: null;
    createdAt?: string;
    updatedAt?: string;
  };
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  createdAt?: string
  deletedAt?: string
  updatedAt?: string
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  specialties: {
    id: string;
    name: string;
  }[];
  description?: string;
  establishmentAffiliationId: string;
  establishmentTypeId: string;
  affiliation: {
    id: string;
    name: string;
  };
  type: {
    id: string;
    name: string;
  }
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  createdAt?: string
  deletedAt?: string
  updatedAt?: string
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  date: string;
  practicianId?: string;
  establishmentId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  practicianId?: string;
  establishmentId?: string;
  timeSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  practician?: Practician;
  establishment?: Establishment;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  data: {access_token: string;
  refresh_token: string;}
}

export interface LoginRequest {
  phone?: string; // phone
  clientType: 'patient',
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
  clientType: 'patient'
}

export interface SearchFilters {
  name_search?: string;
  location_search?: string;
  specialty?: string;
  city?: string;
  limit?: number;
  offset?: number;
}

export interface CreateAppointmentRequest {
  patientId: string;
  timeSlotId: string;
  notes?: string;
}