import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, User } from 'lucide-react-native';
import { Appointment } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const { patient } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      const data = await apiService.getPatientAppointments(patient.id);
      console.log('Appointments data:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.timeslot.date);
      return activeTab === 'upcoming' 
        ? appointmentDate >= now 
        : appointmentDate < now;
    }).sort((a, b) => {
      const dateA = new Date(a.timeslot.date);
      const dateB = new Date(b.timeslot.date);
      return activeTab === 'upcoming' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'no-show':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#3B82F6" />
            <Text style={styles.dateText}>{formatDate(appointment.timeslot.date)}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.timeText}>
              {formatTime(appointment.timeslot.startTime)} - {formatTime(appointment.timeslot.endTime)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.appointmentStatus.name) }]}>
          <Text style={styles.statusText}>
            {appointment.appointmentStatus.name.charAt(0).toUpperCase() + appointment.appointmentStatus.name.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        {appointment.practician && (
          <View style={styles.providerContainer}>
            <User size={16} color="#6B7280" />
            <Text style={styles.providerName}>
              Dr. {appointment.practician.user.firstName} {appointment.practician.user.lastName}
            </Text>
          </View>
        )}
        {appointment.establishment && (
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.locationText}>{appointment.establishment.name}</Text>
          </View>
        )}
      </View>

      {activeTab === 'upcoming' && (appointment.appointmentStatus.name === 'scheduled' || appointment.appointmentStatus.name === 'confirmed') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelAppointment(appointment.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelAppointment(appointmentId);
              await loadAppointments();
              Alert.alert('Success', 'Appointment cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'upcoming' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive,
              ]}
            >
              Upcoming ({appointments.filter(a => new Date(a.timeslot.date) >= new Date() && (a.appointmentStatus.name === 'scheduled' || a.appointmentStatus.name === 'confirmed')).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'past' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'past' && styles.tabTextActive,
              ]}
            >
              Past ({appointments.filter(a => new Date(a.timeslot.date) < new Date() || a.appointmentStatus.name === 'completed' || a.appointmentStatus.name === 'cancelled' || a.appointmentStatus.name === 'no-show').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                No {activeTab} appointments
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'Book your first appointment to get started'
                  : 'Your appointment history will appear here'}
              </Text>
            </View>
          }
        />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});