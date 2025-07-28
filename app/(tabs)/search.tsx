import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Practician, Establishment } from '@/types/api';
import { apiService } from '@/services/api';

type SearchType = 'doctors' | 'establishments';

export default function SearchScreen() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<SearchType>('doctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Practician[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayTimer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(delayTimer);
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    setLoading(true);
    try {
      if (searchType === 'doctors') {
        const results = await apiService.searchPracticians({ name_search: searchQuery });
        console.log('RESULTS', results);
        setDoctors(results);
      } else {
        const results = await apiService.searchEstablishments({ name_search: searchQuery });
        setEstablishments(results);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DoctorCard = ({ doctor }: { doctor: Practician }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/doctor-detail?id=${doctor.id}`)}
    >
      <View style={styles.cardContent}>
        <Image
          source={{
            uri: doctor.profileImage || 'https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=200',
          }}
          style={styles.doctorImage}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>
            Dr. {doctor.user.firstName} {doctor.user.lastName}
          </Text>
          <Text style={styles.specialty}>{doctor.specialt}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.location}>{doctor.city}</Text>
          </View>
          {doctor.rating && (
            <View style={styles.ratingRow}>
              <Star size={14} color="#F59E0B" />
              <Text style={styles.rating}>{doctor.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {doctor.consultationFee && (
          <Text style={styles.fee}>${doctor.consultationFee}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const EstablishmentCard = ({ establishment }: { establishment: Establishment }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/establishment-detail?id=${establishment.id}`)}
    >
      <View style={styles.cardContent}>
        <View style={styles.establishmentIcon}>
          <Building2 size={32} color="#3B82F6" />
        </View>
        <View style={styles.establishmentInfo}>
          <Text style={styles.establishmentName}>{establishment.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.location}>{establishment.city}</Text>
          </View>
          <Text style={styles.specialties}>
            {establishment.specialties.join(', ')}
          </Text>
          {establishment.rating && (
            <View style={styles.ratingRow}>
              <Star size={14} color="#F59E0B" />
              <Text style={styles.rating}>{establishment.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Healthcare</Text>
        
        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'doctors' && styles.searchTypeButtonActive,
            ]}
            onPress={() => setSearchType('doctors')}
          >
            <Text
              style={[
                styles.searchTypeText,
                searchType === 'doctors' && styles.searchTypeTextActive,
              ]}
            >
              Doctors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'establishments' && styles.searchTypeButtonActive,
            ]}
            onPress={() => setSearchType('establishments')}
          >
            <Text
              style={[
                styles.searchTypeText,
                searchType === 'establishments' && styles.searchTypeTextActive,
              ]}
            >
              Establishments
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${searchType}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={searchType === 'doctors' ? doctors : establishments}
            renderItem={({ item }) =>
              searchType === 'doctors' ? (
                <DoctorCard doctor={item as Practician} />
              ) : (
                <EstablishmentCard establishment={item as Establishment} />
              )
            }
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
    marginBottom: 20,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  searchTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  searchTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  searchTypeTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  fee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  establishmentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  establishmentInfo: {
    flex: 1,
  },
  establishmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  specialties: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});