import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

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
    isOpen24: true,
  },
  {
    id: '3',
    name: 'Hinsdale Hospital',
    type: 'Klinik Hewan',
    rating: 4.9,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
    isOpen24: false,
  },
];

export default function DoctorWalkInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState('Terdekat');

  const filters = ['Terdekat', 'Populer', 'Harga'];

  const renderClinic = (clinic: Clinic) => (
    <TouchableOpacity
      key={clinic.id}
      style={styles.clinicCard}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: clinic.id })}
    >
      <View style={styles.clinicImageContainer}>
        <Image source={clinic.image} style={styles.clinicImage} />
        {clinic.isOpen24 && (
          <View style={styles.badge24}>
            <MaterialIcons name="access-time" size={12} color={Colors.text.white} />
            <Text style={styles.badge24Text}>24/7</Text>
          </View>
        )}
      </View>
      
      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName}>{clinic.name}</Text>
        <Text style={styles.clinicType}>{clinic.type}</Text>
        <View style={styles.clinicMeta}>
          <View style={styles.rating}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{clinic.rating}</Text>
          </View>
          <Text style={styles.location}>{clinic.location}</Text>
          <Text style={styles.distance}>{clinic.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Dokter - Walk In</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>Lokasi</Text>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color={Colors.text.secondary} />
            <Text style={styles.locationText}>Tebet, Jakarta Selatan</Text>
          </View>
        </View>

        {/* Recommendation Title */}
        <Text style={styles.recommendationTitle}>Rekomendasi Klinik Untuk Kamu</Text>

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

        {/* Clinic Grid */}
        <View style={styles.clinicsGrid}>
          {mockClinics.map(renderClinic)}
        </View>
      </ScrollView>
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
  searchButton: {
    padding: Spacing.sm,
  },
  locationSection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  locationLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
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
  clinicsGrid: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  clinicCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clinicImageContainer: {
    position: 'relative',
  },
  clinicImage: {
    width: '100%',
    height: 150,
  },
  badge24: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge24Text: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  clinicInfo: {
    padding: Spacing.md,
  },
  clinicName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  clinicType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  clinicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  location: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  distance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: 'auto',
  },
});