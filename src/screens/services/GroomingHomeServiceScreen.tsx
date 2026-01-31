import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingHomeService'>;

interface Groomer {
  id: string;
  name: string;
  type: string;
  rating: number;
  price: string;
  experience: string;
  location: string;
  image: any;
}

import { useAuth } from '../../contexts/AuthContext';
import standaloneAddressService, { Address } from '../../services/address/standaloneAddressService';
import GroomingService, { Salon } from '../../services/GroomingService';
import { ActivityIndicator } from 'react-native';
import { THEME } from '../../constants/theme';

export default function GroomingHomeServiceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data State
  const [groomers, setGroomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Info
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Loading address...');

  React.useEffect(() => {
    fetchGroomers();
    fetchUserAddress();
  }, []);

  React.useEffect(() => {
    if (user) {
      const name = user.name || `${user.firstName} ${user.lastName}`.trim();
      const phone = user.phone || '';
      setCustomerName(`${name} ${phone ? `(${phone})` : ''}`);
    }
  }, [user]);

  const fetchUserAddress = async () => {
    try {
      const addresses = await standaloneAddressService.getAddresses();
      if (addresses && addresses.length > 0) {
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        const parts = [
          defaultAddr.address_line1,
          defaultAddr.subdistrict,
          defaultAddr.district,
          defaultAddr.city,
          defaultAddr.state,
        ].filter(Boolean);
        setCustomerAddress(parts.join(', '));
      } else {
        setCustomerAddress('Belum ada alamat tersimpan.');
      }
    } catch (error) {
      setCustomerAddress('Gagal memuat alamat.');
    }
  };

  const fetchGroomers = async () => {
    try {
      setLoading(true);
      // Fetch salons (partners with type grooming/multi)
      // Ideally we filter by home_service=true if API supports it.
      // For now passing it in query just in case backend supports it later
      const response = await GroomingService.getSalons({ city: '' });

      const mapped = response.data.map((salon: any) => ({
        id: salon.id.toString(),
        name: salon.name,
        type: 'Grooming Salon', // Or check salon.partner_type
        rating: salon.rating || 5.0,
        price: 'Rp' + (salon.price_start || 50000).toLocaleString('id-ID'),
        experience: 'Professional', // Placeholder
        location: salon.address || salon.city || 'Jakarta',
        image: salon.photo_url ? { uri: salon.photo_url } : require('../../../assets/product-placeholder.jpg'),
      }));

      setGroomers(mapped);
    } catch (error) {
      console.error('Failed to fetch groomers:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleGroomerPress = (groomer: any) => {
    navigation.navigate('GroomingDetail', { groomingId: groomer.id });
  };

  const renderGroomerCard = (groomer: any, index: number) => (
    <TouchableOpacity
      key={groomer.id}
      style={[styles.groomerCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={() => handleGroomerPress(groomer)}
      activeOpacity={0.7}
    >
      <View style={styles.groomerImageContainer}>
        <Image source={groomer.image} style={styles.groomerImage} resizeMode="cover" />
      </View>

      <View style={styles.groomerInfo}>
        <Text style={styles.groomerName} numberOfLines={1}>{groomer.name}</Text>
        <Text style={styles.groomerType} numberOfLines={1}>{groomer.type}</Text>

        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{groomer.rating}</Text>
        </View>

        <Text style={styles.priceText}>{groomer.price}</Text>

        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{groomer.location}</Text>
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
          <Text style={styles.headerTitle}>Salon - Home Service</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={22} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Date Selection */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={handleDatePicker}
            >
              <Text style={[styles.dateText, !selectedDate && styles.dateTextPlaceholder]}>
                {selectedDate || 'Pilih Tanggal'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Customer Info */}
          <View style={styles.customerSection}>
            <View style={styles.customerInfo}>
              <View style={styles.customerHeader}>
                <Text style={styles.customerName}>{customerName}</Text>
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.customerAddress}>{customerAddress}</Text>
                <TouchableOpacity style={styles.editAddressButton}>
                  <MaterialIcons name="edit" size={18} color={THEME.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Promo Banner */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dapatkan Promonya</Text>
            <View style={styles.promoBanner}>
              <Image
                source={require('../../../assets/Grooming Maskot.png')}
                style={styles.promoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Groomer Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi Groomer Untuk Kamu</Text>

            {loading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.primary} />
              </View>
            ) : groomers.length > 0 ? (
              <View style={styles.groomersGrid}>
                {groomers.map((groomer, index) => renderGroomerCard(groomer, index))}
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: THEME.textSecondary, marginTop: 20 }}>
                Tidak ada salon grooming tersedia.
              </Text>
            )}
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
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: Spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    backgroundColor: THEME.white,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  dateTextPlaceholder: {
    color: THEME.textSecondary,
  },
  customerSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  customerInfo: {
    backgroundColor: '#EEF6FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  customerHeader: {
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerAddress: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  editAddressButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  promoBanner: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#00B4D8',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  groomersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  groomerCard: {
    width: CARD_WIDTH,
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLeft: {
    marginRight: Spacing.md / 2,
  },
  cardRight: {
    marginLeft: Spacing.md / 2,
  },
  groomerImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  groomerImage: {
    width: '100%',
    height: '100%',
  },
  groomerInfo: {
    padding: Spacing.md,
  },
  groomerName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  groomerType: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: Spacing.xs,
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
  priceText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.primary,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  experienceText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  locationText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
});
