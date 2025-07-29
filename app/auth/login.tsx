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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { requestOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  // Check if user is in cooldown period
  React.useEffect(() => {
    checkCooldownStatus();
  }, []);

  // Countdown timer for cooldown
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

  const validateInput = () => {
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

    if (!phoneNumber.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('auth.phoneRequired'),
        type: 'error',
      });
      return false;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      showAlert({
        title: t('common.error'),
        message: t('auth.invalidPhone'),
        type: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      setLoading(true);
      await updateOtpAttempts();
      await requestOTP(phoneNumber);
      
      // Set initial cooldown of 60 seconds after successful OTP request
      setCooldownTime(60);
      
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('auth.otpSendFailed'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCooldownTime = () => {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.enterPhoneNumber')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#035AA6" />
              <TextInput
                style={styles.input}
                placeholder={t('auth.phoneNumberPlaceholder')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoComplete="tel"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || cooldownTime > 0) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || cooldownTime > 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : cooldownTime > 0 ? (
                <Text style={styles.buttonText}>
                  {t('auth.resendCodeIn', { seconds: formatCooldownTime() })}
                </Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('auth.sendOTP')}</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.smsNotice')}
            </Text>
            {cooldownTime > 0 && (
              <Text style={styles.cooldownWarning}>
                {t('auth.otpRateLimit')}
              </Text>
            )}
            <Text style={styles.footerSubtext}>
              {t('auth.termsText')}
            </Text>
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                {t('auth.dontHaveAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#035AA6',
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
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#035AA6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  cooldownWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  signupLink: {
    fontSize: 14,
    color: '#035AA6',
    fontWeight: '600',
  },
});