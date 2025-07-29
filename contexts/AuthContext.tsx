import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/api';
import { apiService } from '@/services/api';

interface AuthContextType {
  patient: Patient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOTP: (phone: string) => Promise<void>;
  updatePatient: (data: Partial<Patient>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentPatient = await apiService.getCurrentPatient();
      console.log('currentPatient', currentPatient);
      setPatient(currentPatient);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOTP = async (phone: string) => {
    await apiService.requestOTP(phone);
  };


  const loginWithOTP = async (phone: string, otp: string) => {
    try {
      const response: Patient = await apiService.verifyOTP(phone, otp);
      setPatient(response);
    } catch (error) {
      console.error('Login with OTP failed:', error);
      throw error;
    }
  };


  const logout = async () => {
    try {
      await apiService.logout();
      setPatient(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state
      setPatient(null);
    }
  };

  const updatePatient = async (data: Partial<Patient>) => {
    if (!patient) return;
    
    try {
      const updatedPatient = await apiService.updatePatient(patient.id, data);
      setPatient(updatedPatient);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    patient,
    isAuthenticated: !!patient,
    isLoading,
    loginWithOTP,
    logout,
    requestOTP,
    updatePatient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};