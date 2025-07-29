import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LogIn, Globe, Stethoscope } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleDoctorPortal = async () => {
    const url = 'https://keneyasira.com';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('landing.cannotOpenLink'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('landing.cannotOpenLink'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              <Text style={styles.logoMainBlue}>KENEYA </Text>
              <Text style={styles.logoAccentBlue}>SIRA</Text>
            </Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>{t('landing.welcomeSubtitle')}</Text>
        </View>

        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <View style={styles.doctorIconsContainer}>
              <View style={styles.doctorIcon}>
                <Stethoscope size={40} color="#035AA6" />
              </View>
              <View style={styles.doctorIcon}>
                <Stethoscope size={40} color="#38BDF2" />
              </View>
            </View>
            <Text style={styles.heroText}>{t('landing.heroText')}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Calendar size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('landing.bookAppointment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <LogIn size={20} color="#035AA6" />
            <Text style={styles.secondaryButtonText}>{t('landing.logIn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Doctor Portal Link */}
        <View style={styles.doctorPortalSection}>
          <Text style={styles.doctorPortalText}>{t('landing.doctorPortalText')}</Text>
          <TouchableOpacity
            style={styles.doctorPortalButton}
            onPress={handleDoctorPortal}
          >
            <Globe size={16} color="#035AA6" />
            <Text style={styles.doctorPortalButtonText}>{t('landing.visitDoctorPortal')}</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSection}>
          <LanguageSelector compact showLabel={false} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('landing.footerText')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoMainBlue: {
    color: '#035AA6',
  },
  logoAccentBlue: {
    color: '#38BDF2',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  heroImageContainer: {
    alignItems: 'center',
  },
  doctorIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  doctorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  actionsSection: {
    paddingVertical: 20,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#035AA6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#035AA6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#035AA6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#035AA6',
    marginLeft: 12,
  },
  doctorPortalSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  doctorPortalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  doctorPortalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  doctorPortalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#035AA6',
    marginLeft: 8,
  },
  languageSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});