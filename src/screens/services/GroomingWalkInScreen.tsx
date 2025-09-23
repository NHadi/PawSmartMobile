import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingWalkIn'>;

interface Salon {
  id: string;
  name: string;
  type: string;
  rating: number;
  price: number;
  location: string;
  distance: string;
  image: any;
}

const mockSalons: Salon[] = [
  {
    id: '1',
    name: 'Pets Corner',
    type: 'Pet Shop, Grooming Spa',
    rating: 4.9,
    price: 90000,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Pets Corner',
    type: 'Pet Shop, Grooming Spa',
    rating: 4.9,
    price: 90000,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '3',
    name: 'Pets Corner',
    type: 'Pet Shop, Grooming Spa',
    rating: 4.9,
    price: 90000,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '4',
    name: 'Pets Corner',
    type: 'Pet Shop, Grooming Spa',
    rating: 4.9,
    price: 90000,
    location: 'Karet, Jakarta Pusat',
    distance: '3.4 km',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

export default function GroomingWalkInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState('Terdekat');

  const filters = ['Terdekat', 'Populer', 'Harga'];

  const renderSalonCard = ({ item }: { item: Salon }) => (
    <TouchableOpacity
      style={styles.salonCard}
      onPress={() => navigation.navigate('GroomingDetail', { groomingId: item.id })}
    >
      <Image source={item.image} style={styles.salonImage} />
      
      <View style={styles.salonInfo}>
        <Text style={styles.salonName}>{item.name}</Text>
        <Text style={styles.salonType}>{item.type}</Text>
        
        <View style={styles.salonMeta}>
          <View style={styles.rating}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.salonPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
        
        <View style={styles.locationRow}>
          <Text style={styles.location}>{item.location}</Text>
          <Text style={styles.distance}>{item.distance}</Text>
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
        <Text style={styles.headerTitle}>Salon - Walk In</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Location */}
      <View style={styles.locationSection}>
        <MaterialIcons name="location-on" size={20} color={Colors.text.secondary} />
        <Text style={styles.locationText}>Tebet, Jakarta Selatan</Text>
      </View>

      {/* Mascot Banner */}
      <View style={styles.mascotBanner}>
        <Image
          source={require('../../../assets/mascot-happy.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Recommendation Title */}
      <Text style={styles.recommendationTitle}>Rekomendasi Salon Groomer Untuk Kamu</Text>

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

      {/* Salon Grid */}
      <FlatList
        data={mockSalons}
        renderItem={renderSalonCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.salonList}
        columnWrapperStyle={styles.salonRow}
        showsVerticalScrollIndicator={false}
      />
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
  mascotBanner: {
    backgroundColor: Colors.primary.main,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 150,
    height: 150,
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
  salonList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  salonRow: {
    justifyContent: 'space-between',
  },
  salonCard: {
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
  salonImage: {
    width: '100%',
    height: 120,
  },
  salonInfo: {
    padding: Spacing.sm,
  },
  salonName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  salonType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  salonMeta: {
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
  salonPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  location: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  distance: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
});