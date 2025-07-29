import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { useRouter } from 'expo-router';
import '@/i18n';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();

  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        
        // Handle notification tapped
        const subscription = notificationService.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          
          if (data?.type === 'appointment_reminder' && data?.appointmentId) {
            // Navigate to appointments screen
            router.push('/(tabs)/appointments');
          }
        });

        return () => subscription.remove();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="auth/verify-otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="doctor-detail" />
        <Stack.Screen name="establishment-detail" />
        <Stack.Screen name="book-appointment" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}