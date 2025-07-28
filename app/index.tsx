import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { patient, isLoading, loginWithMagicLink } = useAuth();

  useEffect(() => {
    // Handle magic link deep linking
    const handleDeepLink = async (url: string) => {
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        
        if (token && urlObj.pathname.includes('/auth/magic-link')) {
          await loginWithMagicLink(token);
          router.replace('/(tabs)/search');
          return;
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Check for initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming links (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    if (!isLoading) {
      if (patient) {
        router.replace('/(tabs)/search');
      } else {
        router.replace('/auth/login');
      }
    }

    return () => {
      subscription?.remove();
    };
  }, [patient, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>HealthCare</Text>
        <Text style={styles.subtitle}>Your Health, Our Priority</Text>
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#BFDBFE',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});