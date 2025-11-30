import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'HotelDetail'>;
type HotelDetailRouteProp = RouteProp<ServicesStackParamList, 'HotelDetail'>;

interface Room {
  id: string;
  name: string;
  petType: string;
  size: string;
  price: string;
  features: string[];
  image: any;
}

interface Review {
  id: string;
  userName: string;
  date: string;
  comment: string;
  rating: number;
}

interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: string;
  location: string;
  distance: string;
  image: any;
}

const mockImages = [
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
];

const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Dog Premium Room',
    petType: 'Anjing',
    size: '3x3m',
    price: 'Rp80.000',
    features: ['2 tempat makan', '1 Ekor'],
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Dog VIP Room',
    petType: 'Anjing',
    size: '5x5m',
    price: 'Rp80.000',
    features: ['2 tempat makan', '1-2 Ekor'],
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

const mockReviews: Review[] = [
  {
    id: '1',
    userName: 'User',
    date: '2 Juni 2025',
    comment: 'This is the first time I have used this service. The room was very powerful!',
    rating: 5,
  },
  {
    id: '2',
    userName: 'User',
    date: '2 Juni 2025',
    comment: 'This is the first time I have used this service. The room was very powerful!',
    rating: 5,
  },
];

const mockOtherHotels: Hotel[] = [
  {
    id: '10',
    name: 'Happy Paws Hotel',
    rating: 4.9,
    reviews: 1000,
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '11',
    name: 'Happy Paws Hotel',
    rating: 4.9,
    reviews: 1000,
    price: 'Rp80.000',
    location: 'Karet, Jakarta Pusat',
    distance: '1.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

const facilities = [
  { id: '1', name: 'AC', icon: 'air-conditioner' },
  { id: '2', name: 'WiFi', icon: 'wifi' },
  { id: '3', name: 'Kulkas', icon: 'fridge-outline' },
  { id: '4', name: 'CCTV', icon: 'cctv' },
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

export default function HotelDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HotelDetailRouteProp>();
  const { hotelId } = route.params;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedRules, setExpandedRules] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
  };

  const handleRoomPress = (room: Room) => {
    navigation.navigate('HotelRoomDetail', { hotelId, roomId: room.id });
  };

  const handleOtherHotelPress = (hotel: Hotel) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.id });
  };

  const handleSelectRoom = () => {
    // Scroll to rooms section or select first room
    if (mockRooms.length > 0) {
      navigation.navigate('HotelRoomDetail', { hotelId, roomId: mockRooms[0].id });
    }
  };

  const renderImageItem = ({ item }: { item: any }) => (
    <Image source={item} style={styles.carouselImage} resizeMode="cover" />
  );

  const renderRoomCard = (room: Room) => (
    <TouchableOpacity
      key={room.id}
      style={styles.roomCard}
      onPress={() => handleRoomPress(room)}
      activeOpacity={0.7}
    >
      <Image source={room.image} style={styles.roomImage} resizeMode="cover" />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomSize}>{room.size} • {room.features.join(' • ')}</Text>
        <Text style={styles.roomPrice}>{room.price}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={THEME.textSecondary} />
    </TouchableOpacity>
  );

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <MaterialIcons
              key={star}
              name="star"
              size={14}
              color={star <= review.rating ? '#FFB800' : THEME.border}
            />
          ))}
        </View>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

  const renderOtherHotelCard = (hotel: Hotel) => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.otherHotelCard}
      onPress={() => handleOtherHotelPress(hotel)}
      activeOpacity={0.7}
    >
      <Image source={hotel.image} style={styles.otherHotelImage} resizeMode="cover" />
      <View style={styles.otherHotelInfo}>
        <Text style={styles.otherHotelName} numberOfLines={1}>{hotel.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={12} color="#FFB800" />
          <Text style={styles.ratingText}>{hotel.rating}</Text>
        </View>
        <Text style={styles.otherHotelPrice}>{hotel.price}<Text style={styles.perNight}>/malam</Text></Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={mockImages}
              renderItem={renderImageItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />

            {/* Back Button */}
            <SafeAreaView style={styles.headerOverlay} edges={['top']}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="chevron-left" size={28} color={THEME.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Detail Hotel</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton}>
                  <Ionicons name="share-outline" size={22} color={THEME.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsFavorite(!isFavorite)}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFavorite ? '#FF6B6B' : THEME.white}
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* Image Indicator */}
            <View style={styles.imageIndicator}>
              <MaterialIcons name="photo-library" size={16} color={THEME.white} />
              <Text style={styles.imageIndicatorText}>
                {currentImageIndex + 1}/{mockImages.length}
              </Text>
            </View>
          </View>

          {/* Hotel Info */}
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>Happy Paws Hotel</Text>
            <Text style={styles.hotelType}>Hotel Hewan, Pet Boarding</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>Karet, Jakarta Timur</Text>
              <Text style={styles.distanceText}>3.4 km</Text>
            </View>
            <TouchableOpacity style={styles.directButton}>
              <MaterialIcons name="directions" size={20} color={THEME.primary} />
              <Text style={styles.directButtonText}>Direct</Text>
            </TouchableOpacity>
          </View>

          {/* About Hotel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Hotel</Text>
            <Text style={styles.aboutText}>
              Lorem ipsum dolor sit amet consectetur. Tellus odio hac consectetur adipiscing a.
              Nisl quam pretium tortor massa integer orci suspendisse etiam
            </Text>
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fasilitas umum</Text>
            <View style={styles.facilitiesGrid}>
              {facilities.map(facility => (
                <View key={facility.id} style={styles.facilityItem}>
                  <MaterialCommunityIcons
                    name={facility.icon as any}
                    size={24}
                    color={THEME.textSecondary}
                  />
                  <Text style={styles.facilityName}>{facility.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Available Rooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kamar Tersedia</Text>
            {mockRooms.map(room => renderRoomCard(room))}
          </View>

          {/* Rules & Terms */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.rulesHeader}
              onPress={() => setExpandedRules(!expandedRules)}
            >
              <Text style={styles.sectionTitle}>Aturan & Syarat</Text>
              <MaterialIcons
                name={expandedRules ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={THEME.textPrimary}
              />
            </TouchableOpacity>
            {expandedRules && (
              <View style={styles.rulesContent}>
                <Text style={styles.ruleItem}>• Wajib membawa buku vaksin (max 1 th)</Text>
                <Text style={styles.ruleItem}>• Hwan tidak sedang sakit atau hamil</Text>
                <Text style={styles.ruleItem}>• Check-in max jam 17:00</Text>
                <Text style={styles.ruleItem}>• Check-out sebelum jam 14:00</Text>
              </View>
            )}
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Ulasan Terbaru</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Lihat Semua Ulasan</Text>
              </TouchableOpacity>
            </View>
            {mockReviews.map(review => renderReviewCard(review))}
          </View>

          {/* Other Hotels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Lainnya</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.otherHotelsScroll}
            >
              {mockOtherHotels.map(hotel => renderOtherHotelCard(hotel))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Mulai dari</Text>
            <Text style={styles.totalPrice}>Rp80.000</Text>
          </View>
          <TouchableOpacity style={styles.selectButton} onPress={handleSelectRoom}>
            <Text style={styles.selectButtonText}>Pilih Kamar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    position: 'relative',
    height: 250,
  },
  carouselImage: {
    width: width,
    height: 250,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  imageIndicatorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.white,
  },
  hotelInfo: {
    padding: Spacing.lg,
    backgroundColor: THEME.white,
  },
  hotelName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.xs,
  },
  hotelType: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  distanceText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  directButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  directButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: THEME.white,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: Spacing.md,
  },
  aboutText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  facilityItem: {
    alignItems: 'center',
    width: 60,
  },
  facilityName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  roomImage: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  roomSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.primary,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rulesContent: {
    marginTop: Spacing.md,
  },
  ruleItem: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  reviewCard: {
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  reviewComment: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    lineHeight: 20,
  },
  otherHotelsScroll: {
    gap: Spacing.md,
  },
  otherHotelCard: {
    width: 140,
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  otherHotelImage: {
    width: '100%',
    height: 90,
  },
  otherHotelInfo: {
    padding: Spacing.sm,
  },
  otherHotelName: {
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
  otherHotelPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.primary,
  },
  perNight: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  totalPrice: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  selectButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
});
