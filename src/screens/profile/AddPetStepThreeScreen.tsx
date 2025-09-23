import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';
import petService, { Pet } from '../../services/petService';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPetStepThree'>;

interface VaccinationRecord {
  id: string;
  name: string;
  date: string;
  isCompleted: boolean;
}

interface PetFormStepThreeData {
  microchipId: string;
  lastVetVisit: string;
  vaccinations: VaccinationRecord[];
  allergies: string;
  medications: string;
  specialNeeds: string;
  notes: string;
  weight: string;
  age: string;
  ageUnit: 'bulan' | 'tahun';
  isSterilized: boolean;
  hasSchedule: boolean;
  noAllergies: boolean;
  noReminder: boolean;
  healthCondition: string;
  reminder: string;
}

// Predefined options for dropdowns
const healthConditions = [
  'Sehat',
  'Sedang Sakit',
  'Dalam Perawatan',
  'Pemulihan',
  'Kondisi Kronis',
  'Lainnya',
];

const commonAllergies = [
  'Tidak Ada',
  'Antibiotik',
  'Anti-inflamasi', 
  'Vaksin',
  'Anestesi',
  'Obat Kutu',
  'Makanan Tertentu',
  'Lainnya',
];

const reminderOptions = [
  'Tidak Ada',
  'Vaksinasi',
  'Check-up Rutin',
  'Pemberian Obat',
  'Grooming',
  'Vitamin',
  'Obat Cacing',
  'Lainnya',
];

