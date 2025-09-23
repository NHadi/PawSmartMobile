import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
  Platform,
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

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'DoctorHomeService'>;

interface BookingData {
  selectedDate: string;
  customerName: string;
  customerAddress: string;
}

export default function DoctorHomeServiceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedDate: '',
    customerName: 'Jaya M (+6282337709390)',
    customerAddress: 'Jl. K.H. Mas Mansyur No. 8A, RT.10/RW.6, Karet Tengsin, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10220.',
  });
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
    setBookingData({ ...bookingData, selectedDate: formatted });
  };

  const handleAddressEdit = () => {
    // Navigate to address editing screen
    Alert.alert('Edit Address', 'Edit alamat akan diimplementasikan');
  };

  const handleSearchDoctor = () => {
    if (!bookingData.selectedDate) {
      Alert.alert('Error', 'Silakan pilih tanggal terlebih dahulu');
      return;
    }
    // Navigate to doctor search results screen
    Alert.alert('Success', 'Mencari dokter tersedia...');
  };

  const handleDeleteHistory = (type: string, doctorName: string) => {
    Alert.alert(
      'Hapus Riwayat',
      `Hapus riwayat ${type} dengan ${doctorName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => {
          // Handle delete action here
        }},
      ]
    );
  };

  const historyItems = [
    {
      type: 'Sterilisasi',
      doctor: 'dr. Taylor Swift Jasmine',
      date: 'Jumat, 9 May 2025',
    },
    {
      type: 'Diagnostik Laboratorium',
      doctor: 'dr. Taylor Swift Jasmine',
      date: 'Jumat, 9 May 2025',
    },
  ];

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
        <Text style={styles.headerTitle}>Dokter - Home Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Selection */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={handleDatePicker}
          >
            <MaterialIcons name="calendar-today" size={20} color={Colors.text.tertiary} />
            <Text style={[styles.dateText, !bookingData.selectedDate && styles.dateTextPlaceholder]}>
              {bookingData.selectedDate || 'Pilih Tanggal'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
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

        {/* Search Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[
              styles.searchButton,
              !bookingData.selectedDate && styles.searchButtonDisabled
            ]}
            onPress={handleSearchDoctor}
            disabled={!bookingData.selectedDate}
          >
            <Text style={styles.searchButtonText}>Cari Dokter Home Service</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Riwayat Pencarian</Text>
            <TouchableOpacity>
              <Text style={styles.historyAction}>Hapus Riwayat</Text>
            </TouchableOpacity>
          </View>

          {historyItems.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyItemContent}>
                <Text style={styles.historyItemTitle}>{item.type}</Text>
                <Text style={styles.historyItemDoctor}>{item.doctor}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <TouchableOpacity 
                style={styles.historyDeleteButton}
                onPress={() => handleDeleteHistory(item.type, item.doctor)}
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
                Nikmati layanan dokter hewan terbaik dengan promo spesial!
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: Spacing.sm,
    flex: 1,
  },
  dateTextPlaceholder: {
    color: Colors.text.tertiary,
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
  searchButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  historyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  historyAction: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  historyItemContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  historyItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  historyItemDoctor: {
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
    borderWidth: 1,
    borderColor: Colors.border.light,
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
});