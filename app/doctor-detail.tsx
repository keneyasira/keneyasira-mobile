import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Phone, Mail, Calendar, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Practician, TimeSlot, CreateAppointmentRequest } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DoctorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { patient } = useAuth();
  const [doctor, setDoctor] = useState<Practician | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      loadDoctorDetails();
    }
  }, [id]);

  useEffect(() => {
    if (doctor) {
      loadTimeSlots();
    }
  }, [doctor, selectedDate]);

  const loadDoctorDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPracticianById(id);
      setDoctor(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctor details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!doctor) return;

    try {
      setTimeSlotsLoading(true);
      const data = await apiService.getPracticianTimeSlots(doctor.id, selectedDate);
      setTimeSlots(data);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      setTimeSlots([]);
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
      Alert.alert('Error', 'Please log in to book an appointment');
      return;
    }

    Alert.alert(
      'Book Appointment',
      `Would you like to book an appointment at ${formatTime(timeSlot.startTime)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book',
          onPress: async () => {
            try {
              setBookingLoading(true);
              const appointmentRequest: CreateAppointmentRequest = {
                patientId: patient.id,
                timeSlotId: timeSlot.id,
              };
              
              await apiService.createAppointment(appointmentRequest);
              Alert.alert('Success', 'Appointment booked successfully!');
              
              // Refresh time slots to show updated availability
              await loadTimeSlots();
            } catch (error) {
              Alert.alert('Error', 'Failed to book appointment. Please try again.');
            } finally {
              setBookingLoading(false);
            }
          },
        },
      ]
    );
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

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
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
        <Text style={styles.headerTitle}>Doctor Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=300',
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.doctorName}>
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </Text>
            <Text style={styles.specialty}>
              {doctor.specialties.map(s => s.name).join(', ')}
            </Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.rating}>Not rated</Text>
            </View>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Phone size={18} color="#6B7280" />
            <Text style={styles.contactText}>{doctor.user.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Mail size={18} color="#6B7280" />
            <Text style={styles.contactText}>{doctor.user.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <MapPin size={18} color="#6B7280" />
            <Text style={styles.contactText}>Location not available</Text>
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <Text style={styles.dateText}>Date: {selectedDate}</Text>
          
          {timeSlotsLoading ? (
            <View style={styles.timeSlotsLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : timeSlots.length > 0 ? (
            <View style={styles.timeSlotsContainer}>
              {timeSlots
                .filter(slot => slot.isAvailable)
                .map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={styles.timeSlot}
                    onPress={() => handleBookAppointment(slot)}
                  >
                    <Clock size={16} color="#3B82F6" />
                    <Text style={styles.timeSlotText}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>No available time slots for this date</Text>
          )}
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Dr. {doctor.user.firstName} {doctor.user.lastName} is a qualified healthcare professional 
            specializing in {doctor.specialties.map(s => s.name).join(', ')}. 
            With years of experience in the medical field, they are committed to providing 
            excellent patient care and treatment.
          </Text>
        </View>
      </ScrollView>
      
      {bookingLoading && (
        <View style={styles.bookingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.bookingText}>Booking appointment...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.bookAppointmentButton}
        onPress={() => router.push(`/book-appointment?type=doctor&id=${doctor.id}`)}
      >
        <Calendar size={20} color="#FFFFFF" />
        <Text style={styles.bookAppointmentButtonText}>Book Appointment</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  specialty: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  timeSlotsLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 6,
    fontWeight: '500',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aboutText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
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
  bookAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    margin: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  bookAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});