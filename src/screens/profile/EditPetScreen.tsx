import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';
import petService, { Pet } from '../../services/petService';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'EditPet'>;
type RoutePropType = RouteProp<ProfileStackParamList, 'EditPet'>;

interface PetData {
  id: string;
  name: string;
  type: 'Anjing' | 'Kucing' | 'Burung' | 'Lainnya';
  breed: string;
  gender: 'Jantan' | 'Betina';
  birthDate: string;
  weight: string;
  healthCondition: string;
  allergies: string;
  hasAllergies: boolean;
  hasHealthCondition: boolean;
  notes: string;
  stampCertificate?: string;
  vaccineCertificate?: string;
  image?: any;
}

// Map English pet types to Indonesian
const petTypeMapping: Record<string, string> = {
  'dog': 'Anjing',
  'cat': 'Kucing',
  'bird': 'Burung',
  'fish': 'Ikan',
  'rabbit': 'Kelinci',
  'hamster': 'Hamster',
  'other': 'Lainnya',
};

// Reverse mapping
const petTypeReverseMapping: Record<string, string> = {
  'Anjing': 'dog',
  'Kucing': 'cat',
  'Burung': 'bird',
  'Ikan': 'fish',
  'Kelinci': 'rabbit',
  'Hamster': 'hamster',
  'Lainnya': 'other',
};

// Map gender to Indonesian
const genderMapping: Record<string, string> = {
  'male': 'Jantan',
  'female': 'Betina',
};

// Reverse mapping
const genderReverseMapping: Record<string, string> = {
  'Jantan': 'male',
  'Betina': 'female',
};

