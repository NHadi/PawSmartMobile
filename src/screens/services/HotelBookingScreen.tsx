import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import standaloneAddressService from '../../services/address/standaloneAddressService';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'HotelBooking'>;
type HotelBookingRouteProp = RouteProp<ServicesStackParamList, 'HotelBooking'>;

interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: string;
  age: string;
  image: any;
}

const mockPet: Pet = {
  id: '1',
  name: 'Name Pet',
  breed: 'Anjing, Chihuahua',
  gender: 'Jantan',
  age: '1 tahun',
  image: require('../../../assets/product-placeholder.jpg'),
};

const THEME = {
  primary: Colors.primary.main,
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  border: Colors.border.light,
  white: '#FFFFFF',
};

export default function HotelBookingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HotelBookingRouteProp>();
  const { hotelId, hotelName, roomId, roomName, checkInDate, checkOutDate, price } = route.params;
  const { user } = useAuth();

  const [selectedPet, setSelectedPet] = useState<Pet>(mockPet);
  const [isPetHealthy, setIsPetHealthy] = useState<boolean | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Expandable sections
  const [customerExpanded, setCustomerExpanded] = useState(true);
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Time pickers
  const [checkInTime, setCheckInTime] = useState(new Date());
  const [checkOutTime, setCheckOutTime] = useState(new Date());
  const [showCheckInTimePicker, setShowCheckInTimePicker] = useState(false);
  const [showCheckOutTimePicker, setShowCheckOutTimePicker] = useState(false);

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    try {
      const addresses = await standaloneAddressService.getAddresses();
      if (addresses.length > 0) {
        const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading address:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const onCheckInTimeChange = (event: any, selectedTime?: Date) => {
    setShowCheckInTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setCheckInTime(selectedTime);
    }
  };

  const onCheckOutTimeChange = (event: any, selectedTime?: Date) => {
    setShowCheckOutTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setCheckOutTime(selectedTime);
    }
  };

  const handleSubmit = () => {
    if (!isPetHealthy) {
      Alert.alert('Perhatian', 'Hewan peliharaan harus dalam keadaan sehat untuk menginap di hotel.');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Perhatian', 'Anda harus menyetujui syarat & ketentuan untuk melanjutkan.');
      return;
    }

    // Navigate to payment or success
    Alert.alert(
      'Permintaan Terkirim',
      'Permintaan booking hotel Anda telah terkirim. Tim kami akan menghubungi Anda segera.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ServicesHome'),
        },
      ]
    );
  };

  const renderSection = (
    title: string,
    expanded: boolean,
    onToggle: () => void,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={THEME.textPrimary}
        />
      </TouchableOpacity>
      {expanded && children}
    </View>
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
          <Text style={styles.headerTitle}>Booking Hotel</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Customer Details Section */}
          {renderSection(
            'Detail Pelanggan',
            customerExpanded,
            () => setCustomerExpanded(!customerExpanded),
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nama</Text>
                <Text style={styles.detailValue}>{user?.name || 'Guest'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>No. Handphone</Text>
                <Text style={styles.detailValue}>
                  {selectedAddress?.phone || user?.phone || '-'}
                </Text>
              </View>
              <View style={styles.detailRowWithAction}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Alamat</Text>
                  <Text style={styles.detailValue}>
                    {selectedAddress?.city || 'Jakarta Pusat'}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.changeText}>Ganti</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pet Selection Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Pilih Hewan Peliharaan</Text>
            </View>
            <View style={styles.petCard}>
              <Image source={selectedPet.image} style={styles.petImage} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{selectedPet.name}</Text>
                <Text style={styles.petDetails}>{selectedPet.breed}</Text>
                <Text style={styles.petDetails}>{selectedPet.gender}, {selectedPet.age}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PetSelection')}>
                <Text style={styles.changeText}>Ganti</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pet Health Confirmation */}
          <View style={styles.section}>
            <Text style={styles.healthQuestion}>Apakah hewan dalam keadaan sehat?</Text>
            <View style={styles.healthOptions}>
              <TouchableOpacity
                style={[
                  styles.healthOption,
                  isPetHealthy === true && styles.healthOptionSelected,
                ]}
                onPress={() => setIsPetHealthy(true)}
              >
                <Text
                  style={[
                    styles.healthOptionText,
                    isPetHealthy === true && styles.healthOptionTextSelected,
                  ]}
                >
                  Iya
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.healthOption,
                  isPetHealthy === false && styles.healthOptionSelectedNo,
                ]}
                onPress={() => setIsPetHealthy(false)}
              >
                <Text
                  style={[
                    styles.healthOptionText,
                    isPetHealthy === false && styles.healthOptionTextSelected,
                  ]}
                >
                  Tidak
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Details Section */}
          {renderSection(
            'Pesanan',
            orderExpanded,
            () => setOrderExpanded(!orderExpanded),
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hotel</Text>
                <Text style={styles.detailValue}>{hotelName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kamar</Text>
                <Text style={styles.detailValue}>{roomName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in *</Text>
                <View style={styles.dateTimeRow}>
                  <Text style={styles.detailValue}>{checkInDate}</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowCheckInTimePicker(true)}
                  >
                    <Text style={styles.timeText}>{formatTime(checkInTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-out *</Text>
                <View style={styles.dateTimeRow}>
                  <Text style={styles.detailValue}>{checkOutDate}</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowCheckOutTimePicker(true)}
                  >
                    <Text style={styles.timeText}>{formatTime(checkOutTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={styles.specialRequestsLabel}>Kebutuhan Khusus Lainnya *</Text>
            <TextInput
              style={styles.specialRequestsInput}
              placeholder="berikan catatan tambahan"
              placeholderTextColor={THEME.textSecondary}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Terms Agreement */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Saya menyatakan bahwa informasi di atas benar dan setuju dengan syarat & ketentuan yang berlaku di Hotel.
            </Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && (
                  <MaterialIcons name="check" size={16} color={THEME.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Saya setuju</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.totalPrice}>Rp{price.toLocaleString('id-ID')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, !termsAccepted && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!termsAccepted}
          >
            <Text style={styles.submitButtonText}>Kirim Permintaan</Text>
          </TouchableOpacity>
        </View>

        {/* Time Pickers */}
        {showCheckInTimePicker && (
          <DateTimePicker
            testID="checkInTimePicker"
            value={checkInTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckInTimeChange}
          />
        )}
        {showCheckOutTimePicker && (
          <DateTimePicker
            testID="checkOutTimePicker"
            value={checkOutTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onCheckOutTimeChange}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    backgroundColor: THEME.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: THEME.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  sectionContent: {
    marginTop: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailRowWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
    textAlign: 'right',
  },
  changeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  petDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  healthQuestion: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: Spacing.md,
  },
  healthOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  healthOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    backgroundColor: THEME.white,
  },
  healthOptionSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  healthOptionSelectedNo: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  healthOptionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  healthOptionTextSelected: {
    color: THEME.white,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeButton: {
    backgroundColor: THEME.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  specialRequestsLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: Spacing.sm,
  },
  specialRequestsInput: {
    backgroundColor: THEME.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    minHeight: 100,
  },
  termsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
    marginTop: Spacing.sm,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
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
  totalPrice: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  submitButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
});
