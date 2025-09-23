import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'PetSelection'>;

interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: string;
  age: string;
  image: any;
}

const mockPets: Pet[] = [
  {
    id: '1',
    name: 'Name Pet',
    breed: 'Anjing, Chihuahua',
    gender: 'Jantan',
    age: '1 tahun',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Name Pet',
    breed: 'Anjing, Chihuahua',
    gender: 'Jantan',
    age: '1 tahun',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '3',
    name: 'Name Pet',
    breed: 'Anjing, Chihuahua',
    gender: 'Jantan',
    age: '1 tahun',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '4',
    name: 'Name Pet',
    breed: 'Anjing, Chihuahua',
    gender: 'Jantan',
    age: '1 tahun',
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '5',
    name: 'Name Pet',
    breed: 'Anjing, Chihuahua',
    gender: 'Jantan',
    age: '1 tahun',
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

export default function PetSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedPetId, setSelectedPetId] = useState<string>('1'); // Default to first pet
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  const handleSelectPet = () => {
    const selectedPet = mockPets.find(pet => pet.id === selectedPetId);
    if (selectedPet) {
      // Navigate back with selected pet data
      navigation.goBack();
      // In a real app, you'd pass the selected pet data back
      }
  };

  const renderPet = (pet: Pet) => (
    <TouchableOpacity
      key={pet.id}
      style={[
        styles.petCard,
        selectedPetId === pet.id && styles.petCardSelected
      ]}
      onPress={() => setSelectedPetId(pet.id)}
    >
      <View style={styles.selectionIndicator}>
        <MaterialIcons 
          name={selectedPetId === pet.id ? "radio-button-checked" : "radio-button-unchecked"} 
          size={24} 
          color={selectedPetId === pet.id ? Colors.primary.main : Colors.border.main} 
        />
      </View>
      
      <Image source={pet.image} style={styles.petImage} />
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>{pet.breed}</Text>
        <Text style={styles.petDetails}>{pet.gender}, {pet.age}</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Pilih Peliharaan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Daftar Hewan Peliharaan</Text>
          
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedFilter}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Pets List */}
        <View style={styles.petsList}>
          {mockPets.map(renderPet)}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPetId && styles.continueButtonDisabled
          ]}
          onPress={handleSelectPet}
          disabled={!selectedPetId}
        >
          <Text style={styles.continueButtonText}>Pilih Peliharaan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    paddingBottom: 100,
  },
  filterSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    alignSelf: 'flex-end',
    minWidth: 120,
  },
  filterText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
    marginRight: Spacing.sm,
  },
  petsList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 1,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  petCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.background.tertiary,
  },
  selectionIndicator: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
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
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  petBreed: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  petDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  continueButton: {
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
});