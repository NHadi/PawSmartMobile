import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth/authService';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'OTP'>;
type RoutePropType = RouteProp<AuthStackParamList, 'OTP'>;

export default function OTPVerificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { login } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const otpInputs = useRef<(TextInput | null)[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const phoneNumber = route.params?.phoneNumber || '';
  const registrationData = route.params?.registrationData;
  const mode = route.params?.mode || 'register';

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    // Send initial OTP via WhatsApp when screen loads (without alert)
    const sendInitialOTP = async () => {
      try {
        // Generate and send OTP
        const otpCode = await authService.generateOTP(phoneNumber);
        
        // The OTP is now automatically sent via WhatsApp service
        console.log(`=================================`);
        console.log(`OTP sent to WhatsApp ${phoneNumber}`);
        console.log(`OTP Code (for testing): ${otpCode}`);
        console.log(`=================================`);
      } catch (error) {
        console.error('Failed to send initial OTP:', error);
        // Show alert if initial OTP sending fails
        Alert.alert(
          'Gagal Mengirim OTP',
          'Tidak dapat mengirim kode OTP. Silakan periksa koneksi internet Anda dan coba lagi.',
          [
            { text: 'Coba Lagi', onPress: () => sendInitialOTP() },
            { text: 'Kembali', onPress: () => navigation.goBack() }
          ]
        );
      }
    };
    
    sendInitialOTP();

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const showAnimatedModal = (type: 'success' | 'error') => {
    // Reset animation values before showing
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    
    const setModalVisible = type === 'success' ? setShowSuccessModal : setShowErrorModal;
    setModalVisible(true);

    // Animate bottom sheet
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  };

  const resetAnimation = () => {
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
  };

  const verifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    try {
      // Call API to verify OTP
      const response = await authService.verifyOTP({
        phoneNumber,
        otp: otpCode,
        registrationData,
      });

      if (response.success) {
        // For registration, user is created in Odoo after OTP verification
        // The login happens in the success modal button press
        showAnimatedModal('success');
      } else {
        // Show error and reset for retry
        console.log('OTP verification failed:', response.message);
        showAnimatedModal('error');
        // Reset OTP inputs after showing modal
        setTimeout(() => {
          setOtp(['', '', '', '']);
          setIsLoading(false);
          otpInputs.current[0]?.focus();
        }, 300);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showAnimatedModal('error');
      // Reset OTP inputs after showing modal
      setTimeout(() => {
        setOtp(['', '', '', '']);
        setIsLoading(false);
        otpInputs.current[0]?.focus();
      }, 300);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      // Send OTP via WhatsApp
      await sendWhatsAppOTP();
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
      
      Alert.alert(
        'OTP Terkirim',
        'Kode OTP baru telah dikirim ke WhatsApp Anda',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Gagal Mengirim OTP',
        'Terjadi kesalahan saat mengirim ulang OTP. Silakan coba lagi.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const sendWhatsAppOTP = async () => {
    try {
      // Generate and send OTP
      const otpCode = await authService.generateOTP(phoneNumber);
      
      // OTP is automatically sent via WhatsApp service
      console.log(`=================================`);
      console.log(`Resent OTP to WhatsApp ${phoneNumber}`);
      console.log(`OTP Code (for testing): ${otpCode}`);
      console.log(`=================================`);
      
      // Show notification that OTP was sent
      Alert.alert(
        'OTP Terkirim',
        `Kode OTP telah dikirim ke WhatsApp ${phoneNumber}. Silakan periksa pesan Anda.`,
        [{ text: 'OK' }]
      );
      
      return otpCode;
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OTP</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Masukkan Kode OTP</Text>
            <Text style={styles.subtitle}>
              Kami telah mengirimkan kode ke{`\n`}WhatsApp Anda, silakan periksa dan{`\n`}masukkan kodenya
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <TextInput
                  ref={(ref) => (otpInputs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              </View>
            ))}
          </View>

          {/* Timer */}
          <Text style={styles.timerText}>
            Kirim ulang dalam ({formatTime(timer)})
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLoading || otp.some(d => !d)) && styles.buttonDisabled
            ]}
            onPress={() => verifyOTP(otp.join(''))}
            disabled={isLoading || otp.some(d => !d)}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Kirim</Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          {canResend && (
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Tidak menerima kode? </Text>
              <TouchableOpacity 
                onPress={handleResendOTP}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#16A6D9" />
                ) : (
                  <Text style={styles.resendLink}>Kirim ulang</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => {}}
          />
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.bottomSheetHandle} />
            <Image
              source={require('../../../assets/Confirm Maskot.png')}
              style={styles.bottomSheetMascot}
              resizeMode="contain"
            />
            <Text style={styles.bottomSheetTitle}>Pendaftaran Berhasil!</Text>
            <Text style={styles.bottomSheetMessage}>
              Sekarang anda bisa menikmati layanan dan{`\n`}melanjutkan belanja
            </Text>
            <TouchableOpacity
              style={styles.bottomSheetButton}
              onPress={async () => {
                setShowSuccessModal(false);
                resetAnimation();
                if (mode === 'forgot-password') {
                  navigation.navigate('ResetPassword', { phoneNumber });
                } else if (registrationData) {
                  // User has been created in Odoo, now login
                  try {
                    await login(registrationData.username, registrationData.password);
                    // Navigation will happen automatically via AuthContext
                  } catch (error) {
                    console.error('Auto-login failed after registration:', error);
                    // If auto-login fails, check which stack we're in
                    const routes = navigation.getState()?.routes;
                    const isInProfileStack = routes?.some((r: any) => r.name === 'ProfileHome' || r.name === 'ChangePassword');
                    
                    if (isInProfileStack) {
                      // If in profile stack, go to ProfileHome
                      navigation.navigate('ProfileHome');
                    } else {
                      // If in auth stack, go to Login
                      navigation.navigate('Login');
                    }
                  }
                }
              }}
            >
              <Text style={styles.bottomSheetButtonText}>Lanjutkan belanja</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => {}}
          />
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.bottomSheetHandle} />
            <Image
              source={require('../../../assets/Sad Maskot.png')}
              style={styles.bottomSheetMascot}
              resizeMode="contain"
            />
            <Text style={styles.bottomSheetTitle}>
              {mode === 'forgot-password' ? 'Verifikasi Gagal!' : 'Pendaftaran Gagal!'}
            </Text>
            <Text style={styles.bottomSheetMessage}>
              {mode === 'forgot-password' 
                ? 'Kode OTP tidak valid. Silakan coba lagi.'
                : 'Coba kembali atau gunakan metode{`\n`}pendaftaran yang berbeda'}
            </Text>
            <TouchableOpacity
              style={styles.bottomSheetButton}
              onPress={() => {
                resetAnimation();
                setShowErrorModal(false);
                setOtp(['', '', '', '']);
                setIsLoading(false);
                setTimeout(() => {
                  otpInputs.current[0]?.focus();
                }, 100);
              }}
            >
              <Text style={styles.bottomSheetButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.semibold,
    color: '#000000',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpInputWrapper: {
    marginHorizontal: 8,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: Typography.fontFamily.semibold,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#FF1493',
    borderWidth: 2,
  },
  timerText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#16A6D9',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#16A6D9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
  },
  resendLink: {
    fontSize: 14,
    color: '#16A6D9',
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
  },
  bottomSheetMascot: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: '#16A6D9',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomSheetMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bottomSheetButton: {
    backgroundColor: '#16A6D9',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  bottomSheetButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});