import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SplashScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { patient, isLoading } = useAuth();

  // Navigation effect to handle auth state changes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    if (patient && !inTabsGroup) {
      // User is authenticated but not in tabs, redirect to tabs
      router.replace('/(tabs)/search');
    } else if (!patient && !inAuthGroup) {
      // User is not authenticated and not in auth, redirect to login
      router.replace('/auth/login');
    }
  }, [patient, isLoading, segments]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('splash.title')}</Text>
        <Text style={styles.subtitle}>{t('splash.subtitle')}</Text>
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