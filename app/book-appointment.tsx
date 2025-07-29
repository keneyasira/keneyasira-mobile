import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Practician, Establishment, TimeSlot, CreateAppointmentRequest } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface WeekData {
  startDate: Date;
  endDate: Date;
  days: {
    date: Date;
    dayName: string;
    dayNumber: number;
    timeSlots: TimeSlot[];
  }[];
}

export default function BookAppointmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: 'doctor' | 'establishment'; id: string }>();
  const { patient } = useAuth();
  
  const [provider, setProvider] = useState<Practician | Establishment | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (id && type) {
      loadProviderDetails();
    }
  }, [id, type]);

  useEffect(() => {
    if (provider) {
      loadWeekTimeSlots();
    }
  }, [provider, weekOffset]);

  const loadProviderDetails = async () => {
    try {
      setLoading(true);
      let data;
      if (type === 'doctor') {
        data = await apiService.getPracticianById(id);
      } else {
        data = await apiService.getEstablishmentById(id);
      }
      setProvider(data);
    } catch (error) {
      Alert.alert(t('common.error'), t('bookAppointment.loadFailed'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (offset: number = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (offset * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date: new Date(date),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        timeSlots: [],
      });
    }

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      days,
    };
  };

  const loadWeekTimeSlots = async () => {
    if (!provider) return;

    try {
      setTimeSlotsLoading(true);
      const week = getWeekDates(weekOffset);
      
      // Load time slots for each day of the week
      const promises = week.days.map(async (day) => {
        const dateString = day.date.toISOString().split('T')[0];
        try {
          let timeSlots;
          if (type === 'doctor') {
            timeSlots = await apiService.getPracticianTimeSlots(provider.id, dateString);
          } else {
            timeSlots = await apiService.getEstablishmentTimeSlots(provider.id, dateString);
          }
          return { ...day, timeSlots: timeSlots || [] };
        } catch (error) {
          return { ...day, timeSlots: [] };
        }
      });

      const daysWithSlots = await Promise.all(promises);
      setCurrentWeek({ ...week, days: daysWithSlots });
    } catch (error) {
      console.error('Failed to load time slots:', error);
    } finally {
      setTimeSlotsLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleBookAppointment = async (timeSlot: TimeSlot) => {
    if (!patient) {
      Alert.alert(t('common.error'), t('bookAppointment.loginRequired'));
      return;
    }

    const getBookingMessage = () => {
      const timeText = `at ${formatTime(timeSlot.startTime)}`;
      if (type === 'doctor' && timeSlot.establishment) {
        return t('bookAppointment.bookingConfirmationDoctor', {
          time: timeText,
          establishment: timeSlot.establishment.name
        });
      } else if (type === 'establishment' && timeSlot.practician) {
        return t('bookAppointment.bookingConfirmationEstablishment', {
          time: timeText,
          firstName: timeSlot.practician.user.firstName,
          lastName: timeSlot.practician.user.lastName
        });
      }
      return t('bookAppointment.bookingConfirmationGeneric', { time: timeText });
    };

    Alert.alert(
      t('bookAppointment.title'),
      getBookingMessage(),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bookAppointment.book'),
          onPress: async () => {
            try {
              setBookingLoading(true);
              const appointmentRequest: CreateAppointmentRequest = {
                patientId: patient.id,
                timeSlotId: timeSlot.id,
              };
              
              await apiService.createAppointment(appointmentRequest);
              Alert.alert(t('common.success'), t('bookAppointment.bookingSuccess'), [
                {
                  text: t('common.ok'),
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert(t('common.error'), t('bookAppointment.bookingFailed'));
            } finally {
              setBookingLoading(false);
            }
          },
        },
      ]
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && weekOffset <= 0) {
      // Don't allow going back beyond the current week
      return;
    }
    setWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const getProviderName = () => {
    if (!provider) return '';
    if (type === 'doctor') {
      const doctor = provider as Practician;
      return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
    } else {
      const establishment = provider as Establishment;
      return establishment.name;
    }
  };

  const formatWeekRange = () => {
    if (!currentWeek) return '';
    const start = currentWeek.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = currentWeek.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('bookAppointment.providerNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('bookAppointment.title')}</Text>
          <Text style={styles.headerSubtitle}>{getProviderName()}</Text>
        </View>
      </View>

      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={[styles.weekNavButton, weekOffset <= 0 && styles.weekNavButtonDisabled]}
          onPress={() => navigateWeek('prev')}
          disabled={weekOffset <= 0}
        >
          <ChevronLeft size={20} color={weekOffset <= 0 ? "#9CA3AF" : "#3B82F6"} />
        </TouchableOpacity>
        <Text style={styles.weekRange}>{formatWeekRange()}</Text>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => navigateWeek('next')}
        >
          <ChevronRight size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {timeSlotsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentWeek?.days.map((day, index) => (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={styles.dayNumber}>{day.dayNumber}</Text>
              </View>
              
              <View style={styles.timeSlotsContainer}>
                {day.timeSlots.filter(slot => slot.available).length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {day.timeSlots
                      .filter(slot => slot.available)
                      .map((slot) => (
                        <TouchableOpacity
                          key={slot.id}
                          style={styles.timeSlot}
                          onPress={() => handleBookAppointment(slot)}
                        >
                          <View style={styles.timeSlotContent}>
                            <View style={styles.timeSlotHeader}>
                              <Clock size={14} color="#3B82F6" />
                              <Text style={styles.timeSlotText}>
                                {formatTime(slot.startTime)}
                              </Text>
                            </View>
                            {type === 'doctor' && slot.establishment && (
                              <Text style={styles.timeSlotProvider}>
                                {t('bookAppointment.at')} {slot.establishment.name}
                              </Text>
                            )}
                            {type === 'establishment' && slot.practician && (
                              <Text style={styles.timeSlotProvider}>
                                {t('bookAppointment.with')} Dr. {slot.practician.user.firstName} {slot.practician.user.lastName}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                ) : (
                  <Text style={styles.noSlotsText}>{t('bookAppointment.noAvailableSlots')}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {bookingLoading && (
        <View style={styles.bookingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.bookingText}>{t('bookAppointment.bookingAppointment')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#035AA6',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  weekNavButtonDisabled: {
    opacity: 0.5,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: '#6B7280',
  },
  timeSlotsContainer: {
    minHeight: 40,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: '#E6F3FF',
    borderWidth: 1,
    borderColor: '#035AA6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    width: '48%',
  },
  timeSlotContent: {
    flex: 1,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#035AA6',
    marginLeft: 6,
    fontWeight: '500',
  },
  timeSlotProvider: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    flexWrap: 'wrap',
    lineHeight: 16,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  bookingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
});