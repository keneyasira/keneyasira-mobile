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
import { Mail, Phone, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type LoginType = 'phone' | 'email';
export default function LoginScreen() {
  const router = useRouter();
  const { requestOTP, requestMagicLink } = useAuth();
  const [loginType, setLoginType] = useState<LoginType>('phone');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInput = () => {
    if (!identifier.trim()) {
      Alert.alert('Error', `Please enter your ${loginType === 'phone' ? 'phone number' : 'email address'}`);
      return false;
    }

    if (loginType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
    } else {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(identifier)) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      setLoading(true);
      
      if (loginType === 'phone') {
        await requestOTP(identifier);
        router.push(`/auth/verify-otp?phone=${encodeURIComponent(identifier)}`);
      } else {
        await requestMagicLink(identifier);
        Alert.alert(
          'Magic Link Sent',
          'We\'ve sent a magic link to your email. Click the link to log in automatically.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send ${loginType === 'phone' ? 'OTP' : 'magic link'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Choose your preferred login method
            </Text>
          </View>

          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              style={[
                styles.loginTypeButton,
                loginType === 'phone' && styles.loginTypeButtonActive,
              ]}
              onPress={() => {
                setLoginType('phone');
                setIdentifier('');
              }}
            >
              <Phone size={20} color={loginType === 'phone' ? '#FFFFFF' : '#6B7280'} />
              <Text
                style={[
                  styles.loginTypeText,
                  loginType === 'phone' && styles.loginTypeTextActive,
                ]}
              >
                Phone Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.loginTypeButton,
                loginType === 'email' && styles.loginTypeButtonActive,
              ]}
              onPress={() => {
                setLoginType('email');
                setIdentifier('');
              }}
            >
              <Mail size={20} color={loginType === 'email' ? '#FFFFFF' : '#6B7280'} />
              <Text
                style={[
                  styles.loginTypeText,
                  loginType === 'email' && styles.loginTypeTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              {loginType === 'phone' ? (
                <Phone size={20} color="#6B7280" />
              ) : (
                <Mail size={20} color="#6B7280" />
              )}
              <TextInput
                style={styles.input}
                placeholder={loginType === 'phone' ? 'Enter your phone number' : 'Enter your email'}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType={loginType === 'phone' ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoComplete={loginType === 'phone' ? 'tel' : 'email'}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {loginType === 'phone' ? 'Send OTP' : 'Send Magic Link'}
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {loginType === 'phone' 
                ? 'You will receive an OTP via SMS to verify your phone number'
                : 'You will receive a magic link via email to log in automatically'
              }
            </Text>
            <Text style={styles.footerSubtext}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
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
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loginTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  loginTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  loginTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  loginTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  loginTypeTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#3B82F6',
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
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});