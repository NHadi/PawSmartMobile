import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackScreenProps } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import authService from '../../services/auth/authService';

export default function ForgotPasswordScreen({ navigation }: AuthStackScreenProps<'ForgotPassword'>) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Masukkan nomor HP yang terdaftar');
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if phone number is registered
      const isRegistered = await authService.checkPhoneNumberRegistered(phoneNumber.trim());
      
      if (!isRegistered) {
        Alert.alert(
          'Nomor Tidak Terdaftar',
          'Nomor HP yang Anda masukkan tidak terdaftar. Silakan daftar akun baru atau gunakan nomor yang sudah terdaftar.',
          [
            { text: 'Daftar', onPress: () => navigation.navigate('Register') },
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }
      
      // Navigate to OTP screen for forgot password verification
      navigation.navigate('OTP', {
        phoneNumber: phoneNumber.trim(),
        mode: 'forgot-password',
      });
    } catch (error: any) {
      Alert.alert(
        'Gagal Mengirim Kode',
        'Terjadi kesalahan saat mengirim kode. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Lupa Password</Text>
          </TouchableOpacity>

          <View style={styles.header}>

            <Image
              source={require('../../../assets/Bingung Maskot.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <View style={styles.formCard}>
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              bounces={false}
              contentContainerStyle={styles.formScrollContent}
            >
              {/* Instructions */}
              <Text style={styles.instructionText}>
                Masukkan nomor HP yang terdaftar. Kami akan mengirimkan Kode Otp melalui WhatsApp untuk mengatur ulang kata sandi Anda.
              </Text>

              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={24} color="#16A6D9" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Masukkan No WhatsApp"
                    placeholderTextColor="#999999"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Send Button */}
              <TouchableOpacity 
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
                onPress={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendButtonText}>Kirim</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <View style={styles.backToLoginContainer}>
                <Text style={styles.backToLoginText}>Belum punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.backToLoginLink}>Daftar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A6D9',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 166, 217, 0.85)',
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 5,
  },
 backButton: {
    marginBottom: 10,
    marginLeft: 20,
	flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
},
backButtonText: {
	color: '#FFFFFF',
	fontSize: 24,
	marginLeft: 8,
	fontFamily: Typography.fontFamily.semibold,
},
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  mascot: {
    width: 235,
    height: 235,
    marginBottom: -100,
    zIndex: 15,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '36%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
  },
  formScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#333333',
  },
  inputIcon: {
    marginLeft: 12,
  },
  sendButton: {
    backgroundColor: '#16A6D9',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#16A6D9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
  },
  sendButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666666',
  },
  backToLoginLink: {
    fontSize: 14,
    color: '#16A6D9',
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
});