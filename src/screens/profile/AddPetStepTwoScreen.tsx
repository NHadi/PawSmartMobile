import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPet'>;

interface PetFormStepTwoData {
  breed: string;
  birthDate: string;
  gender: 'Jantan' | 'Betina' | null;
  additionalPhoto?: string;
}

// Dynamic breed lists based on pet type
const breedsByType: Record<string, string[]> = {
  Anjing: [
    'Chihuahua',
    'Golden Retriever',
    'Labrador',
    'Poodle',
    'Bulldog',
    'Beagle',
    'Pomeranian',
    'Siberian Husky',
    'Shih Tzu',
    'Rottweiler',
    'German Shepherd',
    'Dachshund',
    'Lainnya',
  ],
  Kucing: [
    'Persian',
    'Maine Coon',
    'Siamese',
    'Ragdoll',
    'British Shorthair',
    'Scottish Fold',
    'Bengal',
    'Sphynx',
    'Russian Blue',
    'Abyssinian',
    'American Shorthair',
    'Lainnya',
  ],
  Burung: [
    'Lovebird',
    'Cockatiel',
    'Parrot',
    'Canary',
    'Finch',
    'Cockatoo',
    'Budgie',
    'Macaw',
    'Lainnya',
  ],
  Reptil: [
    'Iguana',
    'Gecko',
    'Bearded Dragon',
    'Ball Python',
    'Chameleon',
    'Turtle',
    'Tortoise',
    'Monitor Lizard',
    'Lainnya',
  ],
  Lainnya: [
    'Hamster',
    'Kelinci',
    'Guinea Pig',
    'Ferret',
    'Chinchilla',
    'Sugar Glider',
    'Hedgehog',
    'Lainnya',
  ],
};

export default function AddPetStepTwoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  
  // Get data from step one
  const stepOneData = route.params?.stepOneData || {};
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [formData, setFormData] = useState<PetFormStepTwoData>({
    breed: '',
    birthDate: '',
    gender: 'Jantan',
    additionalPhoto: undefined,
  });

  // Get breed list based on pet type
  const getBreeds = () => {
    const petType = stepOneData.type;
    return breedsByType[petType] || breedsByType.Lainnya || ['Lainnya'];
  };

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
      setFormData({ ...formData, additionalPhoto: result.assets[0].uri });
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
      setFormData({ ...formData, additionalPhoto: result.assets[0].uri });
    }
  };

  const handleContinue = () => {
    if (!formData.breed.trim()) {
      Alert.alert('Error', 'Ras/Keturunan harus dipilih');
      return;
    }
    if (!formData.birthDate) {
      Alert.alert('Error', 'Tanggal lahir atau adopsi harus diisi');
      return;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Jenis kelamin harus dipilih');
      return;
    }
    
    // Navigate to step 3 with both step 1 and step 2 data
    navigation.navigate('AddPetStepThree', { 
      stepOneData: stepOneData,
      stepTwoData: formData
    });
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
        <Text style={styles.progressLabel}>Informasi Dasar</Text>
        <Text style={styles.progressStep}>2/3</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={styles.progressBar} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pet Info Card */}
        <View style={styles.petCard}>
          <View style={styles.petImageContainer}>
            {stepOneData.photo ? (
              <Image source={{ uri: stepOneData.photo }} style={styles.petImage} />
            ) : (
              <View style={[styles.petImage, styles.petImagePlaceholder]}>
                <Text style={styles.petImageIcon}>🐾</Text>
              </View>
            )}
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{stepOneData.name || "Pet's Name"}</Text>
            <Text style={styles.petType}>{stepOneData.type}, {formData.breed || 'Breed'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Breed Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Ras / Keturunan *</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowBreedModal(true)}
            >
              <Text style={[styles.dropdownText, !formData.breed && styles.dropdownPlaceholder]}>
                {formData.breed || 'Pilih Ras/Keturunan'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Birth Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Lahir atau Adopsi *</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => {
                if (formData.birthDate) {
                  setDate(new Date(formData.birthDate));
                }
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.dropdownText, !formData.birthDate && styles.dropdownPlaceholder]}>
                {formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('id-ID') : 'mm/dd/yyy'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Gender Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Jenis Kelamin *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'Jantan' && styles.genderOptionActive
                ]}
                onPress={() => setFormData({ ...formData, gender: 'Jantan' })}
              >
                <View style={[
                  styles.radioCircle,
                  formData.gender === 'Jantan' && styles.radioCircleActive
                ]}>
                  {formData.gender === 'Jantan' && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.genderText,
                  formData.gender === 'Jantan' && styles.genderTextActive
                ]}>Jantan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'Betina' && styles.genderOptionActive
                ]}
                onPress={() => setFormData({ ...formData, gender: 'Betina' })}
              >
                <View style={[
                  styles.radioCircle,
                  formData.gender === 'Betina' && styles.radioCircleActive
                ]}>
                  {formData.gender === 'Betina' && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.genderText,
                  formData.gender === 'Betina' && styles.genderTextActive
                ]}>Betina</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Upload Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Masukan Foto/Gambar</Text>
            <TouchableOpacity style={styles.photoUploadBox} onPress={handlePhotoUpload}>
              {formData.additionalPhoto ? (
                <Image source={{ uri: formData.additionalPhoto }} style={styles.uploadedAdditionalPhoto} />
              ) : (
                <MaterialIcons name="photo-camera" size={40} color={Colors.text.tertiary} />
              )}
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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, selectedDate?: Date) => {
            const currentDate = selectedDate || date;
            setShowDatePicker(Platform.OS === 'ios');
            setDate(currentDate);
            
            // Format date to ISO string
            const formatted = currentDate.toISOString().split('T')[0];
            setFormData({ ...formData, birthDate: formatted });
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Breed Selection Modal */}
      <Modal
        visible={showBreedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBreedModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBreedModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalHandle}
              onPress={() => setShowBreedModal(false)}
            >
              <View style={styles.modalHandleBar} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Pilih Ras Hewan Peliharaan</Text>
            
            <ScrollView style={styles.modalScroll}>
              {getBreeds().map((breed, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, breed });
                    setShowBreedModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{breed}</Text>
                  {formData.breed === breed && (
                    <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    padding: Spacing.md,
    backgroundColor: '#FF8C42',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  petImageContainer: {
    marginRight: Spacing.md,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  petImagePlaceholder: {
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImageIcon: {
    fontSize: 24,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    marginBottom: 2,
  },
  petType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    opacity: 0.9,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
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
  genderContainer: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  genderOptionActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.background.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.dark,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary.main,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
  },
  genderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  genderTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  photoUploadBox: {
    height: 100,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.light,
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
    maxHeight: '50%',
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
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  uploadedAdditionalPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
});