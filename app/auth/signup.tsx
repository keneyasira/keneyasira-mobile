import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, Calendar, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function SignupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  // Check cooldown status on component mount
  React.useEffect(() => {
    checkCooldownStatus();
  }, []);

  // Countdown timer
  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const checkCooldownStatus = async () => {
    try {
      const lastOtpTime = await AsyncStorage.getItem('lastOtpRequest');
      const attemptCount = await AsyncStorage.getItem('otpAttemptCount');
      
      if (lastOtpTime && attemptCount) {
        const timeSinceLastRequest = Date.now() - parseInt(lastOtpTime);
        const attempts = parseInt(attemptCount);
        
        // Progressive cooldown: 1 min, 5 min, 15 min, 30 min
        const cooldownPeriods = [60, 300, 900, 1800]; // in seconds
        const cooldownIndex = Math.min(attempts - 3, cooldownPeriods.length - 1);
        
        if (attempts >= 3 && cooldownIndex >= 0) {
          const requiredCooldown = cooldownPeriods[cooldownIndex] * 1000; // convert to ms
          
          if (timeSinceLastRequest < requiredCooldown) {
            const remainingTime = Math.ceil((requiredCooldown - timeSinceLastRequest) / 1000);
            setCooldownTime(remainingTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking cooldown status:', error);
    }
  };

  const updateOtpAttempts = async () => {
    try {
      const now = Date.now().toString();
      const currentAttempts = await AsyncStorage.getItem('otpAttemptCount');
      const lastAttemptTime = await AsyncStorage.getItem('lastOtpRequest');
      
      // Reset counter if last attempt was more than 1 hour ago
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (lastAttemptTime && parseInt(lastAttemptTime) < oneHourAgo) {
        await AsyncStorage.setItem('otpAttemptCount', '1');
      } else {
        const newCount = currentAttempts ? (parseInt(currentAttempts) + 1).toString() : '1';
        await AsyncStorage.setItem('otpAttemptCount', newCount);
      }
      
      await AsyncStorage.setItem('lastOtpRequest', now);
    } catch (error) {
      console.error('Error updating OTP attempts:', error);
    }
  };
  const validateForm = () => {
    if (cooldownTime > 0) {
      const minutes = Math.floor(cooldownTime / 60);
      const seconds = cooldownTime % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      
      showAlert({
        title: t('common.error'),
        message: t('auth.otpCooldown', { time: timeString }),
        type: 'warning',
      });
      return false;
    }

    if (!formData.firstName.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.firstNameRequired'),
        type: 'error',
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.lastNameRequired'),
        type: 'error',
      });
      return false;
    }

    if (!formData.email.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.emailRequired'),
        type: 'error',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert({
        title: t('common.error'),
        message: t('auth.invalidEmail'),
        type: 'error',
      });
      return false;
    }

    if (!formData.phone.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.phoneRequired'),
        type: 'error',
      });
      return false;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      showAlert({
        title: t('common.error'),
        message: t('auth.invalidPhone'),
        type: 'error',
      });
      return false;
    }

    if (!formData.birthDate.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.birthDateRequired'),
        type: 'error',
      });
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.birthDate)) {
      showAlert({
        title: t('common.error'),
        message: t('auth.invalidBirthDate'),
        type: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // First create the patient account
      await apiService.createPatient(formData);
      
      // Then send OTP for login verification
      await apiService.requestOTP(formData.phone);
      
      await updateOtpAttempts();
      // Navigate to OTP verification
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(formData.phone)}&signup=true`);
    } catch (error) {
      console.error('Signup error:', error);
      showAlert({
        title: t('common.error'),
        message: t('auth.signupFailed'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateInput = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add dashes automatically
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    } else if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.signupSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.firstNamePlaceholder')}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </View>

            <View style={styles.inputContainer}>
              <User size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.lastNamePlaceholder')}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.phoneNumberPlaceholder')}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={styles.inputContainer}>
              <Calendar size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.birthDatePlaceholder')}
                value={formData.birthDate}
                onChangeText={(text) => setFormData({ ...formData, birthDate: formatDateInput(text) })}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.alreadyHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      // Set initial cooldown
      setCooldownTime(60);
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
              style={[styles.button, (loading || cooldownTime > 0) && styles.buttonDisabled]}
  input: {
              disabled={loading || cooldownTime > 0}
    fontSize: 16,
            {cooldownTime > 0 && (
              <Text style={styles.cooldownWarning}>
                {t('auth.otpRateLimit')}
              </Text>
            )}
    color: '#111827',
    marginLeft: 12,
              ) : cooldownTime > 0 ? (
                <Text style={styles.buttonText}>
                  {t('auth.waitBeforeRetry', { 
                    time: cooldownTime > 60 
                      ? `${Math.floor(cooldownTime / 60)}m ${cooldownTime % 60}s`
                      : `${cooldownTime}s`
                  })}
                </Text>
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#035AA6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  cooldownWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    color: '#035AA6',
    fontWeight: '600',
  },
});