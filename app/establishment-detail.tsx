import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Mail, Building2, Users, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Establishment, Practician } from '@/types/api';
import { apiService } from '@/services/api';
import { useTranslation } from 'react-i18next';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function EstablishmentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [practicians, setPracticians] = useState<Practician[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiciansLoading, setPracticiansLoading] = useState(false);
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    if (id) {
      loadEstablishmentDetails();
    }
  }, [id]);

  useEffect(() => {
    if (establishment) {
      loadPracticians();
    }
  }, [establishment]);

  const loadEstablishmentDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEstablishmentById(id);
      setEstablishment(data);
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('establishmentDetail.loadFailed'),
        type: 'error',
      });
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
      setPracticians(response);
    } catch (error) {
      console.error('Failed to load practicians:', error);
      setPracticians([]);
    } finally {
      setPracticiansLoading(false);
    }
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
          {practician.specialties.map(s => t(`specialties.${s.name}`, s.name)).join(', ')}
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
         <Text style={styles.errorText}>{t('establishmentDetail.establishmentNotFound')}</Text>
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
        <Text style={styles.headerTitle}>{t('establishmentDetail.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.establishmentIcon}>
            <Building2 size={48} color="#3B82F6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.establishmentName}>{establishment.name}</Text>
            <Text style={styles.establishmentType}>
              {t(`establishmentTypes.${establishment.type.name}`, establishment.type.name)} • {t(`establishmentAffiliations.${establishment.affiliation.name}`, establishment.affiliation.name)}
            </Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.location}>{establishment.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('establishmentDetail.information')}</Text>
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
          <Text style={styles.sectionTitle}>{t('establishmentDetail.specialties')}</Text>
          <View style={styles.specialtiesContainer}>
            {establishment.specialties.map((specialty) => (
              <View key={specialty.id} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{t(`specialties.${specialty.name}`, specialty.name)}</Text>
              </View>
            ))}
          </View>
        </View>

        {establishment.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>{t('establishmentDetail.description')}</Text>
            <Text style={styles.descriptionText}>{establishment.description}</Text>
          </View>
        )}

        <View style={styles.practiciansCard}>
          <Text style={styles.sectionTitle}>
            {t('establishmentDetail.doctors', { count: practicians.length })}
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
                    {t('establishmentDetail.viewAllDoctors', { count: practicians.length })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noPracticiansText}>{t('establishmentDetail.noDoctorsAvailable')}</Text>
          )}
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>{t('establishmentDetail.about')}</Text>
          <Text style={styles.aboutText}>
            {t('establishmentDetail.aboutDescription', {
              name: establishment.name,
              type: t(`establishmentTypes.${establishment.type.name}`, establishment.type.name).toLowerCase(),
              affiliation: t(`establishmentAffiliations.${establishment.affiliation.name}`, establishment.affiliation.name),
              specialties: establishment.specialties.map(s => t(`specialties.${s.name}`, s.name)).join(', ')
            })}
          </Text>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={styles.bookAppointmentButton}
        onPress={() => router.push(`/book-appointment?type=establishment&id=${establishment.id}`)}
      >
        <Calendar size={20} color="#FFFFFF" />
        <Text style={styles.bookAppointmentButtonText}>{t('establishmentDetail.bookAppointment')}</Text>
      </TouchableOpacity>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    color: '#035AA6',
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
  aboutCard: {
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
  aboutText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  bookAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#035AA6',
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