import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';
import DoctorService, { Doctor } from '../../services/DoctorService';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'DoctorSelection'>;

import { THEME } from '../../constants/theme';

export default function DoctorSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  const filterOptions = ['Semua', 'Dokter Hewan', 'Spesialis Bedah', 'Spesialis Kulit'];

  const fetchDoctors = async () => {
    try {
      const params: any = {
        limit: 50,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedFilter !== 'Semua') {
        // Map filter options to backend specialization query if needed
        // For now, passing specialization string, but "Semua" is ignored
        // params.specialization = selectedFilter; 
      }

      const response = await DoctorService.getDoctors(params);
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [searchQuery]); // Debounce usually recommended, but keeping simple

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors();
  }, []);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
  };

  const handleConfirmSelection = () => {
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    if (selectedDoctor) {
      navigation.navigate('DoctorDetail', { doctorId: selectedDoctor.id.toString() });
    }
  };

  const renderDoctorCard = (doctor: Doctor) => {
    const isSelected = selectedDoctorId === doctor.id;

    // Fallback image
    const imageSource = doctor.photo
      ? { uri: doctor.photo }
      : require('../../../assets/product-placeholder.jpg');

    return (
      <TouchableOpacity
        key={doctor.id}
        style={[
          styles.doctorCard,
          isSelected && styles.doctorCardSelected,
        ]}
        onPress={() => handleSelectDoctor(doctor)}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.doctorImage} />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialization}>{doctor.specialization || 'Dokter Hewan'}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{doctor.rating || '4.9'}</Text>
          </View>
        </View>
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerTitle}>Pilih Dokter</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={THEME.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari Dokter"
              placeholderTextColor={THEME.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
            <MaterialIcons
              name={showFilterDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={20}
              color={THEME.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown */}
        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterOption,
                  selectedFilter === option && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setSelectedFilter(option);
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === option && styles.filterOptionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Doctor List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {doctors.map(renderDoctorCard)}
            {doctors.length === 0 && (
              <Text style={styles.emptyText}>Tidak ada dokter ditemukan</Text>
            )}
          </ScrollView>
        )}

        {/* Confirm Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedDoctorId && styles.confirmButtonDisabled]}
            onPress={handleConfirmSelection}
            activeOpacity={0.8}
            disabled={!selectedDoctorId}
          >
            <Text style={styles.confirmButtonText}>Lanjut</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
    gap: Spacing.xs,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  filterDropdown: {
    position: 'absolute',
    top: 130,
    right: Spacing.lg,
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    minWidth: 150,
  },
  filterOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  filterOptionSelected: {
    backgroundColor: THEME.primaryLight,
  },
  filterOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  filterOptionTextSelected: {
    color: THEME.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  doctorCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: THEME.white,
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    marginBottom: Spacing.xs,
  },
  doctorSpecialization: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: THEME.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.primary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: THEME.background,
  },
  confirmButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: THEME.border,
    shadowOpacity: 0
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: THEME.textSecondary
  }
});
