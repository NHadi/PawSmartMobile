import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'DoctorWalkIn'>;

interface Clinic {
  id: string;
  name: string;
  type: string;
  rating: number;
  location: string;
  distance: string;
  image: any;
  isOpen24: boolean;
}

const mockClinics: Clinic[] = [
  {
    id: '1',
    name: 'Banfield Hospital',
    type: 'Klinik Hewan',
    rating: 4.9,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
    isOpen24: true,
  },
  {
    id: '2',
    name: 'Banfield Hospital',
    type: 'Klinik Hewan',
    rating: 4.9,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
    isOpen24: false,
  },
  {
    id: '3',
    name: 'Hinsdale Hospital',
    type: 'Klinik Hewan',
    rating: 4.8,
    location: 'Tebet, Jakarta Selatan',
    distance: '2.1 km',
    image: require('../../../assets/product-placeholder.jpg'),
    isOpen24: true,
  },
  {
    id: '4',
    name: 'Pet Care Clinic',
    type: 'Klinik Hewan',
    rating: 4.7,
    location: 'Menteng, Jakarta Pusat',
    distance: '4.2 km',
    image: require('../../../assets/product-placeholder.jpg'),
    isOpen24: false,
  },
];

// Theme colors
const THEME = {
  primary: Colors.primary.main,
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  border: Colors.border.light,
  white: '#FFFFFF',
};

export default function DoctorWalkInScreen() {
  const navigation = useNavigation<NavigationProp>();

  const renderClinicCard = (clinic: Clinic, index: number) => (
    <TouchableOpacity
      key={clinic.id}
      style={[styles.clinicCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: clinic.id })}
      activeOpacity={0.7}
    >
      <View style={styles.clinicImageContainer}>
        <Image source={clinic.image} style={styles.clinicImage} resizeMode="cover" />
        {clinic.isOpen24 && (
          <View style={styles.badge24}>
            <Text style={styles.badge24Text}>24H</Text>
          </View>
        )}
      </View>

      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName} numberOfLines={1}>{clinic.name}</Text>
        <Text style={styles.clinicType}>{clinic.type}</Text>

        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{clinic.rating}</Text>
        </View>

        <Text style={styles.locationText} numberOfLines={1}>{clinic.location}</Text>
        <Text style={styles.distanceText}>{clinic.distance}</Text>
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
          <Text style={styles.headerTitle}>Dokter - Walk In</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={22} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lokasi</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location-outline" size={18} color={THEME.textSecondary} />
              <Text style={styles.locationCardText}>Tebet, Jakarta Selatan</Text>
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

          {/* Clinic Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi Klinik Untuk Kamu</Text>

            <View style={styles.clinicsGrid}>
              {mockClinics.map((clinic, index) => renderClinicCard(clinic, index))}
            </View>
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  locationCardText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
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
  clinicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clinicCard: {
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
  clinicImageContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
  },
  clinicImage: {
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
  clinicInfo: {
    padding: Spacing.md,
  },
  clinicName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  clinicType: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.primary,
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
  locationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
});
