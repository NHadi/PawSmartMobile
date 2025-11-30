import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'HotelList'>;
type HotelListRouteProp = RouteProp<ServicesStackParamList, 'HotelList'>;

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

type FilterType = 'terdekat' | 'terlaris' | 'harga';

const mockHotels: Hotel[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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

const THEME = {
  primary: Colors.primary.main,
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  border: Colors.border.light,
  white: '#FFFFFF',
};

export default function HotelListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HotelListRouteProp>();
  const { location, date, petType } = route.params || {};

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('terdekat');

  const handleHotelPress = (hotel: Hotel) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.id });
  };

  const handleSearchPress = () => {
    navigation.navigate('HotelSearch');
  };

  const renderFilterChip = (filter: FilterType, label: string, hasDropdown?: boolean) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipSelected,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === filter && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
      {hasDropdown && (
        <MaterialIcons
          name="keyboard-arrow-down"
          size={18}
          color={selectedFilter === filter ? THEME.white : THEME.textPrimary}
        />
      )}
    </TouchableOpacity>
  );

  const renderHotelCard = (hotel: Hotel) => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.hotelCard}
      onPress={() => handleHotelPress(hotel)}
      activeOpacity={0.7}
    >
      <Image source={hotel.image} style={styles.hotelImage} resizeMode="cover" />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{hotel.rating}</Text>
          <Text style={styles.reviewsText}>{hotel.reviews}rb ulasan</Text>
        </View>
        <Text style={styles.originalPrice}>{hotel.originalPrice}</Text>
        <Text style={styles.currentPrice}>
          {hotel.price}
          <Text style={styles.perNight}>/malam</Text>
        </Text>
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

        {/* Search Criteria Display */}
        <View style={styles.searchCriteria}>
          <View style={styles.criteriaItem}>
            <Text style={styles.criteriaText}>{location || 'Jakarta Pusat'}</Text>
            <MaterialIcons name="location-on" size={18} color={THEME.textSecondary} />
          </View>
          <View style={styles.criteriaItem}>
            <Text style={styles.criteriaText}>{date || 'Kam, 28 Agu 2025'}</Text>
            <MaterialIcons name="calendar-today" size={18} color={THEME.textSecondary} />
          </View>
          <View style={styles.criteriaItem}>
            <Text style={styles.criteriaText}>{petType || 'Kucing'}</Text>
            <MaterialIcons name="pets" size={18} color={THEME.textSecondary} />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {renderFilterChip('terdekat', 'Terdekat')}
            {renderFilterChip('terlaris', 'Terlaris')}
            {renderFilterChip('harga', 'Harga', true)}
          </ScrollView>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={20} color={THEME.textPrimary} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Hotel List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {mockHotels.map(hotel => renderHotelCard(hotel))}
        </ScrollView>
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
  searchCriteria: {
    backgroundColor: THEME.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  criteriaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.lg,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  filterChipTextSelected: {
    color: THEME.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: THEME.border,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  hotelCard: {
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
  hotelImage: {
    width: 120,
    height: 130,
  },
  hotelInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 4,
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
    fontSize: Typography.fontSize.base,
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
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    flex: 1,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
});