export default function AddPetStepThreeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedVaccinationId, setSelectedVaccinationId] = useState<string>('');
  const [showVetDatePicker, setShowVetDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [customHealthInput, setCustomHealthInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customReminderInput, setCustomReminderInput] = useState('');
  
  // Get data from previous steps
  const stepOneData = route.params?.stepOneData || {};
  const stepTwoData = route.params?.stepTwoData || {};
  
  const [formData, setFormData] = useState<PetFormStepThreeData>({
    microchipId: '',
    lastVetVisit: '',
    vaccinations: [
      { id: '1', name: 'Rabies', date: '', isCompleted: false },
      { id: '2', name: 'DHPP', date: '', isCompleted: false },
      { id: '3', name: 'Bordetella', date: '', isCompleted: false },
    ],
    allergies: '',
    medications: '',
    specialNeeds: '',
    notes: '',
    weight: '',
    age: '',
    ageUnit: 'tahun',
    isSterilized: false,
    hasSchedule: false,
    noAllergies: false,
    noReminder: false,
    healthCondition: '',
    reminder: '',
  });

  const toggleVaccination = (vaccinationId: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.map(vac =>
        vac.id === vaccinationId 
          ? { ...vac, isCompleted: !vac.isCompleted }
          : vac
      ),
    }));
  };

  const handleDatePicker = (vaccinationId: string) => {
    setSelectedVaccinationId(vaccinationId);
    const vaccination = formData.vaccinations.find(v => v.id === vaccinationId);
    if (vaccination?.date) {
      setDate(new Date(vaccination.date));
    } else {
      setDate(new Date());
    }
    setShowDatePicker(true);
  };

  const updateVaccinationDate = (vaccinationId: string, dateString: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.map(vac =>
        vac.id === vaccinationId 
          ? { ...vac, date: dateString }
          : vac
      ),
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    
    try {
      // Map pet type from Indonesian to English
      const petTypeMap: Record<string, string> = {
        'Anjing': 'dog',
        'Kucing': 'cat',
        'Burung': 'bird',
        'Reptil': 'other',
        'Lainnya': 'other',
      };
      
      // Map gender from Indonesian to English
      const genderMap: Record<string, string> = {
        'Jantan': 'male',
        'Betina': 'female',
      };
      
      // Combine all data from the three steps
      const newPet: Pet = {
        name: stepOneData.name || '',
        type: petTypeMap[stepOneData.type] || 'other',
        photo: stepOneData.photo || '',
        breed: stepTwoData.breed || '',
        age: formData.age ? (formData.ageUnit === 'tahun' ? parseInt(formData.age) : Math.floor(parseInt(formData.age) / 12)) : undefined,
        birthDate: stepTwoData.birthDate || '',
        gender: genderMap[stepTwoData.gender] || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        color: '',
        microchipId: formData.microchipId || '',
        healthStatus: formData.healthCondition || 'Sehat',
        medicalHistory: `Allergies: ${formData.allergies || 'Tidak Ada'}\nMedications: ${formData.medications}\nSpecial Needs: ${formData.specialNeeds}\nSterilized: ${formData.isSterilized ? 'Ya' : 'Tidak'}\nReminder: ${formData.reminder || 'Tidak Ada'}`,
        notes: formData.notes || '',
        vaccinations: formData.vaccinations
          .filter(v => v.isCompleted)
          .map(v => ({
            name: v.name,
            date: v.date || new Date().toISOString(),
          })),
      };
      
      // Save the pet using petService
      await petService.createPet(newPet);
      
      Alert.alert(
        'Berhasil!', 
        'Peliharaan baru berhasil ditambahkan',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to pets list
              navigation.navigate('MyPets');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan peliharaan. Silakan coba lagi.');
      } finally {
      setLoading(false);
    }
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
        <Text style={styles.progressLabel}>Kesehatan</Text>
        <Text style={styles.progressStep}>3/3</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={[styles.progressBar, styles.progressBarActive]} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepContent}>
          {/* Berat Section */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Berat</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: Spacing.sm }]}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                placeholder="0"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>gr</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text.tertiary} style={{ marginLeft: Spacing.xs }} />
            </View>
          </View>

          {/* Telah Steril Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, isSterilized: !formData.isSterilized })}
          >
            <MaterialIcons 
              name={formData.isSterilized ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={formData.isSterilized ? Colors.primary.main : Colors.text.tertiary}
            />
            <Text style={styles.checkboxLabel}>Telah Steril/ Kastrasi Kebirian?</Text>
          </TouchableOpacity>

          {/* Kondisi Kesehatan */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Kondisi Kesehatan</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowHealthModal(true)}
            >
              <Text style={[styles.dropdownText, formData.healthCondition && styles.dropdownTextFilled]}>
                {formData.healthCondition || 'Pilih Opsi'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Telah Ada Penjadwalan Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, hasSchedule: !formData.hasSchedule })}
          >
            <MaterialIcons 
              name={formData.hasSchedule ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={formData.hasSchedule ? Colors.primary.main : Colors.text.tertiary}
            />
            <Text style={styles.checkboxLabel}>Telah / Tidak Ada penjadwal</Text>
          </TouchableOpacity>

          {/* Alergi Obat */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Alergi Obat?</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowAllergyModal(true)}
            >
              <Text style={[styles.dropdownText, formData.allergies && styles.dropdownTextFilled]}>
                {formData.allergies || 'Pilih Obat'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Tidak Ada Checkboxes */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, noAllergies: !formData.noAllergies })}
          >
            <MaterialIcons 
              name={formData.noAllergies ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={formData.noAllergies ? Colors.primary.main : Colors.text.tertiary}
            />
            <Text style={styles.checkboxLabel}>Tidak Ada</Text>
          </TouchableOpacity>

          {/* Buat Pengingat */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Buat Pengingat</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowReminderModal(true)}
            >
              <Text style={[styles.dropdownText, formData.reminder && styles.dropdownTextFilled]}>
                {formData.reminder || 'Buat pengingat'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Tidak Ada Checkboxes for Pengingat */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, noReminder: !formData.noReminder })}
          >
            <MaterialIcons 
              name={formData.noReminder ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={formData.noReminder ? Colors.primary.main : Colors.text.tertiary}
            />
            <Text style={styles.checkboxLabel}>Tidak Ada</Text>
          </TouchableOpacity>

          {/* Catatan */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Ket/ Catatan</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Ket/ Catatan"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photo Upload Section */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Masukan Foto/Gambar</Text>
            <TouchableOpacity style={styles.photoUploadBox}>
              <MaterialIcons name="photo-camera" size={40} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.finishButton, loading && styles.finishButtonDisabled]}
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.white} />
          ) : (
            <Text style={styles.finishButtonText}>Simpan</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.navigate('MyPets')}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
      </View>

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
            updateVaccinationDate(selectedVaccinationId, formatted);
          }}
          maximumDate={new Date()}
        />
      )}

      {showVetDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, selectedDate?: Date) => {
            const currentDate = selectedDate || date;
            setShowVetDatePicker(Platform.OS === 'ios');
            setDate(currentDate);
            
            // Format date to ISO string
            const formatted = currentDate.toISOString().split('T')[0];
            setFormData({ ...formData, lastVetVisit: formatted });
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Health Condition Modal */}
      <Modal
        visible={showHealthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHealthModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHealthModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalHandle}
              onPress={() => setShowHealthModal(false)}
            >
              <View style={styles.modalHandleBar} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Kondisi Kesehatan</Text>
            
            {/* Custom Input */}
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ketik kondisi kesehatan..."
                placeholderTextColor={Colors.text.tertiary}
                value={customHealthInput}
                onChangeText={setCustomHealthInput}
              />
              {customHealthInput ? (
                <TouchableOpacity
                  style={styles.modalInputButton}
                  onPress={() => {
                    setFormData({ ...formData, healthCondition: customHealthInput });
                    setCustomHealthInput('');
                    setShowHealthModal(false);
                  }}
                >
                  <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.modalSubtitle}>Atau pilih dari saran:</Text>
            
            <ScrollView style={styles.modalScroll}>
              {healthConditions.map((condition, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, healthCondition: condition });
                    setShowHealthModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{condition}</Text>
                  {formData.healthCondition === condition && (
                    <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Allergy Modal */}
      <Modal
        visible={showAllergyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllergyModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAllergyModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalHandle}
              onPress={() => setShowAllergyModal(false)}
            >
              <View style={styles.modalHandleBar} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Alergi Obat</Text>
            
            {/* Custom Input */}
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ketik nama obat..."
                placeholderTextColor={Colors.text.tertiary}
                value={customAllergyInput}
                onChangeText={setCustomAllergyInput}
              />
              {customAllergyInput ? (
                <TouchableOpacity
                  style={styles.modalInputButton}
                  onPress={() => {
                    setFormData({ ...formData, allergies: customAllergyInput });
                    setCustomAllergyInput('');
                    setShowAllergyModal(false);
                  }}
                >
                  <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.modalSubtitle}>Atau pilih dari saran:</Text>
            
            <ScrollView style={styles.modalScroll}>
              {commonAllergies.map((allergy, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, allergies: allergy });
                    if (allergy === 'Tidak Ada') {
                      setFormData({ ...formData, allergies: allergy, noAllergies: true });
                    }
                    setShowAllergyModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{allergy}</Text>
                  {formData.allergies === allergy && (
                    <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        visible={showReminderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReminderModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalHandle}
              onPress={() => setShowReminderModal(false)}
            >
              <View style={styles.modalHandleBar} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Buat Pengingat</Text>
            
            {/* Custom Input */}
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ketik pengingat..."
                placeholderTextColor={Colors.text.tertiary}
                value={customReminderInput}
                onChangeText={setCustomReminderInput}
              />
              {customReminderInput ? (
                <TouchableOpacity
                  style={styles.modalInputButton}
                  onPress={() => {
                    setFormData({ ...formData, reminder: customReminderInput });
                    setCustomReminderInput('');
                    setShowReminderModal(false);
                  }}
                >
                  <MaterialIcons name="check" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.modalSubtitle}>Atau pilih dari saran:</Text>
            
            <ScrollView style={styles.modalScroll}>
              {reminderOptions.map((reminder, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, reminder: reminder });
                    if (reminder === 'Tidak Ada') {
                      setFormData({ ...formData, reminder: reminder, noReminder: true });
                    }
                    setShowReminderModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{reminder}</Text>
                  {formData.reminder === reminder && (
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
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    paddingHorizontal: Spacing.base,
    paddingBottom: 100,
  },
  stepContent: {
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  optionalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.md,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dateInput:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dateTextPlaceholder: {
    color: Colors.text.tertiary,
  },
  vaccinationItem: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  vaccinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
  },
  vaccinationName: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  vaccinationNameCompleted: {
    color: Colors.success.main,
    fontFamily: Typography.fontFamily.medium,
  },
  vaccinationDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.base,
    paddingLeft: Spacing.xl + Spacing.md,
  },
  vaccinationDateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    gap: Spacing.sm,
  },
  finishButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
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
    color: Colors.text.tertiary,
  },
  dropdownTextFilled: {
    color: Colors.text.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
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
  cancelButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
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
    maxHeight: '70%',
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
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  modalInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  modalInputButton: {
    padding: Spacing.xs,
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
});