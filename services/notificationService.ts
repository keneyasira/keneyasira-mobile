import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '@/types/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notifications and get push token
  async initialize(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      
      // Store token locally
      await AsyncStorage.setItem('expoPushToken', token.data);
      
      console.log('Push token:', token.data);
      return token.data;

    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Get stored push token
  async getPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      if (storedToken) {
        this.expoPushToken = storedToken;
        return storedToken;
      }
    } catch (error) {
      console.error('Error getting stored push token:', error);
    }

    return null;
  }

  // Schedule local notification for appointment reminder
  async scheduleAppointmentReminder(appointment: Appointment, reminderMinutes: number = 60): Promise<string | null> {
    try {
      const appointmentDateTime = new Date(`${appointment.timeslot.date}T${appointment.timeslot.startTime}`);
      const reminderTime = new Date(appointmentDateTime.getTime() - (reminderMinutes * 60 * 1000));

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.log('Reminder time is in the past, not scheduling');
        return null;
      }

      const providerName = appointment.practician 
        ? `Dr. ${appointment.practician.user.firstName} ${appointment.practician.user.lastName}`
        : appointment.establishment?.name || 'Healthcare Provider';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏥 Appointment Reminder',
          body: `You have an appointment with ${providerName} in ${reminderMinutes} minutes`,
          data: {
            appointmentId: appointment.id,
            type: 'appointment_reminder',
          },
          sound: true,
        },
        trigger: {
          date: reminderTime,
        },
      });

      // Store notification ID for potential cancellation
      await AsyncStorage.setItem(`notification_${appointment.id}`, notificationId);
      
      console.log(`Scheduled reminder for appointment ${appointment.id} at ${reminderTime}`);
      return notificationId;

    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return null;
    }
  }

  // Cancel appointment reminder
  async cancelAppointmentReminder(appointmentId: string): Promise<void> {
    try {
      const notificationId = await AsyncStorage.getItem(`notification_${appointmentId}`);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(`notification_${appointmentId}`);
        console.log(`Cancelled reminder for appointment ${appointmentId}`);
      }
    } catch (error) {
      console.error('Error cancelling appointment reminder:', error);
    }
  }

  // Schedule multiple reminders for an appointment
  async scheduleMultipleReminders(appointment: Appointment, reminderTimes: number[] = [1440, 60, 15]): Promise<void> {
    try {
      // Cancel existing reminders first
      await this.cancelAppointmentReminder(appointment.id);

      // Schedule new reminders (24 hours, 1 hour, 15 minutes before)
      for (const minutes of reminderTimes) {
        await this.scheduleAppointmentReminder(appointment, minutes);
      }
    } catch (error) {
      console.error('Error scheduling multiple reminders:', error);
    }
  }

  // Handle notification received while app is running
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Handle notification tapped
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Send push token to your backend
  async sendPushTokenToServer(patientId: string): Promise<void> {
    try {
      const token = await this.getPushToken();
      if (!token) {
        console.log('No push token available');
        return;
      }

      // TODO: Implement API call to your backend
      // await apiService.updatePatientPushToken(patientId, token);
      
      console.log('Push token sent to server:', token);
    } catch (error) {
      console.error('Error sending push token to server:', error);
    }
  }

  // Clear all scheduled notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get all scheduled notifications (for debugging)
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();