import React, { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyOTPScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone, signup } = useLocalSearchParams<{ 
    phone: string; 
    signup?: string; 
  }>();
  const { loginWithOTP, requestOTP } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const { alertState, showAlert, hideAlert } = useCustomAlert();
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    checkResendStatus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkResendStatus = async () => {
    try {
      const lastResendTime = await AsyncStorage.getItem(`lastResend_${phone}`);
      const attempts = await AsyncStorage.getItem(`resendAttempts_${phone}`);
      
      if (lastResendTime && attempts) {
        const timeSinceLastResend = Date.now() - parseInt(lastResendTime);
        const attemptCount = parseInt(attempts);
        
        // Reset attempts if last resend was more than 1 hour ago
        if (timeSinceLastResend > 60 * 60 * 1000) {
          await AsyncStorage.removeItem(`resendAttempts_${phone}`);
          await AsyncStorage.removeItem(`lastResend_${phone}`);
          setResendAttempts(0);
        } else {
          setResendAttempts(attemptCount);
          
          // Block if too many attempts
          if (attemptCount >= 5) {
            const remainingBlockTime = (60 * 60 * 1000) - timeSinceLastResend;
            if (remainingBlockTime > 0) {
              setIsBlocked(true);
              setCountdown(Math.ceil(remainingBlockTime / 1000));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking resend status:', error);
    }
  };

  const updateResendAttempts = async () => {
    try {
      const newAttempts = resendAttempts + 1;
      await AsyncStorage.setItem(`resendAttempts_${phone}`, newAttempts.toString());
      await AsyncStorage.setItem(`lastResend_${phone}`, Date.now().toString());
      setResendAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsBlocked(true);
        setCountdown(60 * 60); // 1 hour block
      }
    } catch (error) {
      console.error('Error updating resend attempts:', error);
    }
  };
  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showAlert({
        title: t('common.error'),
        message: t('auth.otpRequired'),
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Handle both signup and login flows the same way
      // Account creation already happened in signup flow
      await loginWithOTP(phone, otpString);
      
      // Clear resend attempts on successful verification
      await AsyncStorage.removeItem(`resendAttempts_${phone}`);
      await AsyncStorage.removeItem(`lastResend_${phone}`);
      
      router.replace('/(tabs)/search');
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('auth.invalidOTP'),
        type: 'error',
      });
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (isBlocked) {
      showAlert({
        title: t('common.error'),
        message: t('auth.resendBlocked'),
        type: 'warning',
      });
      return;
    }

    if (resendAttempts >= 3) {
      showAlert({
        title: t('common.warning'),
        message: t('auth.resendLimitWarning', { remaining: 5 - resendAttempts }),
        type: 'warning',
      });
    }

    try {
      setResendLoading(true);
      await requestOTP(phone);
      await updateResendAttempts();
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      showAlert({
        title: t('common.success'),
        message: t('auth.otpSentSuccess'),
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('auth.otpSendFailed'),
        type: 'error',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const formatBlockTime = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('auth.enterVerificationCode')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.verificationCodeSent', { phone })}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => 
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>{t('auth.verifyCode')}</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {isBlocked ? (
              <Text style={styles.blockedText}>
                {t('auth.resendBlockedTime', { time: formatBlockTime() })}
              </Text>
            ) : countdown > 0 ? (
              <Text style={styles.countdownText}>
                {t('auth.resendCodeIn', { seconds: countdown })}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <ActivityIndicator size="small" color="#035AA6" />
                )}
              </TouchableOpacity>
            )}
            
            {resendAttempts > 0 && !isBlocked && (
              <Text style={styles.attemptWarning}>
                {t('auth.resendAttempts', { attempts: resendAttempts, max: 5 })}
              </Text>
            )}
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
    padding: 20,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    gap: 5,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  otpInputFilled: {
    borderColor: '#035AA6',
    backgroundColor: '#EBF8FF',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#035AA6',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  resendContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#035AA6',
  },
  blockedText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  attemptWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
  },
});