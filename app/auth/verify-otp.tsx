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

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { loginWithOTP, requestOTP } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await loginWithOTP(phone, otpString);
      router.replace('/(tabs)/search');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await requestOTP(phone);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'Verification code sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
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
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {phone}
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
                <Text style={styles.verifyButtonText}>Verify Code</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.resendText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
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
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
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
    color: '#3B82F6',
  },
});