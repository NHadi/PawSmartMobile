import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const PROMO_CARD_WIDTH = width * 0.4;

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'Hotel'>;

interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  originalPrice: string;
  price: string;
  location: string;
  distance: string;
  image: any;
}

interface PetType {
  id: string;
  name: string;
  icon: string;
}

const petTypes: PetType[] = [
  { id: 'anjing', name: 'Anjing', icon: '🐕' },
  { id: 'kucing', name: 'Kucing', icon: '🐱' },
  { id: 'burung', name: 'Burung', icon: '🐦' },
  { id: 'reptil', name: 'Reptil', icon: '🦎' },
  { id: 'lainnya', name: 'Lainnya', icon: '🐾' },
];

const mockPromoHotels: Hotel[] = [
  {
    id: '1',
    name: 'Cat Hotel Jakarta',
    rating: 4.9,
    reviews: 1000,
    originalPrice: 'Rp90.000',
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Cat Hotel Jakarta',
    rating: 4.9,
    reviews: 1000,
    originalPrice: 'Rp90.000',
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '3',
    name: 'Cat Hotel Jakarta',
    rating: 4.9,
    reviews: 1000,
    originalPrice: 'Rp90.000',
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

const mockRecommendedHotels: Hotel[] = [
  {
    id: '4',
    name: 'Happy Paws Hotel',
    rating: 4.9,
    reviews: 1000,
    originalPrice: 'Rp90.000',
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '5',
    name: 'Happy Paws Hotel',
    rating: 4.9,
    reviews: 1000,
    originalPrice: 'Rp90.000',
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

import { THEME } from '../../constants/theme';

export default function HotelScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [location, setLocation] = useState('Di sekitar saya');
  const [selectedDate, setSelectedDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState<PetType | null>(null);
  const [showPetTypeModal, setShowPetTypeModal] = useState(false);

  const handleDatePicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDateValue?: Date) => {
    const currentDate = selectedDateValue || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayName = days[currentDate.getDay()];
    const formatted = `${dayName}, ${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    setSelectedDate(formatted);
  };

  const handleSearch = () => {
    navigation.navigate('HotelList', {
      location: location,
      date: selectedDate,
      petType: selectedPetType?.name,
    });
  };

  const handleHotelPress = (hotel: Hotel) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.id });
  };

  const handleSearchPress = () => {
    navigation.navigate('HotelSearch');
  };

  const renderPromoCard = (hotel: Hotel) => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.promoCard}
      onPress={() => handleHotelPress(hotel)}
      activeOpacity={0.7}
    >
      <Image source={hotel.image} style={styles.promoImage} resizeMode="cover" />
      <View style={styles.promoInfo}>
        <Text style={styles.promoName} numberOfLines={1}>{hotel.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={12} color="#FFB800" />
          <Text style={styles.ratingText}>{hotel.rating}</Text>
          <Text style={styles.reviewsText}>{hotel.reviews}rb ulasan</Text>
        </View>
        <Text style={styles.originalPrice}>{hotel.originalPrice}</Text>
        <Text style={styles.currentPrice}>{hotel.price}<Text style={styles.perNight}>/malam</Text></Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1}>{hotel.location}</Text>
          <Text style={styles.distanceText}>{hotel.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecommendedCard = (hotel: Hotel) => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.recommendedCard}
      onPress={() => handleHotelPress(hotel)}
      activeOpacity={0.7}
    >
      <Image source={hotel.image} style={styles.recommendedImage} resizeMode="cover" />
      <View style={styles.recommendedInfo}>
        <Text style={styles.recommendedName}>{hotel.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{hotel.rating}</Text>
          <Text style={styles.reviewsText}>{hotel.reviews}rb ulasan</Text>
        </View>
        <Text style={styles.originalPrice}>{hotel.originalPrice}</Text>
        <Text style={styles.recommendedPrice}>{hotel.price}<Text style={styles.perNight}>/malam</Text></Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{hotel.location}</Text>
          <Text style={styles.distanceText}>{hotel.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Hotel</Text>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Ionicons name="search" size={22} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Filters */}
          <View style={styles.filtersSection}>
            {/* Location Selector */}
            <TouchableOpacity style={styles.filterItem} onPress={() => { }}>
              <Text style={styles.filterText}>{location}</Text>
              <MaterialIcons name="location-on" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>

            {/* Date Selector */}
            <TouchableOpacity style={styles.filterItem} onPress={handleDatePicker}>
              <Text style={[styles.filterText, !selectedDate && styles.filterTextPlaceholder]}>
                {selectedDate || 'Pilih Tanggal'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>

            {/* Pet Type Selector */}
            <TouchableOpacity style={styles.filterItem} onPress={() => setShowPetTypeModal(true)}>
              <Text style={[styles.filterText, !selectedPetType && styles.filterTextPlaceholder]}>
                {selectedPetType?.name || 'Jenis Hewan'}
              </Text>
              <MaterialCommunityIcons name="cat" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>

            {/* Search Button */}
            <TouchableOpacity style={styles.searchHotelButton} onPress={handleSearch}>
              <Text style={styles.searchHotelButtonText}>Cari Hotel</Text>
            </TouchableOpacity>
          </View>

          {/* Hotel Promo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Promo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoScrollContent}
            >
              {mockPromoHotels.map(hotel => renderPromoCard(hotel))}
            </ScrollView>
          </View>

          {/* Hotel Rekomendasi Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Rekomendasi</Text>
            {mockRecommendedHotels.map(hotel => renderRecommendedCard(hotel))}
          </View>
        </ScrollView>

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

        {/* Pet Type Modal */}
        <Modal
          visible={showPetTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPetTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Ras Hewan Peliharaan</Text>
                <TouchableOpacity onPress={() => setShowPetTypeModal(false)}>
                  <MaterialIcons name="close" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
              </View>
              {petTypes.map(pet => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petTypeItem}
                  onPress={() => {
                    setSelectedPetType(pet);
                    setShowPetTypeModal(false);
                  }}
                >
                  <Text style={styles.petTypeIcon}>{pet.icon}</Text>
                  <Text style={styles.petTypeName}>{pet.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
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
  searchButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  filtersSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
  },
  filterText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  filterTextPlaceholder: {
    color: THEME.textSecondary,
  },
  searchHotelButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  searchHotelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  promoScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  promoCard: {
    width: PROMO_CARD_WIDTH,
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promoImage: {
    width: '100%',
    height: 100,
  },
  promoInfo: {
    padding: Spacing.sm,
  },
  promoName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  reviewsText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: '#FF6B00',
    marginBottom: Spacing.xs,
  },
  perNight: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    flex: 1,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  recommendedCard: {
    flexDirection: 'row',
    backgroundColor: THEME.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedImage: {
    width: 120,
    height: 120,
  },
  recommendedInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  recommendedName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 4,
  },
  recommendedPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: '#FF6B00',
    marginBottom: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  petTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  petTypeIcon: {
    fontSize: 24,
  },
  petTypeName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
});
