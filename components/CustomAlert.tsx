import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onDismiss,
}: CustomAlertProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color="#10B981" />;
      case 'error':
        return <XCircle size={32} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={32} color="#F59E0B" />;
      default:
        return <Info size={32} color="#3B82F6" />;
    }
  };

  const getIconBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#ECFDF5';
      case 'error':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      default:
        return '#EBF8FF';
    }
  };

  const defaultButtons: AlertButton[] = buttons.length > 0 ? buttons : [
    { text: t('common.ok'), onPress: onDismiss }
  ];

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.alertBox}>
            <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
              {getIcon()}
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {defaultButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    defaultButtons.length === 1 && styles.singleButton,
                    index === 0 && defaultButtons.length > 1 && styles.firstButton,
                    index === defaultButtons.length - 1 && defaultButtons.length > 1 && styles.lastButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: screenWidth - 40,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#035AA6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  singleButton: {
    minWidth: 120,
  },
  firstButton: {
    marginRight: 6,
  },
  lastButton: {
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});