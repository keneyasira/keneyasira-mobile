import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Phone, Mail, Building2, Users, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Establishment, Practician, TimeSlot, CreateAppointmentRequest } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function EstablishmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { patient } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [practicians, setPracticians] = useState<Practician[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiciansLoading, setPracticiansLoading] = useState(false);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      loadEstablishmentDetails();
    }
  }, [id]);

  useEffect(() => {
    if (establishment) {
      loadPracticians();
      loadTimeSlots();
    }
  }, [establishment, selectedDate]);

  const loadEstablishmentDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEstablishmentById(id);
      setEstablishment(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load establishment details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadPracticians = async () => {
    if (!establishment) return;

    try {
      setPracticiansLoading(true);
      const response = await apiService.getEstablishmentPracticians(establishment.id);
      console.log(response);
      setPracticians(response.data);
    } catch (error) {
      console.error('Failed to load practicians:', error);
      setPracticians([]);
    } finally {
      setPracticiansLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!establishment) return;

    try {
      setTimeSlotsLoading(true);
      const response = await apiService.getEstablishmentTimeSlots(establishment.id, selectedDate);
      setTimeSlots(response.data);
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

  const PracticianCard = ({ practician }: { practician: Practician }) => (
    <TouchableOpacity
      style={styles.practicianCard}
      onPress={() => router.push(`/doctor-detail?id=${practician.id}`)}
    >
      <View style={styles.practicianInfo}>
        <Text style={styles.practicianName}>
          Dr. {practician.user.firstName} {practician.user.lastName}
        </Text>
        <Text style={styles.practicianSpecialty}>
          {practician.specialties.map(s => s.name).join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!establishment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Establishment not found</Text>
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
        <Text style={styles.headerTitle}>Establishment Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.establishmentIcon}>
            <Building2 size={48} color="#3B82F6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.establishmentName}>{establishment.name}</Text>
            <Text style={styles.establishmentType}>
              {establishment.type.name} • {establishment.affiliation.name}
            </Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.location}>{establishment.city}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.rating}>Not rated</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoItem}>
            <MapPin size={18} color="#6B7280" />
            <Text style={styles.infoText}>{establishment.address}</Text>
          </View>
          {establishment.phone && (
            <View style={styles.infoItem}>
              <Phone size={18} color="#6B7280" />
              <Text style={styles.infoText}>{establishment.phone}</Text>
            </View>
          )}
          {establishment.email && (
            <View style={styles.infoItem}>
              <Mail size={18} color="#6B7280" />
              <Text style={styles.infoText}>{establishment.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.specialtiesCard}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {establishment.specialties.map((specialty) => (
              <View key={specialty.id} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {establishment.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{establishment.description}</Text>
          </View>
        )}

        <View style={styles.practiciansCard}>
          <Text style={styles.sectionTitle}>
            Doctors ({practicians.length})
          </Text>
          {practiciansLoading ? (
            <View style={styles.practiciansLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : practicians.length > 0 ? (
            <View>
              {practicians.slice(0, 3).map((practician) => (
                <PracticianCard key={practician.id} practician={practician} />
              ))}
              {practicians.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>
                    View all {practicians.length} doctors
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noPracticiansText}>No doctors available</Text>
          )}
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
                .slice(0, 6)
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
      </ScrollView>
      
      {bookingLoading && (
        <View style={styles.bookingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.bookingText}>Booking appointment...</Text>
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
  headerTitle: {
    fontSize: 20,
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
  establishmentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  establishmentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  establishmentType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
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
  infoCard: {
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  specialtiesCard: {
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
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialtyText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  descriptionCard: {
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
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  practiciansCard: {
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
  practiciansLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  practicianCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  practicianInfo: {
    flex: 1,
  },
  practicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  practicianSpecialty: {
    fontSize: 14,
    color: '#3B82F6',
  },
  noPracticiansText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  availabilityCard: {
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