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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPet'>;

interface PetFormData {
  name: string;
  type: 'Anjing' | 'Kucing' | 'Burung' | 'Lainnya' | null;
  breed: string;
  gender: 'Jantan' | 'Betina' | null;
  birthDate: string;
  weight: string;
  healthCondition: string;
  allergies: string;
  hasAllergies: boolean;
  hasHealthCondition: boolean;
  reminder: string;
  hasReminder: boolean;
  notes: string;
  image?: any;
}

export default function AddPetScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    type: null,
    breed: '',
    gender: null,
    birthDate: '',
    weight: '',
    healthCondition: '',
    allergies: '',
    hasAllergies: false,
    hasHealthCondition: false,
    reminder: '',
    hasReminder: false,
    notes: '',
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.type) {
        Alert.alert('Informasi Diperlukan', 'Silakan lengkapi semua field yang diperlukan');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.breed || !formData.gender || !formData.birthDate) {
        Alert.alert('Informasi Diperlukan', 'Silakan lengkapi semua field yang diperlukan');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
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

  const handleSubmit = () => {
    Alert.alert(
      'Berhasil!',
      `${formData.name} telah ditambahkan ke daftar peliharaan Anda`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyPets'),
        },
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Hewan Peliharaan Kamu,</Text>
      <Text style={styles.stepSubtitle}>Siapa Saja Yang Ada Disana?</Text>

      <View style={styles.photoSection}>
        <Text style={styles.label}>Foto Hewan</Text>
        <TouchableOpacity style={styles.photoUpload} onPress={handlePhotoUpload}>
          {formData.image ? (
            <Image
              source={formData.image}
              style={styles.uploadedPhoto}
              resizeMode="cover"
            />
          ) : (
            <>
              <Image
                source={require('../../../assets/mascot-happy.png')}
                style={styles.photoPlaceholder}
                resizeMode="contain"
              />
              <View style={styles.addPhotoIcon}>
                <MaterialIcons name="add-a-photo" size={24} color={Colors.primary.main} />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nama Hewan</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama Hewan"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Jenis Hewan</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={formData.type ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.type || 'Pilih Jenis'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informasi Dasar</Text>

      <View style={styles.petInfoHeader}>
        <Image
          source={require('../../../assets/product-placeholder.jpg')}
          style={styles.petImage}
        />
        <View style={styles.petDetails}>
          <Text style={styles.petName}>{formData.name || 'Ichi\'s'}</Text>
          <Text style={styles.petType}>{formData.type}, Chihuahua</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ras / Keturunan *</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={formData.breed ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.breed || 'Pilih Ras/Keturunan'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tanggal Lahir atau Adopsi *</Text>
        <TouchableOpacity 
          style={styles.inputWithIcon}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.inputField, !formData.birthDate && styles.placeholderText]}>
            {formData.birthDate || 'mm/dd/yyyy'}
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
        <Text style={styles.label}>Masukan Foto/Gambar</Text>
        <TouchableOpacity style={styles.photoUploadBox}>
          <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Kesehatan</Text>

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
          <Text style={styles.dropdownPlaceholder}>Pilih Obat</Text>
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
        <Text style={styles.label}>Buat Pengingat</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownPlaceholder}>Buat pengingat</Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => setFormData({ ...formData, hasReminder: !formData.hasReminder })}
        >
          <View style={[styles.checkboxBox, formData.hasReminder && styles.checkboxActive]}>
            {formData.hasReminder && <MaterialIcons name="check" size={16} color={Colors.text.white} />}
          </View>
          <Text style={styles.checkboxText}>Tidak Ada</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beri Catatan</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Beri Catatan"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={4}
          placeholderTextColor={Colors.text.tertiary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Masukan Foto/Gambar</Text>
        <TouchableOpacity style={styles.photoUploadBox}>
          <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Peliharaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        {currentStep === 1 && <Text style={styles.stepIndicator}>Lengkapi Data Diri                                    1/3</Text>}
        {currentStep === 2 && <Text style={styles.stepIndicator}>Informasi Dasar                                        2/3</Text>}
        {currentStep === 3 && <Text style={styles.stepIndicator}>Kesehatan                                                3/3</Text>}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === 3 ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>Lanjutkan</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || date;
            setShowDatePicker(Platform.OS === 'ios');
            setDate(currentDate);
            
            // Format date to mm/dd/yyyy
            const formatted = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
            setFormData({ ...formData, birthDate: formatted });
          }}
          maximumDate={new Date()}
        />
      )}
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
  progressContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
  },
  stepIndicator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 100,
  },
  stepContent: {
    paddingTop: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    color: Colors.text.primary,
  },
  dropdownPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  photoSection: {
    marginBottom: Spacing.xl,
  },
  photoUpload: {
    width: 120,
    height: 120,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
  },
  uploadedPhoto: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  addPhotoIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  petInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  petType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
    height: 150,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  secondaryButton: {
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.secondary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
});