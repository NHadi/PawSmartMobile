import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth/authService';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Username tidak boleh kosong');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Nomor telepon tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number properly
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('0') && !formattedPhone.startsWith('62')) {
        formattedPhone = '0' + formattedPhone;
      }

      // Call API to update user profile in Odoo
      const updatedUser = await authService.updateProfile(user!.id, {
        name: name.trim(),
        phone: formattedPhone,
      });

      // Note: Username (login) cannot be updated in Odoo after creation
      // If username is different, show a message
      if (username.trim() !== user?.username) {
        Alert.alert(
          'Informasi',
          'Username tidak dapat diubah setelah registrasi. Perubahan lainnya telah disimpan.',
          [
            {
              text: 'OK',
              onPress: () => {
                setUser(updatedUser);
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        // Update local state with the response from server
        setUser(updatedUser);
        
        Alert.alert(
          'Berhasil',
          'Profile berhasil diperbarui',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Error', 
        error.message || 'Gagal memperbarui profile. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Coming Soon', 'Fitur ganti foto profile akan segera tersedia');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangeAvatar}
          >
            <Image
              source={require('../../../assets/mascot-happy.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={16} color={Colors.text.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nama Lengkap"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          {/* Username Input - Read Only */}
          <View style={[styles.inputContainer, styles.readOnlyContainer]}>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="none"
              editable={false}
            />
            <Ionicons name="lock-closed-outline" size={18} color={Colors.text.tertiary} />
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.phonePrefix}>+62</Text>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={phone.replace('+62', '').replace('62', '')}
              onChangeText={(text) => {
                // Only allow numbers
                const cleanedText = text.replace(/[^0-9]/g, '');
                setPhone(cleanedText);
              }}
              placeholder="8123456789"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>
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

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
    paddingHorizontal: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing.xl * 2,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatar: {
    width: 90,
    height: 90,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  form: {
    marginTop: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 56,
    elevation: 1,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    height: '100%',
  },
  phonePrefix: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  phoneInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl * 2,
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
  bottomSpacing: {
    height: 100,
  },
  readOnlyContainer: {
    backgroundColor: Colors.background.secondary,
  },
  readOnlyInput: {
    color: Colors.text.secondary,
  },
});