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

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingDetail'>;

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
  { id: '3', time: '15.00 - 18.00', isAvailable: false },
];

export default function GroomingDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { groomingId } = route.params as { groomingId: string };

  const [selectedPet, setSelectedPet] = useState<Pet>(mockPet);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('2 Mei 2025');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    // Navigate to order summary or booking confirmation
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
        <Text style={styles.headerTitle}>Detail</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Salon Image */}
        <View style={styles.salonImageContainer}>
          <Image 
            source={require('../../../assets/product-placeholder.jpg')} 
            style={styles.salonImage}
          />
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
          <View style={styles.photoCountBadge}>
            <MaterialIcons name="photo-library" size={16} color={Colors.text.white} />
            <Text style={styles.photoCountText}>24</Text>
          </View>
        </View>

        {/* Salon Info */}
        <View style={styles.salonInfo}>
          <Text style={styles.salonName}>Pets Corner</Text>
          <Text style={styles.salonType}>Salon Hewan, Grooming Spa</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>Karet, Jakarta Timur</Text>
            <Text style={styles.distanceText}>3.4 km</Text>
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
            Lorem ipsum dolor sit amet consectetur. Tellus odio hac consectetur adipiscing a. 
            Nisl quam pretium tortor massa integer orci suspendisse etiam
          </Text>
        </View>

        {/* Pet Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pilih Hewan Peliharaan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PetSelection')}>
              <Text style={styles.pilihText}>Pilih</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.petCard}>
            <Image source={selectedPet.image} style={styles.petImage} />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{selectedPet.name}</Text>
              <Text style={styles.petDetails}>{selectedPet.breed}</Text>
              <Text style={styles.petDetails}>{selectedPet.gender}, {selectedPet.age}</Text>
            </View>
          </View>
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
            {mockTimeSlots.map((slot) => (
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
          <Text style={styles.totalPrice}>Rp 90.000</Text>
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
});