export default function EditPetScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { petId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalPet, setOriginalPet] = useState<Pet | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [formData, setFormData] = useState<PetData>({
    id: petId,
    name: '',
    type: 'Anjing',
    breed: '',
    gender: 'Jantan',
    birthDate: '',
    weight: '',
    healthCondition: '',
    allergies: '',
    hasAllergies: false,
    hasHealthCondition: true,
    notes: '',
    stampCertificate: '',
    vaccineCertificate: '',
    image: require('../../../assets/product-placeholder.jpg'),
  });

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    try {
      const petDetails = await petService.getPet(petId);
      if (petDetails) {
        setOriginalPet(petDetails);
        
        // Parse medical history for allergies
        let allergiesText = '';
        if (petDetails.medicalHistory?.includes('Allergies:')) {
          allergiesText = petDetails.medicalHistory.split('Allergies:')[1].split('\n')[0].trim();
        }
        
        // Convert data to form format
        setFormData({
          id: petDetails.id || petId,
          name: petDetails.name || '',
          type: (petTypeMapping[petDetails.type] || 'Lainnya') as PetData['type'],
          breed: petDetails.breed || '',
          gender: (petDetails.gender ? genderMapping[petDetails.gender] || 'Jantan' : 'Jantan') as PetData['gender'],
          birthDate: petDetails.birthDate || '',
          weight: petDetails.weight?.toString() || '',
          healthCondition: petDetails.healthStatus || '',
          allergies: allergiesText,
          hasAllergies: !allergiesText || allergiesText === '-',
          hasHealthCondition: !petDetails.healthStatus || petDetails.healthStatus === 'Baik',
          notes: petDetails.notes || '',
          stampCertificate: '',
          vaccineCertificate: '',
          image: petDetails.photo ? { uri: petDetails.photo } : require('../../../assets/product-placeholder.jpg'),
        });
      } else {
        Alert.alert('Error', 'Peliharaan tidak ditemukan', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail peliharaan');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    Alert.alert(
      'Ubah Foto',
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
      setFormData({ ...formData, image: { uri: result.assets[0].uri } });
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
      setFormData({ ...formData, image: { uri: result.assets[0].uri } });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Nama peliharaan harus diisi');
      return;
    }

    setSaving(true);
    
    try {
      // Convert form data back to Pet format
      const updatedPet: Pet = {
        ...originalPet,
        id: petId,
        name: formData.name,
        type: petTypeReverseMapping[formData.type] || 'other',
        breed: formData.breed,
        gender: genderReverseMapping[formData.gender],
        birthDate: formData.birthDate,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        healthStatus: formData.hasHealthCondition ? 'Baik' : formData.healthCondition,
        medicalHistory: `Allergies: ${formData.hasAllergies ? '-' : formData.allergies}\nNotes: ${formData.notes}`,
        notes: formData.notes,
        photo: formData.image?.uri || undefined,
      };
      
      await petService.updatePet(petId, updatedPet);
      
      Alert.alert(
        'Berhasil!',
        'Informasi peliharaan telah diperbarui',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui informasi peliharaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={[styles.petImageContainer, { backgroundColor: '#FF8C42' }]}
              onPress={handlePhotoUpload}
            >
              <Image
                source={formData.image}
                style={styles.petImage}
                resizeMode="cover"
              />
              <View style={styles.photoEditOverlay}>
                <MaterialIcons name="camera-alt" size={20} color={Colors.text.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.petBasicInfo}>
              <Text style={styles.petName}>{formData.name}</Text>
              <Text style={styles.petBreed}>{formData.type}, {formData.breed}</Text>
            </View>
          </View>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Dasar</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ras / Keturunan *</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>Pilih Ras/Keturunan</Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tanggal Lahir atau Adopsi *</Text>
            <TouchableOpacity 
              style={[styles.inputWithIcon, styles.datePickerButton]}
              onPress={() => {
                if (formData.birthDate) {
                  setDate(new Date(formData.birthDate));
                }
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.inputField, !formData.birthDate && styles.placeholderText]}>
                {formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('id-ID') : 'Pilih tanggal'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Jenis Kelamin *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFormData({ ...formData, gender: 'Jantan' })}
              >
                <View style={[styles.radioCircle, formData.gender === 'Jantan' && styles.radioCircleActive]}>
                  {formData.gender === 'Jantan' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioText}>Jantan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFormData({ ...formData, gender: 'Betina' })}
              >
                <View style={[styles.radioCircle, formData.gender === 'Betina' && styles.radioCircleActive]}>
                  {formData.gender === 'Betina' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioText}>Betina</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Foto Sertifikat STAMBUM</Text>
            <TouchableOpacity style={styles.photoUploadBox}>
              <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kesehatan</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Berat</Text>
            <View style={styles.weightInput}>
              <TextInput
                style={styles.weightField}
                placeholder="0.0"
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                keyboardType="numeric"
                placeholderTextColor={Colors.text.tertiary}
              />
              <TouchableOpacity style={styles.weightUnit}>
                <Text style={styles.weightUnitText}>gr</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.infoLink}>
              <MaterialIcons name="info-outline" size={16} color={Colors.text.tertiary} />
              <Text style={styles.infoText}>Tidak tahu? Kamu bisa gunakan estimasi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Kondisi Kesehatan</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownPlaceholder}>Kondisi Kesehatan</Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, hasHealthCondition: !formData.hasHealthCondition })}
            >
              <View style={[styles.checkboxBox, formData.hasHealthCondition && styles.checkboxActive]}>
                {formData.hasHealthCondition && <MaterialIcons name="check" size={16} color={Colors.text.white} />}
              </View>
              <Text style={styles.checkboxText}>Sehat / tidak ada penyakit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Alergi Obat?</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownPlaceholder}>Pilih Obat</Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, hasAllergies: !formData.hasAllergies })}
            >
              <View style={[styles.checkboxBox, formData.hasAllergies && styles.checkboxActive]}>
                {formData.hasAllergies && <MaterialIcons name="check" size={16} color={Colors.text.white} />}
              </View>
              <Text style={styles.checkboxText}>Tidak Ada</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Beri Catatan</Text>
            <TextInput
              style={styles.input}
              placeholder="Tujuan Pelatihan"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Foto Sertifikat Vaksin</Text>
            <TouchableOpacity style={styles.photoUploadBox}>
              <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.text.white} />
          ) : (
            <Text style={styles.saveButtonText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  petBasicInfo: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  petBreed: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  dropdownText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  dropdownPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  inputField: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  radioText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  photoUploadBox: {
    height: 120,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.light,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  weightField: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  weightUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border.light,
  },
  weightUnitText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginRight: Spacing.xs,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border.dark,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkboxText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  datePickerButton: {
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  photoEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
});