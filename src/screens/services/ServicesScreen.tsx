import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
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

export default function ServicesScreen() {
  const navigation = useNavigation<NavigationProp>();


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jasa Aplikasi</Text>
        </View>

        {/* Services List */}
        <View style={styles.servicesContainer}>
          
          {/* Health Section */}
          <Text style={styles.sectionTitle}>Kesehatan</Text>
          
          {/* Doctor Service */}
          <TouchableOpacity
            style={[styles.serviceCard, { backgroundColor: '#00A6F5' }]}
            onPress={() => navigation.navigate('PetDoctor')}
          >
            <View style={styles.serviceContent}>
              <Image 
                source={require('../../../assets/services/docter.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceText}>Dokter</Text>
            </View>
            <View style={styles.serviceMascotContainer}>
              <Image
                source={require('../../../assets/services/doctor maskot.png')}
                style={styles.serviceMascot}
                resizeMode="contain"
              />
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" style={styles.chevronIcon} />
          </TouchableOpacity>

          {/* Care Section */}
          <Text style={styles.sectionTitle}>Perawatan</Text>
          
          {/* Grooming Service */}
          <TouchableOpacity
            style={[styles.serviceCard, { backgroundColor: '#FFCC00' }]}
            onPress={() => navigation.navigate('Grooming')}
          >
            <View style={styles.serviceContent}>
              <Image 
                source={require('../../../assets/services/salon.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceText}>Salon</Text>
            </View>
            <View style={styles.serviceMascotContainer}>
              <Image
                source={require('../../../assets/services/Grooming Maskot.png')}
                style={styles.serviceMascot}
                resizeMode="contain"
              />
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" style={styles.chevronIcon} />
          </TouchableOpacity>

          {/* Interaction Section */}
          <Text style={styles.sectionTitle}>Interaksi</Text>
          
          {/* Love Service */}
          <TouchableOpacity
            style={[styles.serviceCard, { backgroundColor: '#FFC0CB' }]}
            onPress={() => Alert.alert('Love', 'Fitur Pet Matchmaking akan segera hadir!')}
          >
            <View style={styles.serviceContent}>
              <Image 
                source={require('../../../assets/services/love.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceText}>Love</Text>
            </View>
            <View style={styles.serviceMascotContainer}>
              <Image
                source={require('../../../assets/services/interaction Maskot.png')}
                style={styles.serviceMascot}
                resizeMode="contain"
              />
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" style={styles.chevronIcon} />
          </TouchableOpacity>

          {/* Accommodation Section */}
          <Text style={styles.sectionTitle}>Layanan penitipan</Text>
          
          {/* Hotel Service */}
          <TouchableOpacity
            style={[styles.serviceCard, { backgroundColor: '#00C0FF' }]}
            onPress={() => Alert.alert('Hotel', 'Fitur Pet Hotel akan segera hadir!')}
          >
            <View style={styles.serviceContent}>
              <Image 
                source={require('../../../assets/services/hotel.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceText}>Hotel</Text>
            </View>
            <View style={styles.serviceMascotContainer}>
              <Image
                source={require('../../../assets/services/Hotel Maskot.png')}
                style={styles.serviceMascot}
                resizeMode="contain"
              />
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" style={styles.chevronIcon} />
          </TouchableOpacity>

          {/* Pet Sitter Service */}
          <TouchableOpacity
            style={[styles.serviceCard, { backgroundColor: '#FFD700' }]}
            onPress={() => Alert.alert('Pengasuh', 'Fitur Pet Sitter akan segera hadir!')}
          >
            <View style={styles.serviceContent}>
              <Image 
                source={require('../../../assets/services/penitipan.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceText}>Pengasuh</Text>
            </View>
            <View style={styles.serviceMascotContainer}>
              <Image
                source={require('../../../assets/services/Pet Maskot.png')}
                style={styles.serviceMascot}
                resizeMode="contain"
              />
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  servicesContainer: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
  },
  serviceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    position: 'relative',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    marginRight: Spacing.md,
  },
  serviceText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  serviceMascotContainer: {
    position: 'absolute',
    right: 40,
    bottom: -10,
    zIndex: 1,
  },
  serviceMascot: {
    width: 80,
    height: 80,
  },
  chevronIcon: {
    position: 'absolute',
    right: Spacing.sm,
    zIndex: 3,
  },
});