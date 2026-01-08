import React, { useState } from 'react';
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


// Theme colors
import { THEME } from '../../constants/theme';

import DoctorService, { Doctor as DoctorModel } from '../../services/DoctorService';
import { ActivityIndicator } from 'react-native';

export default function DoctorWalkInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [doctors, setDoctors] = useState<DoctorModel[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await DoctorService.getDoctors({ offers_walk_in: true });
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorCard = (doctor: DoctorModel, index: number) => (
    <TouchableOpacity
      key={doctor.id}
      style={[styles.clinicCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id.toString() })}
      activeOpacity={0.7}
    >
      <View style={styles.clinicImageContainer}>
        <Image
          source={doctor.photo ? { uri: doctor.photo } : require('../../../assets/product-placeholder.jpg')}
          style={styles.clinicImage}
          resizeMode="cover"
        />
        {doctor.is_available && (
          <View style={styles.badge24}>
            <Text style={styles.badge24Text}>24H</Text>
          </View>
        )}
      </View>

      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName} numberOfLines={1}>{doctor.name}</Text>
        <Text style={styles.clinicType} numberOfLines={1}>{doctor.specialization || 'Dokter Hewan'}</Text>

        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>{doctor.rating || 'N/A'}</Text>
        </View>

        <Text style={styles.locationText} numberOfLines={1}>{doctor.location || 'Jakarta'}</Text>
        <Text style={styles.distanceText}>1.2 km</Text>
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
            <Text style={styles.sectionTitle}>Rekomendasi Dokter Untuk Kamu</Text>

            {loading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.primary} />
              </View>
            ) : doctors.length > 0 ? (
              <View style={styles.clinicsGrid}>
                {doctors.map((doctor, index) => renderDoctorCard(doctor, index))}
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: THEME.textSecondary, marginTop: 20 }}>
                Tidak ada dokter Walk-In tersedia saat ini.
              </Text>
            )}
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
