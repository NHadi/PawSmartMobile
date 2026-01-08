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

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'DoctorHomeService'>;

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  price: string;
  location: string;
  image: any;
  isAvailable24: boolean;
}

const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'dr. Taylor Swift Jasmine',
    specialization: 'Dokter Spesialis Hewan',
    rating: 4.9,
    price: 'Rp350.000',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
    isAvailable24: true,
  },
  {
    id: '2',
    name: 'dr. Taylor Swift Jasmine',
    specialization: 'Dokter Spesialis Hewan',
    rating: 4.9,
    price: 'Rp350.000',
    location: 'Jakarta Timur',
    image: require('../../../assets/product-placeholder.jpg'),
    isAvailable24: false,
  },
  {
    id: '3',
    name: 'dr. Taylor Swift Jasmine',
    specialization: 'Dokter Spesialis Hewan',
    rating: 4.8,
    price: 'Rp300.000',
    location: 'Jakarta Selatan',
    image: require('../../../assets/product-placeholder.jpg'),
    isAvailable24: true,
  },
  {
    id: '4',
    name: 'dr. Taylor Swift Jasmine',
    specialization: 'Dokter Spesialis Hewan',
    rating: 4.7,
    price: 'Rp280.000',
    location: 'Jakarta Barat',
    image: require('../../../assets/product-placeholder.jpg'),
    isAvailable24: false,
  },
];

import { THEME } from '../../constants/theme';

import DoctorService, { Doctor as DoctorModel } from '../../services/DoctorService';
import { ActivityIndicator } from 'react-native';

export default function DoctorHomeServiceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedDate, setSelectedDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [doctors, setDoctors] = useState<DoctorModel[]>([]);
  const [loading, setLoading] = useState(true);

  const customerName = 'Alan Syahlan (+6282337709390)';
  const customerAddress = 'Jl. K.H. Mas Mansyur No. 8A, RT.10/RW.6, Karet Tengsin, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10220.';

  React.useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await DoctorService.getDoctors({ offers_home_service: true });
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetching doctors:', error);
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

  const handleDoctorPress = (doctor: DoctorModel) => {
    navigation.navigate('DoctorDetail', { doctorId: doctor.id.toString() });
  };

  const renderDoctorCard = (doctor: DoctorModel, index: number) => (
    <TouchableOpacity
      key={doctor.id}
      style={[styles.doctorCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={() => handleDoctorPress(doctor)}
      activeOpacity={0.7}
    >
      <View style={styles.doctorImageContainer}>
        <Image
          source={doctor.photo ? { uri: doctor.photo } : require('../../../assets/product-placeholder.jpg')}
          style={styles.doctorImage}
          resizeMode="cover"
        />
        {doctor.is_available && (
          <View style={styles.badge24}>
            <Text style={styles.badge24Text}>24H</Text>
          </View>
        )}
      </View>

      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
        <Text style={styles.doctorSpecialization} numberOfLines={1}>{doctor.specialization}</Text>

        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{doctor.rating || 'N/A'}</Text>
        </View>

        <Text style={styles.priceText}>Rp{Number(doctor.home_service_fee || 0).toLocaleString('id-ID')}</Text>
        <Text style={styles.locationText}>{doctor.location || 'Jakarta'}</Text>
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
          <Text style={styles.headerTitle}>Dokter - Home Service</Text>
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
                source={require('../../../assets/Doctor Maskot.png')}
                style={styles.promoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Doctor Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi Dokter Untuk Kamu</Text>

            {loading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.primary} />
              </View>
            ) : doctors.length > 0 ? (
              <View style={styles.doctorsGrid}>
                {doctors.map((doctor, index) => renderDoctorCard(doctor, index))}
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: THEME.textSecondary, marginTop: 20 }}>
                Tidak ada dokter tersedia untuk Home Service saat ini.
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
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doctorCard: {
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
  doctorImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  badge24: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: '#FF3B30',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badge24Text: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.white,
  },
  doctorInfo: {
    padding: Spacing.md,
  },
  doctorName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  doctorSpecialization: {
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
    marginBottom: 2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
});
