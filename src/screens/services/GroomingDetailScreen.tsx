import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';
import GroomingService, { SalonDetail } from '../../services/GroomingService';
import petService, { Pet } from '../../services/petService';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingDetail'>;

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: '1', time: '09.00 - 11.00', isAvailable: true },
  { id: '2', time: '12.00 - 14.00', isAvailable: true },
  { id: '3', time: '15.00 - 18.00', isAvailable: true },
];

export default function GroomingDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { groomingId } = route.params as { groomingId: string };

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    // Set initial date string
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    setSelectedDate(`${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`);

    fetchData();
  }, [groomingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salonRes, petsRes] = await Promise.all([
        GroomingService.getSalonDetail(Number(groomingId)),
        petService.getPets()
      ]);

      setSalon(salonRes.data);

      // Handle Pets
      // PetService might return array or { data: [] } depending on implementation. 
      // Assuming array based on typical service pattern, or checking response.
      const petList = Array.isArray(petsRes) ? petsRes : (petsRes as any).data || [];
      setPets(petList);
      if (petList.length > 0) {
        setSelectedPet(petList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
      Alert.alert('Error', 'Gagal memuat detail salon.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDatePicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    // Format date to DD MMM YYYY
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formatted = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    setSelectedDate(formatted);
  };

  const handleBooking = () => {
    if (!selectedPet) {
      Alert.alert('Perhatian', 'Silakan pilih hewan peliharaan terlebih dahulu.');
      return;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Perhatian', 'Silakan pilih waktu kedatangan.');
      return;
    }
    if (!selectedPet.id) return;

    navigation.navigate('GroomingBookingCheckout', {
      groomingId: groomingId,
      salonName: salon?.name || 'Salon',
      date: selectedDate,
      timeSlot: defaultTimeSlots.find(s => s.id === selectedTimeSlot)?.time || '09.00',
      petId: String(selectedPet.id),
      serviceType: 'walkIn',
      // Pass price if needed
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </SafeAreaView>
    );
  }

  if (!salon) return null;

  // Use image from salon or placeholder
  const imageSource = salon.image_url ? { uri: salon.image_url } : require('../../../assets/product-placeholder.jpg');

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
        <Text style={styles.headerTitle}>Detail</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Salon Image */}
        <View style={styles.salonImageContainer}>
          <Image
            source={imageSource}
            style={styles.salonImage}
          />
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{String(salon.rating || 4.8)}</Text>
          </View>
        </View>

        {/* Salon Info */}
        <View style={styles.salonInfo}>
          <Text style={styles.salonName}>{salon.name}</Text>
          <Text style={styles.salonType}>Salon Hewan, Grooming Spa</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>{salon.city || salon.address}</Text>
            <Text style={styles.distanceText}>2.5 km</Text>
          </View>

          <TouchableOpacity style={styles.directButton}>
            <MaterialIcons name="directions" size={20} color={Colors.primary.main} />
            <Text style={styles.directButtonText}>Direct</Text>
          </TouchableOpacity>
        </View>

        {/* About Salon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang Salon</Text>
          <Text style={styles.aboutText}>
            {salon.description || 'Layanan grooming profesional untuk hewan kesayangan Anda.'}
          </Text>
        </View>

        {/* Pet Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pilih Hewan Peliharaan</Text>
            {/* Could navigate to pet selection screen if implemented */}
          </View>

          {selectedPet ? (
            <View style={styles.petCard}>
              <Image
                source={selectedPet.photo ? { uri: selectedPet.photo } : require('../../../assets/product-placeholder.jpg')}
                style={styles.petImage}
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{selectedPet.name}</Text>
                <Text style={styles.petDetails}>{selectedPet.breed || 'Unknown Breed'}</Text>
                <Text style={styles.petDetails}>{selectedPet.gender === 'male' ? 'Jantan' : 'Betina'}, {selectedPet.age || '?'} thn</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPetButton} onPress={() => navigation.navigate('ServicesHome')}>
              <Text style={styles.pilihText}>Tambah / Pilih Hewan di Profil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hari / Tanggal</Text>
            <TouchableOpacity style={styles.dateButton} onPress={handleDatePicker}>
              <Text style={styles.dateButtonText}>{selectedDate}</Text>
              <MaterialIcons name="calendar-today" size={16} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Periode Waktu Kedatangan</Text>
          <Text style={styles.timeSlotNote}>
            Pilih Waktu yang kamu inginkan untuk datang ke lokasi.
            Pastikan kamu datang tepat waktu ya.
          </Text>

          <View style={styles.timeSlots}>
            {defaultTimeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  !slot.isAvailable && styles.timeSlotDisabled,
                  selectedTimeSlot === slot.id && styles.timeSlotSelected
                ]}
                onPress={() => slot.isAvailable && setSelectedTimeSlot(slot.id)}
                disabled={!slot.isAvailable}
              >
                <Text style={[
                  styles.timeSlotText,
                  !slot.isAvailable && styles.timeSlotTextDisabled,
                  selectedTimeSlot === slot.id && styles.timeSlotTextSelected
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Price and Book Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalPrice}>
            {/* Display start price or first service price */}
            Rp {(Number(salon.services?.[0]?.price) || 50000).toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>Bayar</Text>
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
  shareButton: {
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  salonImageContainer: {
    position: 'relative',
    height: 200,
  },
  salonImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  photoCountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  salonInfo: {
    padding: Spacing.base,
  },
  salonName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  salonType: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  distanceText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  directButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    gap: Spacing.sm,
  },
  directButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  section: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  pilihText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  aboutText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  petCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  petDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  timeSlotNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  timeSlots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  timeSlotDisabled: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.border.light,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  timeSlotTextSelected: {
    color: Colors.text.white,
  },
  timeSlotTextDisabled: {
    color: Colors.text.secondary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  totalPrice: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  bookButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  addPetButton: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
  }
});