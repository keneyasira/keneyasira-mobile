import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { patient, logout, updatePatient } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: patient?.user.firstName || '',
    lastName: patient?.user.lastName || '',
    phone: patient?.user.phone || '',
    birthDate: patient?.birthDate || '',
    address: '[DOES NOT EXIST]',
    city: '[DOES NOT EXIST]',
  });

  const handleSave = async () => {
    try {
      await updatePatient(patient.id, formData);
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.profileUpdateFailed'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('profile.notProvided');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('profile.unableToLoad')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <Save size={20} color="#035AA6" />
          ) : (
            <Edit size={20} color="#035AA6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LanguageSelector />
        
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#3B82F6" />
            </View>
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={styles.patientEmail}>{patient.email}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.firstName')}</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  editable={isEditing}
                  placeholder={t('profile.firstNamePlaceholder')}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.lastName')}</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  editable={isEditing}
                  placeholder={t('profile.lastNamePlaceholder')}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.email')}</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={patient.email}
                  editable={false}
                  placeholder={t('profile.email')}
                />
              </View>
              <Text style={styles.inputNote}>{t('profile.emailCannotChange')}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.phone')}</Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  editable={isEditing}
                  placeholder={t('profile.phonePlaceholder')}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.address')}</Text>
              <View style={styles.inputContainer}>
                <MapPin size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  editable={isEditing}
                  placeholder={t('profile.addressPlaceholder')}
                  multiline
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.city')}</Text>
              <View style={styles.inputContainer}>
                <MapPin size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  editable={isEditing}
                  placeholder={t('profile.cityPlaceholder')}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.dateOfBirth')}</Text>
              <View style={styles.inputContainer}>
                <Calendar size={18} color="#6B7280" />
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formatDate(formData.birthDate)}
                  editable={false}
                  placeholder={t('profile.dateOfBirth')}
                />
              </View>
            </View>
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountInfoTitle}>{t('profile.accountInformation')}</Text>
            <Text style={styles.accountInfoText}>
              {t('profile.memberSince', { date: formatDate(patient.createdAt) })}
            </Text>
            <Text style={styles.accountInfoText}>
              {t('profile.lastUpdated', { date: formatDate(patient.updatedAt) })}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  inputNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  accountInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  accountInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 40,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
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
});