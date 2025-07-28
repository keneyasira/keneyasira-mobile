import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, User, MapPin, FileText } from 'lucide-react-native';
import { Appointment } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryScreen() {
  const { patient } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointmentHistory();
  }, []);

  const loadAppointmentHistory = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      const data = await apiService.getPatientAppointments(patient.id);
      
      // Filter only past appointments and sort by date descending
      const pastAppointments = data
        .filter(appointment => new Date(appointment.date) < new Date())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAppointments(pastAppointments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'cancelled':
        return '✕';
      case 'no-show':
        return '!';
      default:
        return '?';
    }
  };

  const HistoryCard = ({ appointment }: { appointment: Appointment }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={18} color="#3B82F6" />
          <Text style={styles.dateText}>{formatDate(appointment.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(appointment.status)}</Text>
          <Text style={styles.statusText}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Clock size={16} color="#6B7280" />
        <Text style={styles.timeText}>
          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </Text>
      </View>

      {appointment.practician && (
        <View style={styles.providerContainer}>
          <User size={16} color="#6B7280" />
          <Text style={styles.providerText}>
            Dr. {appointment.practician.firstName} {appointment.practician.lastName}
          </Text>
          <Text style={styles.specialtyText}>
            {appointment.practician.specialty}
          </Text>
        </View>
      )}

      {appointment.establishment && (
        <View style={styles.locationContainer}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.locationText}>
            {appointment.establishment.name}, {appointment.establishment.city}
          </Text>
        </View>
      )}

      {appointment.notes && (
        <View style={styles.notesContainer}>
          <FileText size={16} color="#6B7280" />
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderMonthSection = (appointments: Appointment[]) => {
    const grouped = appointments.reduce((groups: { [key: string]: Appointment[] }, appointment) => {
      const date = new Date(appointment.date);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(appointment);
      return groups;
    }, {});

    return Object.entries(grouped).map(([monthYear, monthAppointments]) => (
      <View key={monthYear}>
        <Text style={styles.monthHeader}>{monthYear}</Text>
        {monthAppointments.map((appointment) => (
          <HistoryCard key={appointment.id} appointment={appointment} />
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointment History</Text>
        <Text style={styles.subtitle}>
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} completed
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={[{ key: 'appointments', appointments }]}
          renderItem={({ item }) => (
            <View style={styles.listContainer}>
              {renderMonthSection(item.appointments)}
            </View>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No appointment history</Text>
              <Text style={styles.emptyText}>
                Your completed appointments will appear here
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    marginRight: 8,
  },
  specialtyText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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