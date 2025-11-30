import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
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

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'ServicesHome'>;

interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  mascot: any;
  color: string;
  onPress: () => void;
}

export default function ServicesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  const healthCareServices: ServiceItem[] = [
    {
      id: 'doctor',
      title: 'Dokter',
      subtitle: 'Konsultasi',
      icon: require('../../../assets/services/docter.png'),
      mascot: require('../../../assets/services/doctor maskot.png'),
      color: '#5CB3FF',
      onPress: () => navigation.navigate('PetDoctor'),
    },
    {
      id: 'salon',
      title: 'Salon',
      subtitle: 'Perawatan',
      icon: require('../../../assets/services/salon.png'),
      mascot: require('../../../assets/services/Grooming Maskot.png'),
      color: '#5CB3FF',
      onPress: () => navigation.navigate('Grooming'),
    },
  ];

  const accommodationServices: ServiceItem[] = [
    {
      id: 'hotel',
      title: 'Hotel',
      subtitle: 'Penginapan',
      icon: require('../../../assets/services/hotel.png'),
      mascot: require('../../../assets/services/Hotel Maskot.png'),
      color: '#5CB3FF',
      onPress: () => navigation.navigate('Hotel'),
    },
    {
      id: 'pengasuh',
      title: 'Pengasuh',
      subtitle: 'Layanan Profesional',
      icon: require('../../../assets/services/penitipan.png'),
      mascot: require('../../../assets/services/Pet Maskot.png'),
      color: '#5CB3FF',
      onPress: () => Alert.alert('Pengasuh', 'Fitur Pet Sitter akan segera hadir!'),
    },
  ];

  const interactionServices: ServiceItem[] = [
    {
      id: 'love',
      title: 'Love',
      subtitle: 'Breeding & Breeding',
      icon: require('../../../assets/services/love.png'),
      mascot: require('../../../assets/services/interaction Maskot.png'),
      color: '#FF6B9D',
      onPress: () => Alert.alert('Love', 'Fitur Pet Matchmaking akan segera hadir!'),
    },
    {
      id: 'forum',
      title: 'Forum',
      subtitle: 'Berbagi cerita',
      icon: require('../../../assets/services/love.png'), // Using love icon as placeholder
      mascot: require('../../../assets/services/interaction Maskot.png'),
      color: '#5CB3FF',
      onPress: () => Alert.alert('Forum', 'Fitur Forum akan segera hadir!'),
    },
  ];

  const filterServices = (services: ServiceItem[]) => {
    if (!searchQuery.trim()) {
      return services;
    }
    const query = searchQuery.toLowerCase();
    return services.filter(service =>
      service.title.toLowerCase().includes(query) ||
      service.subtitle.toLowerCase().includes(query)
    );
  };

  const filteredHealthCare = filterServices(healthCareServices);
  const filteredAccommodation = filterServices(accommodationServices);
  const filteredInteraction = filterServices(interactionServices);

  const renderServiceItem = (service: ServiceItem) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceItem}
      onPress={service.onPress}
    >
      <View style={styles.serviceItemContent}>
        <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
          <Image source={service.icon} style={styles.serviceItemIcon} resizeMode="contain" />
        </View>
        <View style={styles.serviceTextContainer}>
          <Text style={styles.serviceItemTitle}>{service.title}</Text>
          <Text style={styles.serviceItemSubtitle}>{service.subtitle}</Text>
        </View>
      </View>
      <Image
        source={service.mascot}
        style={styles.serviceMascot}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <View style={styles.blueHeaderSection}>
        <SafeAreaView edges={['top']}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Find the Best Pet Services</Text>
              <Text style={styles.headerSubtitle}>Everything your furry friend needs in one place</Text>
            </View>
            <Image
              source={require('../../../assets/cat_service.png')}
              style={styles.headerCat}
              resizeMode="contain"
            />

            {/* Paw Print Decorations */}
            <View style={styles.pawPrint1}>
              <MaterialIcons name="pets" size={24} color="rgba(255, 255, 255, 0.3)" />
            </View>
            <View style={styles.pawPrint2}>
              <MaterialIcons name="pets" size={18} color="rgba(255, 255, 255, 0.25)" />
            </View>
            <View style={styles.pawPrint3}>
              <MaterialIcons name="pets" size={20} color="rgba(255, 255, 255, 0.2)" />
            </View>
            <View style={styles.pawPrint4}>
              <MaterialIcons name="pets" size={16} color="rgba(255, 255, 255, 0.25)" />
            </View>
            <View style={styles.pawPrint5}>
              <MaterialIcons name="pets" size={22} color="rgba(255, 255, 255, 0.2)" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari layanan..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Services Grid */}
        <View style={styles.servicesContainer}>
          {/* Health & Care Section */}
          {filteredHealthCare.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Perawatan & Kesehatan</Text>
              <View style={styles.servicesGrid}>
                {filteredHealthCare.map(service => renderServiceItem(service))}
              </View>
            </>
          )}

          {/* Accommodation Section */}
          {filteredAccommodation.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Layanan penitipan</Text>
              <View style={styles.servicesGrid}>
                {filteredAccommodation.map(service => renderServiceItem(service))}
              </View>
            </>
          )}

          {/* Interaction Section */}
          {filteredInteraction.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Interaksi</Text>
              <View style={styles.servicesGrid}>
                {filteredInteraction.map(service => renderServiceItem(service))}
              </View>
            </>
          )}

          {/* No Results Message */}
          {filteredHealthCare.length === 0 &&
           filteredAccommodation.length === 0 &&
           filteredInteraction.length === 0 &&
           searchQuery.trim() !== '' && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>Tidak ada layanan yang ditemukan</Text>
              <Text style={styles.noResultsSubtext}>Coba kata kunci lain</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  blueHeaderSection: {
    backgroundColor: '#1C49C2',
    paddingBottom: 40,
    position: 'relative',
  },
  headerBanner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 90,
  },
  headerContent: {
    flex: 1,
    paddingRight: 8,
    paddingTop: 4,
    maxWidth: '60%',
  },
  headerTitle: {
    fontSize: 21,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 5,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    opacity: 0.93,
    lineHeight: 16,
  },
  headerCat: {
    width: 115,
    height: 115,
    position: 'absolute',
    right: 5,
    bottom: -5,
  },
  // Paw Print Decorations
  pawPrint1: {
    position: 'absolute',
    left: 15,
    bottom: 10,
  },
  pawPrint2: {
    position: 'absolute',
    left: 50,
    top: 25,
  },
  pawPrint3: {
    position: 'absolute',
    right: 45,
    bottom: 15,
  },
  pawPrint4: {
    position: 'absolute',
    left: '35%',
    bottom: 5,
  },
  pawPrint5: {
    position: 'absolute',
    right: 120,
    top: 15,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
    padding: 0,
  },
  servicesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.semibold,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceItemContent: {
    flex: 1,
    flexDirection: 'column',
    zIndex: 2,
    paddingRight: 6,
  },
  serviceIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceItemIcon: {
    width: 28,
    height: 28,
  },
  serviceTextContainer: {
    marginTop: 3,
  },
  serviceItemTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1F2937',
    lineHeight: 19,
  },
  serviceItemSubtitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
    marginTop: 3,
    lineHeight: 14,
  },
  serviceMascot: {
    width: 78,
    height: 78,
    position: 'absolute',
    right: -10,
    bottom: -4,
    zIndex: 1,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
});