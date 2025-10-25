import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'ChangePassword'>;
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import authService from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Kata sandi Anda telah tidak berhasil diperbarui.');

  const validateForm = () => {
    if (!oldPassword.trim()) {
      setErrorMessage('Password lama harus diisi.');
      setShowErrorModal(true);
      return false;
    }
    if (!newPassword.trim()) {
      setErrorMessage('Password baru harus diisi.');
      setShowErrorModal(true);
      return false;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password baru minimal 6 karakter.');
      setShowErrorModal(true);
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak sesuai.');
      setShowErrorModal(true);
      return false;
    }
    if (oldPassword === newPassword) {
      setErrorMessage('Password baru harus berbeda dengan password lama.');
      setShowErrorModal(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrorMessage('User tidak ditemukan. Silakan login kembali.');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Call real Odoo API to change password
      const success = await authService.changePassword(
        user.id,
        oldPassword,
        newPassword
      );
      
      if (success) {
        setShowSuccessModal(true);
        // Clear the form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage('Gagal mengubah password. Silakan coba lagi.');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.message === 'Password lama tidak sesuai') {
        setErrorMessage('Password lama tidak sesuai. Silakan periksa kembali.');
      } else if (error.message.includes('Network')) {
        setErrorMessage('Koneksi jaringan bermasalah. Silakan coba lagi.');
      } else {
        setErrorMessage('Gagal mengubah password. Silakan coba lagi.');
      }
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessOK = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleErrorRetry = () => {
    setShowErrorModal(false);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ganti Password</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Old Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={Colors.text.tertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Password Lama"
              placeholderTextColor={Colors.text.tertiary}
              secureTextEntry={!showOldPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowOldPassword(!showOldPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={Colors.text.tertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Password Baru"
              placeholderTextColor={Colors.text.tertiary}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color={Colors.text.tertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi Password"
              placeholderTextColor={Colors.text.tertiary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.text.white} />
            ) : (
              <Text style={styles.saveButtonText}>Simpan</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Lupa password? </Text>
            <Text style={styles.forgotPasswordLink}>Kirim OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require('../../../assets/mascot-happy.png')}
              style={styles.modalMascot}
              resizeMode="contain"
            />
            <Text style={styles.modalTitle}>Kata Sandi Berhasil Diubah</Text>
            <Text style={styles.modalDescription}>
              Kata sandi Anda telah berhasil diperbarui.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessOK}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require('../../../assets/mascot-sad.png')}
              style={styles.modalMascot}
              resizeMode="contain"
            />
            <Text style={[styles.modalTitle, styles.errorTitle]}>
              Gagal Mengubah Kata Sandi
            </Text>
            <Text style={styles.modalDescription}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleErrorRetry}
            >
              <Text style={styles.modalButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },

  // Form Card
  formCard: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  eyeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  saveButton: {
    backgroundColor: '#1565C0',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    height: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  forgotPasswordLink: {
    fontSize: Typography.fontSize.sm,
    color: '#1565C0',
    fontFamily: Typography.fontFamily.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  modalMascot: {
    width: 150,
    height: 150,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    color: Colors.error.main,
  },
  modalDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});