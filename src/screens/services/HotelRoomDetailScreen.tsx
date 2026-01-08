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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'HotelRoomDetail'>;
type HotelRoomDetailRouteProp = RouteProp<ServicesStackParamList, 'HotelRoomDetail'>;

interface RoomInfo {
  id: string;
  icon: string;
  label: string;
}

interface RoomService {
  id: string;
  icon: string;
  label: string;
}

const mockImages = [
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
  require('../../../assets/product-placeholder.jpg'),
];

const roomInfo: RoomInfo[] = [
  { id: '1', icon: 'resize', label: '2x2m' },
  { id: '2', icon: 'bed-outline', label: 'Kasur empuk' },
  { id: '3', icon: 'paw', label: '1 Ekor' },
];

const roomServices: RoomService[] = [
  { id: '1', icon: 'content-cut', label: 'Grooming' },
  { id: '2', icon: 'walk', label: 'Jalan-jalan ekstra' },
  { id: '3', icon: 'stethoscope', label: 'Pemeriksaan' },
  { id: '4', icon: 'food-apple', label: 'Makanan Organik' },
];

import { THEME } from '../../constants/theme';

export default function HotelRoomDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HotelRoomDetailRouteProp>();
  const { hotelId, roomId } = route.params;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
  };

  const formatDate = (date: Date) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const onCheckInChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || checkInDate;
    setShowCheckInPicker(Platform.OS === 'ios');
    setCheckInDate(currentDate);
    // Ensure checkout is at least 1 day after checkin
    if (currentDate >= checkOutDate) {
      setCheckOutDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const onCheckOutChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || checkOutDate;
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (currentDate > checkInDate) {
      setCheckOutDate(currentDate);
    }
  };

  const handleSelectRoom = () => {
    navigation.navigate('HotelBooking', {
      hotelId,
      hotelName: 'Happy Paws Hotel',
      roomId,
      roomName: 'Dog Premium Room',
      checkInDate: formatDate(checkInDate),
      checkOutDate: formatDate(checkOutDate),
      price: 80000,
    });
  };

  const renderImageItem = ({ item }: { item: any }) => (
    <Image source={item} style={styles.carouselImage} resizeMode="cover" />
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
          <Text style={styles.headerTitle}>Detail Kamar</Text>
          <View style={styles.headerSpacer} />
        </View>

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
            {/* Image Indicator */}
            <View style={styles.imageIndicator}>
              <MaterialIcons name="photo-library" size={14} color={THEME.white} />
              <Text style={styles.imageIndicatorText}>
                {currentImageIndex + 1}/{mockImages.length}
              </Text>
            </View>
          </View>

          {/* Room Name */}
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>Dog Premium Room</Text>
            <Text style={styles.petType}>Anjing</Text>
          </View>

          {/* Room Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Informasi Kamar</Text>
            </View>
            <View style={styles.infoGrid}>
              {roomInfo.map(info => (
                <View key={info.id} style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name={info.icon as any}
                    size={24}
                    color={THEME.textSecondary}
                  />
                  <Text style={styles.infoLabel}>{info.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Room Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Fasilitas & Layanan Kamar</Text>
            </View>
            <View style={styles.servicesGrid}>
              {roomServices.map(service => (
                <View key={service.id} style={styles.serviceItem}>
                  <MaterialCommunityIcons
                    name={service.icon as any}
                    size={20}
                    color={THEME.primary}
                  />
                  <Text style={styles.serviceLabel}>{service.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Pilih Tanggal</Text>
            </View>
            <View style={styles.dateSelectionContainer}>
              <TouchableOpacity
                style={styles.dateItem}
                onPress={() => setShowCheckInPicker(true)}
              >
                <Text style={styles.dateLabel}>Check-in</Text>
                <View style={styles.dateValueRow}>
                  <Text style={styles.dateValue}>{formatDate(checkInDate)}</Text>
                  <MaterialIcons name="calendar-today" size={18} color={THEME.primary} />
                </View>
              </TouchableOpacity>
              <View style={styles.dateDivider} />
              <TouchableOpacity
                style={styles.dateItem}
                onPress={() => setShowCheckOutPicker(true)}
              >
                <Text style={styles.dateLabel}>Check-out</Text>
                <View style={styles.dateValueRow}>
                  <Text style={styles.dateValue}>{formatDate(checkOutDate)}</Text>
                  <MaterialIcons name="calendar-today" size={18} color={THEME.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.totalPrice}>Rp80.000</Text>
            <Text style={styles.perNight}>/malam</Text>
          </View>
          <TouchableOpacity style={styles.selectButton} onPress={handleSelectRoom}>
            <Text style={styles.selectButtonText}>Pilih Kamar</Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showCheckInPicker && (
          <DateTimePicker
            testID="checkInPicker"
            value={checkInDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckInChange}
            minimumDate={new Date()}
          />
        )}
        {showCheckOutPicker && (
          <DateTimePicker
            testID="checkOutPicker"
            value={checkOutDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckOutChange}
            minimumDate={new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)}
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
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    position: 'relative',
    height: 220,
  },
  carouselImage: {
    width: width,
    height: 220,
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
  roomHeader: {
    padding: Spacing.lg,
    backgroundColor: THEME.white,
  },
  roomName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.xs,
  },
  petType: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.primary,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: THEME.white,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: THEME.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    gap: Spacing.sm,
  },
  serviceLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  dateSelectionContainer: {
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dateItem: {
    paddingVertical: Spacing.sm,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  dateValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  dateDivider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: Spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalPrice: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  perNight: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginLeft: 4,
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
