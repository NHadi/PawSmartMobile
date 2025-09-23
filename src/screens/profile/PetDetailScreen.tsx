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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';
import petService, { Pet } from '../../services/petService';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'PetDetail'>;
type RoutePropType = RouteProp<ProfileStackParamList, 'PetDetail'>;

interface PetData {
  id: string;
  name: string;
  type: string;
  breed: string;
  location: string;
  birthDate: string;
  age: string;
  gender: 'Jantan' | 'Betina';
  weight: string;
  healthCondition: string;
  allergies: string;
  notes: string;
  image?: any;
}

// Map English pet types to Indonesian
const petTypeMapping: Record<string, string> = {
  'dog': 'Anjing',
  'cat': 'Kucing',
  'bird': 'Burung',
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

export default function PetDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { petId } = route.params;
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    try {
      const petDetails = await petService.getPet(petId);
      if (petDetails) {
        setPet(petDetails);
      } else {
        Alert.alert('Error', 'Peliharaan tidak ditemukan', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail peliharaan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from birthDate
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const months = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return `${months} bulan`;
    }
    return `${age} tahun`;
  };

  // Convert pet data to display format
  const petData: PetData | null = pet ? {
    id: pet.id || petId,
    name: pet.name || 'Nama Hewan',
    type: petTypeMapping[pet.type] || pet.type || 'Unknown',
    breed: pet.breed || 'Unknown',
    location: pet.location || 'Jakarta',
    birthDate: pet.birthDate ? new Date(pet.birthDate).toLocaleDateString('id-ID') : '-',
    age: pet.birthDate ? calculateAge(pet.birthDate) : (pet.age ? `${pet.age} tahun` : '-'),
    gender: pet.gender ? genderMapping[pet.gender] || pet.gender : 'Unknown',
    weight: pet.weight ? `${pet.weight} kg` : '-',
    healthCondition: pet.healthStatus || 'Baik',
    allergies: pet.medicalHistory?.includes('Allergies:') 
      ? pet.medicalHistory.split('Allergies:')[1].split('\n')[0].trim() || '-'
      : '-',
    notes: pet.notes || '-',
    image: pet.photo ? { uri: pet.photo } : require('../../../assets/product-placeholder.jpg'),
  } : null;

  const handleEdit = () => {
    if (petData) {
      navigation.navigate('EditPet', { petId: petData.id });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Peliharaan',
      'Apakah Anda yakin ingin menghapus peliharaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await petService.deletePet(petId);
              Alert.alert('Berhasil', 'Peliharaan berhasil dihapus', [
                { text: 'OK', onPress: () => navigation.navigate('MyPets') }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus peliharaan');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Hewan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!petData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Hewan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Peliharaan tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Hewan</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <MaterialIcons name="delete" size={24} color={Colors.error.main} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Detail Profil Hewan</Text>
            <TouchableOpacity onPress={handleEdit}>
              <MaterialIcons name="edit" size={20} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <ImageBackground
              source={require('../../../assets/background_pet_card.jpg')}
              style={styles.cardBackground}
              imageStyle={styles.backgroundImage}
            >
              <View style={styles.pawIcons}>
                <Text style={styles.pawIcon}>🐾</Text>
                <Text style={[styles.pawIcon, styles.pawIconRight]}>🐾</Text>
              </View>
              
              <View style={[styles.petImageContainer, { backgroundColor: '#FF8C42' }]}>
                <Image
                  source={petData.image}
                  style={styles.petImage}
                  resizeMode="cover"
                />
              </View>
            </ImageBackground>

            <View style={styles.petBasicInfo}>
              <Text style={styles.petName}>{petData.name}</Text>
              <Text style={styles.petBreed}>
                {petData.type}, {petData.breed} • {petData.location}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <InfoRow label="Ras/Breed" value={petData.breed} />
            <InfoRow label="Tanggal Lahir / Adopsi" value={petData.birthDate} />
            <InfoRow label="Umur" value={petData.age} />
            <InfoRow label="Jenis Kelamin" value={petData.gender} />
            <InfoRow label="Berat" value={petData.weight} />
            <InfoRow label="Kondisi Kesehatan" value={petData.healthCondition} />
            <InfoRow label="Alergi Obat?" value={petData.allergies} />
            <InfoRow label="Catatan" value={petData.notes} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
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
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  detailTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  profileCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBackground: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  pawIcons: {
    position: 'absolute',
    top: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  pawIcon: {
    fontSize: 24,
    color: Colors.text.white,
    opacity: 0.8,
  },
  pawIconRight: {
    transform: [{ scaleX: -1 }],
  },
  petImageContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  petBasicInfo: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  petName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  petBreed: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  detailsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  infoLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'right',
    flex: 1,
  },
});