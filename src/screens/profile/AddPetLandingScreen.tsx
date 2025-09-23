import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';
import petService, { Pet } from '../../services/petService';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'AddPetLanding'>;

// Map English pet types to Indonesian
const petTypeMapping: Record<string, string> = {
  'dog': 'Anjing',
  'cat': 'Kucing',
  'bird': 'Bird',
  'fish': 'Ikan',
  'rabbit': 'Kelinci',
  'hamster': 'Hamster',
  'other': 'Lainnya',
};

// Map gender to Indonesian
const genderMapping: Record<string, string> = {
  'male': 'Jantan',
  'female': 'Betina',
};

// Colors for pet backgrounds
const petColors = ['#FFE5E5', '#FFF4E6', '#E8F5E9', '#FFF3E0', '#E3F2FD'];

type FilterType = 'Semua' | 'Anjing' | 'Kucing' | 'Bird' | 'Ikan' | 'Kelinci' | 'Hamster' | 'Lainnya';

export default function AddPetLandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('Semua');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const userPets = await petService.getPets();
      setPets(userPets);
    } catch (error) {
      } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPets();
  };

  const filterOptions: FilterType[] = ['Semua', 'Anjing', 'Kucing', 'Bird'];

  const filteredPets = selectedFilter === 'Semua' 
    ? pets 
    : pets.filter(pet => {
        const petTypeIndo = petTypeMapping[pet.type] || pet.type;
        return petTypeIndo === selectedFilter;
      });

  const renderPetCard = (item: Pet, index: number) => {
    const colorIndex = (item.id || index) % petColors.length;
    const backgroundColor = petColors[colorIndex];
    const petTypeIndo = petTypeMapping[item.type] || item.type;
    const genderIndo = item.gender ? genderMapping[item.gender] || item.gender : 'Unknown';
    const ageText = item.age ? `${item.age} tahun` : '1 tahun';

    return (
      <TouchableOpacity
        key={item.id || index}
        style={styles.petCard}
        onPress={() => navigation.navigate('PetDetail', { petId: String(item.id) })}
      >
        <View style={styles.petCardContent}>
          <View style={styles.blueAccent} />
          <View style={[styles.petImageContainer, { backgroundColor }]}>
            {item.photo ? (
              <Image 
                source={{ uri: item.photo }} 
                style={styles.petImage}
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../../../assets/product-placeholder.jpg')} 
                style={styles.petImage}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{item.name || 'Name Pet'}</Text>
            <Text style={styles.petBreed}>{petTypeIndo}, {item.breed || 'Unknown'}</Text>
            <Text style={styles.petDetails}>{genderIndo}, {ageText}</Text>
          </View>
          <TouchableOpacity style={styles.chevronButton}>
            <MaterialIcons name="chevron-right" size={24} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Peliharaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Daftar Hewan Peliharaan</Text>
        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={styles.filterText}>{selectedFilter}</Text>
          <MaterialIcons 
            name={showFilterDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={Colors.primary.main} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <View style={styles.dropdownMenu}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.dropdownItem, selectedFilter === option && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedFilter(option);
                setShowFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownText, selectedFilter === option && styles.dropdownTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
            />
          }
        >
          {/* Pet Cards */}
          <View style={styles.petsList}>
            {filteredPets.map((pet, index) => renderPetCard(pet, index))}
          </View>
          
          {filteredPets.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="pets" size={80} color={Colors.text.secondary} />
              <Text style={styles.emptyTitle}>Belum Ada Peliharaan</Text>
              <Text style={styles.emptyDescription}>
                Tambahkan peliharaan pertama Anda
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Pet Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddPetStepOne')}
      >
        <Text style={styles.addButtonText}>Tambah Hewan Peliharaan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterSection: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  filterText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
    marginRight: Spacing.sm,
  },
  dropdownMenu: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  dropdownItemActive: {
    backgroundColor: Colors.background.tertiary,
  },
  dropdownText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dropdownTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  petsList: {
    backgroundColor: Colors.background.primary,
    marginTop: Spacing.sm,
  },
  petCard: {
    backgroundColor: Colors.background.primary,
  },
  petCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  blueAccent: {
    width: 4,
    height: 60,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  petImageContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  petBreed: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  petDetails: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  chevronButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    backgroundColor: Colors.background.primary,
    margin: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});