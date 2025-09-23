import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingHomeService'>;

interface BookingData {
  selectedDate: string;
  customerName: string;
  customerAddress: string;
}

interface Groomer {
  id: string;
  name: string;
  type: string;
  rating: number;
  price: number;
  experience: string;
  location: string;
  image: any;
}

interface HistoryItem {
  type: string;
  groomer: string;
  date: string;
}

const mockGroomers: Groomer[] = [
  {
    id: '1',
    name: 'Michelle Andriani',
    type: 'Groomer',
    rating: 4.9,
    price: 90000,
    experience: '2th Pengalaman',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Michelle Andriani',
    type: 'Groomer',
    rating: 4.9,
    price: 90000,
    experience: '2th Pengalaman',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '3',
    name: 'Michelle Andriani',
    type: 'Groomer',
    rating: 4.9,
    price: 90000,
    experience: '2th Pengalaman',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '4',
    name: 'Michelle Andriani',
    type: 'Groomer',
    rating: 4.9,
    price: 90000,
    experience: '2th Pengalaman',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

export default function GroomingHomeServiceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedDate: '',
    customerName: 'Jaya M (+6282337709390)',
    customerAddress: 'Jl. K.H. Mas Mansyur No. 8A, RT.10/RW.6, Karet Tengsin, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10220.',
  });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGroomerList, setShowGroomerList] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Terkait');
  const [historyItems] = useState<HistoryItem[]>([
    { type: 'Groomer', groomer: 'Michelle Andriani', date: 'Jumat, 9 May 2025' },
    { type: 'Groomer', groomer: 'Jasmine Putri', date: 'Jumat, 9 May 2025' },
  ]);

  const filters = ['Terkait', 'Terlaris', 'Harga'];

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
    setBookingData({ ...bookingData, selectedDate: formatted });
  };

  const handleSearchGroomer = () => {
    if (!bookingData.selectedDate) {
      Alert.alert('Pilih Tanggal', 'Silakan pilih tanggal terlebih dahulu');
      return;
    }
    setShowGroomerList(true);
  };

  const handleDeleteHistory = (type: string, groomer: string) => {
    };

  const handleAddressEdit = () => {
    Alert.alert('Edit Address', 'Edit alamat akan diimplementasikan');
  };

  const renderGroomerCard = ({ item, index }: { item: Groomer; index: number }) => {
    const isLeftColumn = index % 2 === 0;
    return (
      <TouchableOpacity 
        style={[styles.groomerCard, isLeftColumn && styles.groomerCardLeft]}
        onPress={() => {
          // Navigate to groomer detail or booking
          }}
      >
        <Image source={item.image} style={styles.groomerImage} />
        
        <View style={styles.groomerInfo}>
          <Text style={styles.groomerName}>{item.name}</Text>
          <Text style={styles.groomerType}>{item.type}</Text>
          
          <View style={styles.groomerMeta}>
            <View style={styles.rating}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>
          
          <Text style={styles.groomerPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
          
          <View style={styles.locationRow}>
            <Text style={styles.experience}>{item.experience}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (showGroomerList) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowGroomerList(false)}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salon - Home Service</Text>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialIcons name="search" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.locationSection}>
          <MaterialIcons name="location-on" size={20} color={Colors.text.secondary} />
          <Text style={styles.locationText}>Tebet, Jakarta Selatan</Text>
        </View>

        {/* Title */}
        <Text style={styles.recommendationTitle}>Rekomendasi Groomer Untuk Kamu</Text>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive
                ]}>
                  {filter}
                  {filter === 'Harga' && (
                    <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary.main} />
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={20} color={Colors.text.secondary} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Groomer Grid */}
        <FlatList
          data={mockGroomers}
          renderItem={renderGroomerCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.groomerList}
          columnWrapperStyle={styles.groomerRow}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salon - Home Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Customer Info Section */}
        <View style={styles.section}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{bookingData.customerName}</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.customerAddress}>{bookingData.customerAddress}</Text>
              <TouchableOpacity 
                style={styles.editAddressButton}
                onPress={handleAddressEdit}
              >
                <MaterialIcons name="edit" size={20} color={Colors.primary.main} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dateSelector} onPress={handleDatePicker}>
            <Text style={[styles.dateText, !bookingData.selectedDate && styles.dateTextPlaceholder]}>
              {bookingData.selectedDate || 'Pilih Tanggal'}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.searchGroomerButton, !bookingData.selectedDate && styles.searchGroomerButtonDisabled]}
            onPress={handleSearchGroomer}
            disabled={!bookingData.selectedDate}
          >
            <Text style={styles.searchGroomerButtonText}>Cari Salon Home Service</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Riwayat Pencarian</Text>
            <TouchableOpacity>
              <Text style={styles.clearHistoryText}>Hapus Riwayat</Text>
            </TouchableOpacity>
          </View>
          
          {historyItems.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyItemContent}>
                <Text style={styles.historyItemTitle}>{item.type}</Text>
                <Text style={styles.historyItemGroomer}>{item.groomer}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <TouchableOpacity 
                style={styles.historyDeleteButton}
                onPress={() => handleDeleteHistory(item.type, item.groomer)}
              >
                <MaterialIcons name="delete-outline" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Promo Section */}
        <View style={styles.section}>
          <Text style={styles.promoTitle}>Dapatkan Promonya</Text>
          <TouchableOpacity style={styles.promoCard}>
            <Image
              source={require('../../../assets/mascot-happy.png')}
              style={styles.promoImage}
              resizeMode="contain"
            />
            <View style={styles.promoContent}>
              <Text style={styles.promoText}>
                Nikmati layanan grooming terbaik dengan promo spesial!
              </Text>
            </View>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
  searchButton: {
    padding: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  customerInfo: {
    gap: Spacing.md,
  },
  customerName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  customerAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  editAddressButton: {
    padding: Spacing.xs,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.tertiary,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  dateTextPlaceholder: {
    color: Colors.text.tertiary,
  },
  searchGroomerButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  searchGroomerButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  searchGroomerButtonDisabled: {
    opacity: 0.5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  clearHistoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  historyItemGroomer: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  historyItemDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  historyDeleteButton: {
    padding: Spacing.sm,
  },
  promoTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  promoImage: {
    width: 80,
    height: 80,
    marginRight: Spacing.md,
  },
  promoContent: {
    flex: 1,
  },
  promoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterTabActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: Colors.text.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  groomerList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  groomerRow: {
    justifyContent: 'space-between',
  },
  groomerCard: {
    flex: 0.48,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groomerCardLeft: {
    marginRight: Spacing.sm,
  },
  groomerImage: {
    width: '100%',
    height: 120,
  },
  groomerInfo: {
    padding: Spacing.sm,
  },
  groomerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  groomerType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  groomerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  groomerPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  experience: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  location: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
});