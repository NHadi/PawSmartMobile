import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'HotelSearch'>;

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

interface SearchHistory {
  id: string;
  query: string;
}

const mockSearchHistory: SearchHistory[] = [
  { id: '1', query: 'lorem' },
  { id: '2', query: 'lorem' },
  { id: '3', query: 'lorem' },
  { id: '4', query: 'lorem' },
];

const mockRecommendedHotels: Hotel[] = [
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
];

import { THEME } from '../../constants/theme';

export default function HotelSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(mockSearchHistory);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('HotelList', {
        location: searchQuery,
      });
    }
  };

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    navigation.navigate('HotelList', {
      location: query,
    });
  };

  const handleDeleteHistory = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleHotelPress = (hotel: Hotel) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.id });
  };

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
        {/* Header with Search */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={THEME.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={THEME.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari hotel..."
              placeholderTextColor={THEME.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={THEME.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search History Section */}
          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pencarian Terakhir</Text>
              {searchHistory.map(item => (
                <View key={item.id} style={styles.historyItem}>
                  <TouchableOpacity
                    style={styles.historyContent}
                    onPress={() => handleHistoryPress(item.query)}
                  >
                    <MaterialIcons name="history" size={20} color={THEME.textSecondary} />
                    <Text style={styles.historyText}>{item.query}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHistory(item.id)}
                  >
                    <MaterialIcons name="close" size={18} color={THEME.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Hotel Rekomendasi Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Rekomendasi</Text>
            {mockRecommendedHotels.map(hotel => renderRecommendedCard(hotel))}
          </View>
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
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  historyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  deleteButton: {
    padding: Spacing.xs,
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
  recommendedPrice: {
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
});
