import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
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

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'MyPets'>;

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

// Colors for pet image backgrounds
const petColors = ['#FF8A00', '#FFD700', '#FFA500', '#87CEEB', '#FF69B4', '#98D8C8'];

export default function MyPetsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const userPets = await petService.getPets();
      setPets(userPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      // Pets will be empty if there's an error
      setPets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPets();
  };

  // Group pets by type
  const petsByType = pets.reduce((acc, pet) => {
    const typeLabel = petTypeMapping[pet.type] || pet.type;
    if (!acc[typeLabel]) {
      acc[typeLabel] = [];
    }
    acc[typeLabel].push(pet);
    return acc;
  }, {} as Record<string, Pet[]>);

  const renderPetCard = (pet: Pet, index: number) => {
    if (!pet) return null;
    
    // Get a color based on pet ID or index
    const colorIndex = (pet.id || index) % petColors.length;
    const imageColor = petColors[colorIndex];
    
    return (
      <TouchableOpacity
        key={pet.id || index}
        style={styles.petCard}
        onPress={() => navigation.navigate('PetDetail', { petId: String(pet.id) })}
      >
      <ImageBackground
        source={require('../../../assets/background_pet_card.jpg')}
        style={styles.petCardBackground}
        imageStyle={styles.petCardBackgroundImage}
      >
        {/* Pet Icons */}
        <View style={styles.petIcons}>
          <MaterialIcons name="pets" size={16} color="white" style={styles.topLeftIcon} />
          <MaterialIcons name="pets" size={16} color="white" style={styles.topRightIcon} />
          <MaterialIcons name="pets" size={16} color="white" style={styles.bottomRightIcon} />
        </View>
        
        {/* Pet Image */}
        <View style={[styles.petImageContainer, { backgroundColor: imageColor }]}>
          {pet.photo ? (
            <Image 
              source={{ uri: pet.photo }} 
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
      </ImageBackground>
      
      {/* Pet Info */}
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name || 'Name Pet'}</Text>
        <Text style={styles.petBreed}>
          {petTypeMapping[pet.type] || pet.type || 'Unknown'}, {pet.breed || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  const renderPetSection = (type: string, pets: Pet[]) => {
    if (!pets || pets.length === 0) return null;
    
    // Create pairs of pets for 2-column layout
    const petPairs = [];
    for (let i = 0; i < pets.length; i += 2) {
      petPairs.push([pets[i], pets[i + 1]]);
    }

    return (
      <View key={type} style={styles.section}>
        <Text style={styles.sectionTitle}>{String(type)}</Text>
        {petPairs.map((pair, pairIndex) => (
          <View key={pairIndex} style={styles.petRow}>
            {pair[0] && renderPetCard(pair[0], pairIndex * 2)}
            {pair[1] ? renderPetCard(pair[1], pairIndex * 2 + 1) : <View style={styles.petCard} />}
          </View>
        ))}
      </View>
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
        <Text style={styles.headerTitle}>Peliharaan Saya</Text>
        <View style={styles.headerSpacer} />
      </View>

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
          {/* Pet Sections */}
          {Object.entries(petsByType).map(([type, pets]) => 
            renderPetSection(type, pets)
          )}

          {/* Empty State */}
          {pets.length === 0 && (
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
        onPress={() => navigation.navigate('AddPetLanding')}
      >
        <Text style={styles.addButtonText}>Tambah Hewan</Text>
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
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  petRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  petCard: {
    width: '48%',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petCardBackground: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petCardBackgroundImage: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  petIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  topLeftIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  topRightIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomRightIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  petImageContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
  },
  petInfo: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  petName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  petBreed: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    margin: Spacing.base,
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