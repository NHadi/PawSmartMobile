import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPet'>;

interface PetFormData {
  name: string;
  type: string | null;
  photo: string | null;
}

export default function AddPetStepOneScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    type: null,
    photo: null,
  });
  const [showTypeModal, setShowTypeModal] = useState(false);

  const petTypes = [
    { key: 'Anjing', label: 'Anjing', icon: '🐕' },
    { key: 'Kucing', label: 'Kucing', icon: '🐱' },
    { key: 'Burung', label: 'Burung', icon: '🐦' },
    { key: 'Reptil', label: 'Reptil', icon: '🦎' },
    { key: 'Lainnya', label: 'Lainnya', icon: '🐾' },
  ];

  const handlePhotoUpload = async () => {
    Alert.alert(
      'Pilih Foto',
      'Pilih sumber foto untuk peliharaan Anda',
      [
        {
          text: 'Kamera',
          onPress: () => pickImageFromCamera(),
        },
        {
          text: 'Galeri',
          onPress: () => pickImageFromGallery(),
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ],
    );
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses ke kamera untuk mengambil foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, photo: result.assets[0].uri });
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses ke galeri untuk memilih foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, photo: result.assets[0].uri });
    }
  };

  const handleContinue = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Nama hewan harus diisi');
      return;
    }
    if (!formData.type) {
      Alert.alert('Error', 'Jenis hewan harus dipilih');
      return;
    }
    
    navigation.navigate('AddPetStepTwo', { stepOneData: formData });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Peliharaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Lengkapi Data Diri</Text>
        <Text style={styles.progressStep}>1/3</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Hewan Peliharaan Kamu,</Text>
          <Text style={styles.title}>Siapa Saja Yang Ada Disana?</Text>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Foto Hewan</Text>
            <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoUpload}>
              {formData.photo ? (
                <Image source={{ uri: formData.photo }} style={styles.uploadedPhoto} />
              ) : (
                <Image 
                  source={require('../../../assets/mascot-happy.png')} 
                  style={styles.photoPlaceholder}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Nama Hewan</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama Hewan"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          {/* Pet Type Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Jenis Hewan</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={[styles.dropdownText, !formData.type && styles.dropdownPlaceholder]}>
                {formData.type || 'Pilih Jenis'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Lanjutkan</Text>
        </TouchableOpacity>
      </View>

      {/* Pet Type Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalHandle}
              onPress={() => setShowTypeModal(false)}
            >
              <View style={styles.modalHandleBar} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Pilih Jenis Hewan Peliharaan</Text>
            
            {petTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={styles.modalOption}
                onPress={() => {
                  setFormData({ ...formData, type: type.key });
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionIcon}>{type.icon}</Text>
                <Text style={styles.modalOptionText}>{type.label}</Text>
                {formData.type === type.key && (
                  <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  progressStep: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border.light,
    borderRadius: BorderRadius.full,
  },
  progressBarActive: {
    backgroundColor: Colors.primary.main,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  section: {
    marginTop: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  photoContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  uploadedPhoto: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dropdownText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dropdownPlaceholder: {
    color: Colors.text.tertiary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  continueButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: BorderRadius.full,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  modalOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
});