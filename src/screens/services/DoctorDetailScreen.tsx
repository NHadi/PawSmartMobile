import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'DoctorDetail'>;

interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: string;
  age: string;
  image: any;
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

const mockPet: Pet = {
  id: '1',
  name: 'Name Pet',
  breed: 'Anjing, Chihuahua',
  gender: 'Jantan',
  age: '1 tahun',
  image: require('../../../assets/product-placeholder.jpg'),
};

const mockTimeSlots: TimeSlot[] = [
  { id: '1', time: '09.00 - 11.00', isAvailable: true },
  { id: '2', time: '12.00 - 14.00', isAvailable: true },
  { id: '3', time: '15.00 - 18.00', isAvailable: true },
];

const THEME = {
  primary: Colors.primary.main,
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  border: Colors.border.light,
  white: '#FFFFFF',
};

export default function DoctorDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { doctorId } = route.params as { doctorId: string };

  const [selectedPet, setSelectedPet] = useState<Pet>(mockPet);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('2 Mei 2025');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [isTimeSlotExpanded, setIsTimeSlotExpanded] = useState(false);

  const handleDatePicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDateValue?: Date) => {
    const currentDate = selectedDateValue || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formatted = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    setSelectedDate(formatted);
  };

  const handleBooking = () => {
    navigation.navigate('DoctorBookingCheckout', {
      doctorId: doctorId,
      doctorName: 'dr. Taylor Swift',
      date: selectedDate,
      timeSlot: mockTimeSlots.find(s => s.id === selectedTimeSlot)?.time || '',
      petId: selectedPet.id,
      complaint: complaint,
    });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={THEME.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Dokter</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={22} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Doctor Image */}
          <View style={styles.doctorImageContainer}>
            <Image
              source={require('../../../assets/product-placeholder.jpg')}
              style={styles.doctorImage}
              resizeMode="cover"
            />
            {/* 24/7 Badge */}
            <View style={styles.badge24}>
              <Text style={styles.badge24Text}>24/7</Text>
              <Text style={styles.badgeSubText}>Tersedia</Text>
            </View>
            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
            {/* Photo Count Badge */}
            <View style={styles.photoCountBadge}>
              <MaterialIcons name="photo-library" size={14} color={THEME.white} />
              <Text style={styles.photoCountText}>2/4</Text>
            </View>
          </View>

          {/* Doctor Info */}
          <View style={styles.doctorInfoSection}>
            <Text style={styles.doctorName}>dr. Taylor Swift</Text>
            <Text style={styles.doctorSpecialization}>Dokter Spesialis Hewan</Text>
            <View style={styles.locationRow}>
              <Text style={styles.distanceText}>3 th perjalanan</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.locationText}>Jakarta Timur</Text>
            </View>

            {/* Direct Button */}
            <TouchableOpacity style={styles.directButton}>
              <MaterialIcons name="directions" size={20} color={THEME.primary} />
              <Text style={styles.directButtonText}>Direct</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Salon</Text>
            <Text style={styles.aboutText}>
              Lorem ipsum dolor sit amet consectetur. Tellus odio hac consectetur adipiscing a.
              Nisl quam pretium tortor massa integer orci suspendisse etiam
            </Text>
          </View>

          {/* Pet Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pilih Hewan Peliharaan</Text>
              <TouchableOpacity
                style={styles.pilihButton}
                onPress={() => navigation.navigate('PetSelection')}
              >
                <Text style={styles.pilihText}>Pilih</Text>
                <MaterialIcons name="chevron-right" size={18} color={THEME.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.petCard}>
              <Image source={selectedPet.image} style={styles.petImage} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{selectedPet.name}</Text>
                <Text style={styles.petBreed}>{selectedPet.breed}</Text>
                <Text style={styles.petDetails}>{selectedPet.gender}, {selectedPet.age}</Text>
              </View>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.dateRow}>
              <Text style={styles.sectionTitle}>Hari / Tanggal</Text>
              <TouchableOpacity style={styles.dateButton} onPress={handleDatePicker}>
                <Text style={styles.dateButtonText}>{selectedDate}</Text>
                <MaterialIcons name="calendar-today" size={18} color={THEME.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Complaint Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keluhan</Text>
            <TextInput
              style={styles.complaintInput}
              placeholder="berikan catatan tamabahan"
              placeholderTextColor={THEME.textSecondary}
              value={complaint}
              onChangeText={setComplaint}
              multiline
            />
          </View>

          {/* Time Slot Selection */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.timeSlotHeader}
              onPress={() => setIsTimeSlotExpanded(!isTimeSlotExpanded)}
            >
              <View>
                <Text style={styles.sectionTitle}>Periode Waktu Kedatangan</Text>
                <Text style={styles.timeSlotNote}>
                  Pilih Waktu yang kamu inginkan untuk datang ke lokasi.{'\n'}
                  Pastikan kamu datang tepat waktu ya.
                </Text>
              </View>
              <MaterialIcons
                name={isTimeSlotExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={THEME.textSecondary}
              />
            </TouchableOpacity>

            {isTimeSlotExpanded && (
              <View style={styles.timeSlots}>
                {mockTimeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot === slot.id && styles.timeSlotSelected,
                    ]}
                    onPress={() => setSelectedTimeSlot(slot.id)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        selectedTimeSlot === slot.id && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Price and Book Button */}
        <View style={styles.bottomContainer}>
          <Text style={styles.totalPrice}>Rp 350.000</Text>
          <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
            <Text style={styles.bookButtonText}>Pesan Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    textAlign: 'center',
  },
  shareButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  doctorImageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  badge24: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: '#FF3B30',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  badge24Text: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.white,
  },
  badgeSubText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.white,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.white,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCountText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.white,
  },
  doctorInfoSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: THEME.white,
  },
  doctorName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.xs,
  },
  doctorSpecialization: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  dotSeparator: {
    fontSize: Typography.fontSize.sm,
    color: THEME.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  directButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  directButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  divider: {
    height: 8,
    backgroundColor: THEME.backgroundSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  pilihButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pilihText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  aboutText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  petDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  complaintInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    marginTop: Spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeSlotNote: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  timeSlots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
  },
  timeSlotSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  timeSlotText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  timeSlotTextSelected: {
    color: THEME.white,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: THEME.white,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPrice: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  bookButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  bookButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
});
