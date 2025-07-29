import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Patient,
  Practician,
  Establishment,
  TimeSlot,
  Appointment,
  AuthResponse,
  SearchFilters,
  CreateAppointmentRequest,
  type UserModel,
} from '@/types/api';
import { jwtDecode } from 'jwt-decode';

import {
  Alert,
} from 'react-native';

const API_BASE_URL = 'http://192.168.1.98:4000'; // Replace with actual API URL

class ApiService {
  private axios;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.axios.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {

        // If error is 401 and we haven't already tried to refresh
          if (!originalRequest._retry) {
            if (this.isRefreshing) {
              // If already refreshing, queue this request
              return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              }).then(() => {
                return this.axios(originalRequest);
              }).catch(err => {
                return Promise.reject(err);
              });
            }

            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              const refreshToken = await AsyncStorage.getItem('refreshToken');
              if (refreshToken) {
                const response = await this.refreshAccessToken(refreshToken);
                const newAccessToken = response.data.access_token;
                
                // Update stored tokens
                await AsyncStorage.setItem('authToken', newAccessToken);
                if (response.data.refresh_token) {
                  await AsyncStorage.setItem('refreshToken', response.data.refresh_token);
                }

                // Process failed queue
                this.processQueue(null);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.axios(originalRequest);
              } else {
                // No refresh token available, logout user
                await this.clearAuthData();
                this.processQueue(new Error('No refresh token available'));
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              await this.clearAuthData();
              this.processQueue(refreshError);
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    // Create a new axios instance without interceptors to avoid infinite loops
    const refreshAxios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    const response: AxiosResponse<AuthResponse> = await refreshAxios.post('/authentication/refresh-token', {
      refresh_token: refreshToken,
    });

    return response.data;
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  private async clearAuthData(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('currentPatient');
  }
  // Authentication
  async requestOTP(phone: string): Promise<void> {
    await this.axios.post('/authentication/login', { 
      phone: '0022379131416',
      clientType: 'patient' 
    });
  }


  async verifyOTP(phone: string, otp: string): Promise<Patient> {
    const response: AxiosResponse<AuthResponse> = await this.axios.post('/authentication/verify-otp', {
      phone,
      otp,
      clientType: 'patient'
    });

    const data = response.data.data;
    
    // Store token and patient data
    await AsyncStorage.setItem('authToken', data.access_token);
    await AsyncStorage.setItem('refreshToken', data.refresh_token);
    // decode the token to get the patient id
    const decodedToken = jwtDecode<UserModel>(data.access_token);
    const patientId = decodedToken.infos.patient?.id;
    // get the patient data
    const patient = await this.axios.get(`/patients/${patientId}`);
    await AsyncStorage.setItem('currentPatient', JSON.stringify(patient.data));
    return patient.data.data;
  }


  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // Patient
  async getCurrentPatient(): Promise<Patient | null> {
    const patientData = await AsyncStorage.getItem('currentPatient');
    return patientData ? JSON.parse(patientData).data : null;
  }

  async updatePatient(patientId: string, data: Partial<Patient>): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.axios.put(`/patients/${patientId}`, data);
    await AsyncStorage.setItem('currentPatient', JSON.stringify(response.data));
    return response.data;
  }

  // Specialties
  getSpecialties = async (): Promise<Specialty[]> => {
    const response: AxiosResponse<{data: Specialty[]}> = await this.axios.get('/specialties', {
      params: {
        page: 1,
        limit: 100,
        sort: ['name:ASC']
      },
    });
    return response.data.data;
  };

  // Practicians
  async searchPracticians(filters: SearchFilters): Promise<Practician[]> {
    const response: AxiosResponse<Practician[]> = await this.axios.get('/practicians', {
      params: filters,
    });
    return response.data;
  }

  async getPracticianById(id: string): Promise<Practician> {
    const response: AxiosResponse<Practician> = await this.axios.get(`/practicians/${id}`);
    return response.data.data;
  }

  async getPracticianTimeSlots(practicianId: string, date: string): Promise<TimeSlot[]> {
    const response: AxiosResponse<TimeSlot[]> = await this.axios.get(`/practicians/${practicianId}/time-slots`, {
      params: { 
        startDate: date,
        sort: ['startTime:ASC']
      },
    });
    return response.data.data || [];
  }

  // Establishments
  async searchEstablishments(filters: SearchFilters): Promise<Establishment[]> {
    const response: AxiosResponse<Establishment[]> = await this.axios.get('/establishments', {
      params: filters,
    });
    return response.data;
  }

  async getEstablishmentById(id: string): Promise<Establishment> {
    const response: AxiosResponse<Establishment> = await this.axios.get(`/establishments/${id}`);
    return response.data.data;
  }

  async getEstablishmentTimeSlots(establishmentId: string, date: string): Promise<TimeSlot[]> {
    const response: AxiosResponse<TimeSlot[]> = await this.axios.get(`/establishments/${establishmentId}/time-slots`, {
      params: { 
        page: 1,
        limit: 50,
        sort: ['startTime:ASC'],
        startDate: date 
      },
    });
    return response.data.data || [];
  }

  async getEstablishmentPracticians(establishmentId: string): Promise<Practician[]> {
    const response: AxiosResponse<Practician[]> = await this.axios.get(`/establishments/${establishmentId}/practicians`, {
      params: {
        page: 1,
        limit: 50,
        sort: ['firstName:ASC']
      },
    });
    return response.data.data || [];
  }

  // Appointments
  async createAppointment(request: CreateAppointmentRequest): Promise<Appointment> {
    const response: AxiosResponse<{data: Appointment}> = await this.axios.post('/appointments', request);
    return response.data.data;
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const response: AxiosResponse<{data: Appointment[]}> = await this.axios.get(`/patients/${patientId}/appointments`, {
      params: {
        page: 1,
        limit: 100,
        sort: ['date:DESC']
      }
    });
    console.log('API Response for appointments:', response.data);
    return response.data.data || [];
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.axios.get(`/appointments/${id}`);
    return response.data.data;
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.axios.put(`/appointments/${id}/cancel`);
    return response.data.data;
  }
}

export const apiService = new ApiService();