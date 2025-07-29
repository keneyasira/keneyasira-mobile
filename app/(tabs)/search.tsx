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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, Building2, ChevronDown, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Practician, Establishment } from '@/types/api';
import { apiService } from '@/services/api';

interface Specialty {
  id: string;
  name: string;
}

interface SearchResult {
  type: 'doctor' | 'establishment';
  data: Practician | Establishment;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2 || selectedSpecialty) {
      const delayTimer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(delayTimer);
    } else {
      setResults([]);
    }
  }, [searchQuery, selectedSpecialty]);

  const loadSpecialties = async () => {
    try {
      setSpecialtiesLoading(true);
      const response = await apiService.getSpecialties();
      setSpecialties(response);
    } catch (error) {
      console.error('Failed to load specialties:', error);
    } finally {
      setSpecialtiesLoading(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchFilters = {
        ...(searchQuery && { name_search: searchQuery }),
        ...(selectedSpecialty && { specialty: selectedSpecialty.name }),
      };

      // Search both doctors and establishments in parallel
      const [doctorsResponse, establishmentsResponse] = await Promise.all([
        apiService.searchPracticians(searchFilters),
        apiService.searchEstablishments(searchFilters),
      ]);

      // Combine results
      const combinedResults: SearchResult[] = [
        ...doctorsResponse.data.map((doctor: Practician) => ({
          type: 'doctor' as const,
          data: doctor,
        })),
        ...establishmentsResponse.data.map((establishment: Establishment) => ({
          type: 'establishment' as const,
          data: establishment,
        })),
      ];

      setResults(combinedResults);
    } catch (error) {
      console.log(error.message);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSpecialtyFilter = () => {
    setSelectedSpecialty(null);
    setShowSpecialtyDropdown(false);
  };

  const DoctorCard = ({ doctor }: { doctor: Practician }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/doctor-detail?id=${doctor.id}`)}
    >
      <View style={styles.cardContent}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=200',
          }}
          style={styles.doctorImage}
        />
        <View style={styles.doctorInfo}>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>Doctor</Text>
          </View>
          <Text style={styles.doctorName}>
            Dr. {doctor.user.firstName} {doctor.user.lastName}
          </Text>
          <Text style={styles.specialty}>
            {doctor.specialties.map(s => s.name).join(', ')}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.location}>Location not available</Text>
          </View>
          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" />
            <Text style={styles.rating}>Not rated</Text>
          </View>
        </View>
        <Text style={styles.fee}>Contact for pricing</Text>
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
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>Establishment</Text>
          </View>
          <Text style={styles.establishmentName}>{establishment.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.location}>{establishment.city}</Text>
          </View>
          <Text style={styles.specialties}>
            {establishment.specialties.map(s => s.name).join(', ')}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" />
            <Text style={styles.rating}>Not rated</Text>
          </View>
          <Text style={styles.establishmentType}>
            {establishment.type.name} • {establishment.affiliation.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    if (item.type === 'doctor') {
      return <DoctorCard doctor={item.data as Practician} />;
    } else {
      return <EstablishmentCard establishment={item.data as Establishment} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Healthcare</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors or establishments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.specialtyDropdown}
            onPress={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
          >
            <Text style={styles.specialtyDropdownText}>
              {selectedSpecialty ? selectedSpecialty.name : 'All Specialties'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {selectedSpecialty && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearSpecialtyFilter}
            >
              <X size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {showSpecialtyDropdown && (
          <View style={styles.dropdownContainer}>
            {specialtiesLoading ? (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : (
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSpecialty(null);
                    setShowSpecialtyDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    !selectedSpecialty && styles.dropdownItemTextSelected
                  ]}>
                    All Specialties
                  </Text>
                </TouchableOpacity>
                {specialties.map((specialty) => (
                  <TouchableOpacity
                    key={specialty.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedSpecialty(specialty);
                      setShowSpecialtyDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedSpecialty?.id === specialty.id && styles.dropdownItemTextSelected
                    ]}>
                      {specialty.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderSearchResult}
            keyExtractor={(item, index) => `${item.type}-${(item.data as any).id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              searchQuery.length >= 2 || selectedSpecialty ? (
                <View style={styles.emptyContainer}>
                  <Search size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search terms or filters
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Search size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>Start searching</Text>
                  <Text style={styles.emptyText}>
                    Enter at least 2 characters or select a specialty to search
                  </Text>
                </View>
              )
            }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  specialtyDropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  clearFilterButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownLoading: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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
  typeIndicator: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
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
  establishmentType: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
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